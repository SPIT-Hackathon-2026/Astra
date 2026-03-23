'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Eye, MapPin, Navigation } from 'lucide-react';

interface StreetViewVRProps {
    lat: number;
    lng: number;
    name: string;
    onClose: () => void;
}

export default function StreetViewVR({ lat, lng, name, onClose }: StreetViewVRProps) {
    const panoRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [heading, setHeading] = useState(0);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    useEffect(() => {
        if (!apiKey || !panoRef.current) {
            setError(true);
            return;
        }

        const scriptId = 'google-maps-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        const initPano = () => {
            if (!(window as any).google?.maps) {
                setError(true);
                return;
            }

            const sv = new (window as any).google.maps.StreetViewService();
            const panorama = new (window as any).google.maps.StreetViewPanorama(panoRef.current, {
                position: { lat, lng },
                pov: { heading: 0, pitch: 0 },
                zoom: 1,
                addressControl: false,
                showRoadLabels: true,
                motionTracking: true,
                motionTrackingControl: true,
                fullscreenControl: true,
                linksControl: true,
                enableCloseButton: false,
            });

            sv.getPanorama(
                { location: { lat, lng }, radius: 500 },
                (data: any, status: string) => {
                    if (status === 'OK') {
                        panorama.setPosition(data.location.latLng);
                        setIsLoaded(true);
                    } else {
                        sv.getPanorama(
                            { location: { lat, lng }, radius: 5000 },
                            (data2: any, status2: string) => {
                                if (status2 === 'OK') {
                                    panorama.setPosition(data2.location.latLng);
                                    setIsLoaded(true);
                                } else {
                                    setError(true);
                                }
                            }
                        );
                    }
                }
            );

            panorama.addListener('pov_changed', () => {
                setHeading(Math.round(panorama.getPov().heading));
            });
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = () => initPano();
            script.onerror = () => setError(true);
            document.head.appendChild(script);
        } else if ((window as any).google?.maps) {
            initPano();
        } else {
            script.addEventListener('load', initPano);
        }
    }, [lat, lng, apiKey]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full h-full max-w-6xl max-h-[90vh] m-4 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: '#1A1028' }}>

                <div className="flex items-center justify-between px-5 py-3" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <Eye className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{name}</h3>
                            <p className="text-white/70 text-[11px]">360° Street View • Drag to explore</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLoaded && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                <Navigation className="h-3 w-3" style={{ transform: `rotate(${heading}deg)` }} />
                                {heading}°
                            </div>
                        )}
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <X className="h-4 w-4 text-white" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <div ref={panoRef} className="w-full h-full" />

                    {!isLoaded && !error && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1A1028' }}>
                            <div className="text-center">
                                <div className="w-14 h-14 border-[3px] rounded-full animate-spin mx-auto mb-4"
                                    style={{ borderColor: 'rgba(199, 91, 57, 0.3)', borderTopColor: '#C75B39' }} />
                                <p className="text-white font-semibold">Loading VR View...</p>
                                <p className="text-white/50 text-sm mt-1">Finding 360° panorama for {name}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1A1028' }}>
                            <div className="text-center max-w-md p-8">
                                <MapPin className="h-16 w-16 mx-auto mb-4" style={{ color: '#C75B39' }} />
                                <h3 className="text-white text-xl font-bold mb-2">No Street View Available</h3>
                                <p className="text-white/60 text-sm mb-1">360° imagery isn&apos;t available for this exact location.</p>
                                <p className="text-white/40 text-xs mb-6">{name} ({lat.toFixed(4)}, {lng.toFixed(4)})</p>
                                {apiKey && (
                                    <div className="rounded-xl overflow-hidden mb-4" style={{ border: '2px solid rgba(199,91,57,0.3)' }}>
                                        <iframe
                                            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15&maptype=satellite`}
                                            width="100%"
                                            height="250"
                                            style={{ border: 0 }}
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <button onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {isLoaded && (
                    <div className="px-5 py-2.5 flex items-center justify-between text-[11px]" style={{ background: '#0f0a17' }}>
                        <div className="flex items-center gap-4 text-white/50">
                            <span>🖱️ Drag to look around</span>
                            <span>🔍 Scroll to zoom</span>
                            <span>📍 Click arrows to move</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/30">
                            <MapPin className="h-3 w-3" />
                            <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
