'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface MapMarker {
    lat: number;
    lng: number;
    title: string;
    type?: 'spot' | 'source' | 'destination' | 'food' | 'hotel';
    isSelected?: boolean;
    description?: string;
}

interface TripMapProps {
    markers: MapMarker[];
    source?: { lat: number; lng: number; name: string };
    destination?: { lat: number; lng: number; name: string };
    className?: string;
    height?: string;
}

export default function TripMap({ markers, source, destination, className = '', height = '400px' }: TripMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        // Small delay to ensure DOM is ready and avoid StrictMode double-init race
        const timer = setTimeout(() => {
            if (!mapContainerRef.current || !mountedRef.current) return;
            initMap();
        }, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            // Cleanup map
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.off();
                    mapInstanceRef.current.remove();
                } catch (e) { /* ignore */ }
                mapInstanceRef.current = null;
            }
        };
    }, []);

    async function initMap() {
        try {
            const container = mapContainerRef.current;
            if (!container || !mountedRef.current) return;

            // If container already has leaflet instance, clean it up
            if ((container as any)._leaflet_id) {
                delete (container as any)._leaflet_id;
            }

            const L = (await import('leaflet')).default;
            if (!mountedRef.current) return;

            // Fix default marker icons
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            // Calculate center from all points
            const allPoints = [
                ...(source ? [{ lat: source.lat, lng: source.lng }] : []),
                ...(destination ? [{ lat: destination.lat, lng: destination.lng }] : []),
                ...markers.filter(m => m.lat && m.lng),
            ];

            const center: [number, number] = allPoints.length > 0
                ? [
                    allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length,
                    allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length,
                ]
                : [20.5937, 78.9629];

            const map = L.map(container, {
                center,
                zoom: allPoints.length > 1 ? 7 : allPoints.length === 1 ? 11 : 5,
                zoomControl: true,
                attributionControl: true,
            });

            mapInstanceRef.current = map;

            // CartoDB Voyager tiles – beautiful, free, no API key
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }).addTo(map);

            // Custom icon creator
            const createIcon = (color: string, emoji: string, size: number = 32) => {
                return L.divIcon({
                    html: `<div style="
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          "><span style="transform: rotate(45deg); font-size: ${size * 0.4}px;">${emoji}</span></div>`,
                    className: '',
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size],
                    popupAnchor: [0, -size],
                });
            };

            // Source marker
            if (source) {
                L.marker([source.lat, source.lng], {
                    icon: createIcon('#40C9B0', '🚀', 36),
                })
                    .addTo(map)
                    .bindPopup(`<div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #40C9B0;">📍 Start</strong><br/>
            <span style="font-size: 13px;">${source.name}</span>
          </div>`);
            }

            // Destination marker
            if (destination) {
                L.marker([destination.lat, destination.lng], {
                    icon: createIcon('#C75B39', '🎯', 36),
                })
                    .addTo(map)
                    .bindPopup(`<div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #C75B39;">📍 Destination</strong><br/>
            <span style="font-size: 13px;">${destination.name}</span>
          </div>`);
            }

            // Draw route line between source and destination via OSRM
            if (source && destination) {
                try {
                    const res = await fetch(
                        `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
                    );
                    const data = await res.json();
                    if (mountedRef.current && data.routes?.[0]?.geometry) {
                        L.geoJSON(data.routes[0].geometry, {
                            style: {
                                color: '#C75B39',
                                weight: 4,
                                opacity: 0.75,
                                dashArray: '10, 8',
                            },
                        }).addTo(map);
                    }
                } catch {
                    // Fallback: straight dashed line
                    if (mountedRef.current) {
                        L.polyline(
                            [[source.lat, source.lng], [destination.lat, destination.lng]],
                            { color: '#C75B39', weight: 3, dashArray: '10, 8', opacity: 0.6 }
                        ).addTo(map);
                    }
                }
            }

            // Tourist spot markers
            const typeConfig: Record<string, { color: string; emoji: string }> = {
                spot: { color: '#E8842A', emoji: '📸' },
                food: { color: '#B5453A', emoji: '🍽️' },
                hotel: { color: '#7B4F91', emoji: '🏨' },
                source: { color: '#40C9B0', emoji: '🚀' },
                destination: { color: '#C75B39', emoji: '🎯' },
            };

            markers.forEach((marker) => {
                if (!marker.lat || !marker.lng) return;
                const config = typeConfig[marker.type || 'spot'];
                const icon = createIcon(
                    marker.isSelected ? '#C75B39' : config.color,
                    config.emoji,
                    marker.isSelected ? 34 : 28
                );

                L.marker([marker.lat, marker.lng], { icon })
                    .addTo(map)
                    .bindPopup(`<div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
            <strong style="color: #3D2B1F; font-size: 14px;">${marker.title}</strong>
            ${marker.description ? `<br/><span style="font-size: 12px; color: #8B6D47;">${marker.description}</span>` : ''}
            ${marker.isSelected ? '<br/><span style="color: #C75B39; font-size: 11px; font-weight: bold;">✓ Selected</span>' : ''}
          </div>`);
            });

            // Fit bounds to show all markers (deferred to ensure container is ready)
            if (allPoints.length > 1) {
                setTimeout(() => {
                    if (!mountedRef.current || !mapInstanceRef.current) return;
                    try {
                        mapInstanceRef.current.invalidateSize();
                        const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng] as [number, number]));
                        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
                    } catch (e) {
                        console.warn('fitBounds deferred error:', e);
                    }
                }, 200);
            }

            if (mountedRef.current) {
                setIsLoaded(true);
            }

            setTimeout(() => {
                if (mountedRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 300);

        } catch (err) {
            console.error('Map init error:', err);
            if (mountedRef.current) setMapError(true);
        }
    }

    if (mapError) {
        return (
            <div className={`rounded-xl overflow-hidden ${className}`} style={{ height, background: 'linear-gradient(135deg, #FDE4D5, #F5E6D3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center p-8">
                    <MapPin className="h-12 w-12 mx-auto mb-3" style={{ color: '#C75B39' }} />
                    <p className="font-semibold" style={{ color: '#3D2B1F' }}>Map couldn&apos;t load</p>
                    <p className="text-sm mt-1" style={{ color: '#8B6D47' }}>Check your internet connection</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height, border: '2px solid #DFC9AD' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Loading overlay */}
            {!isLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDE4D5, #F5E6D3)' }}>
                    <div className="text-center">
                        <div className="w-10 h-10 border-[3px] rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#DFC9AD', borderTopColor: '#C75B39' }} />
                        <p className="text-sm font-medium" style={{ color: '#8B6D47' }}>Loading map...</p>
                    </div>
                </div>
            )}

            {/* Map legend */}
            {isLoaded && (source || destination || markers.length > 0) && (
                <div className="absolute bottom-3 left-3 rounded-lg px-3 py-2 shadow-md z-[1000]" style={{ background: 'rgba(253, 246, 237, 0.95)', border: '1px solid #DFC9AD' }}>
                    <div className="flex items-center gap-3 text-[10px] font-semibold" style={{ color: '#3D2B1F' }}>
                        {source && (
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#40C9B0' }} /> {source.name}
                            </span>
                        )}
                        {destination && (
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#C75B39' }} /> {destination.name}
                            </span>
                        )}
                        {markers.length > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#E8842A' }} /> {markers.length} spots
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
