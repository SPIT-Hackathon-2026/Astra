'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, MapPin, Navigation, Search, Car, Footprints, Bike, Train,
    Loader, ChevronDown, ChevronUp, ArrowRightLeft, LocateFixed, Truck,
    Timer, Ruler, Route, Clock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import PaymentPanel from '../../components/journey/PaymentPanel';

// ─── Types ────────────────────────────────────────────
interface TransitLeg {
    type: 'walk' | 'train';
    from: { name: string };
    to: { name: string };
    duration: number;
    distance: number;
    line?: string;
    lineColor?: string;
    lineCode?: string;
    stops?: number;
    serviceName?: string;
    frequency?: string;
}

interface RouteResult {
    type: 'single' | 'transit';
    mode: string;
    modeName: string;
    modeColor: string;
    modeIcon: string;
    totalDistance: number;
    totalDuration: number;
    departureTime?: string;
    arrivalTime?: string;
    summary?: string;
    linesBadges?: { code: string; color: string }[];
    legs?: TransitLeg[];
    steps?: { instruction: string; distance: number; duration: number }[];
}

// ─── Helpers ──────────────────────────────────────────
const icons: Record<string, any> = { car: Car, walk: Footprints, bike: Bike, train: Train, auto: Truck };
function fmt(sec: number) { const m = Math.round(sec / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr ${m % 60} min`; }
function fmtD(m: number) { return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`; }

async function searchPlaces(q: string) {
    if (q.length < 3) return [];
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`);
        return (await r.json()).map((i: any) => ({ display: i.display_name, lat: +i.lat, lng: +i.lon }));
    } catch { return []; }
}

// ─── Component ────────────────────────────────────────
export default function PlanTripPage() {
    const router = useRouter();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [srcC, setSrcC] = useState<{ lat: number; lng: number } | null>(null);
    const [dstC, setDstC] = useState<{ lat: number; lng: number } | null>(null);
    const [srcSugg, setSrcSugg] = useState<any[]>([]);
    const [dstSugg, setDstSugg] = useState<any[]>([]);
    const [showSrc, setShowSrc] = useState(false);
    const [showDst, setShowDst] = useState(false);
    const [modes] = useState(['transit', 'drive', 'walk', 'bicycle', 'auto']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [routes, setRoutes] = useState<RouteResult[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [showSteps, setShowSteps] = useState(true);
    const srcT = useRef<NodeJS.Timeout | null>(null);
    const dstT = useRef<NodeJS.Timeout | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');

    const onSrc = (v: string) => { setSource(v); setSrcC(null); if (srcT.current) clearTimeout(srcT.current); srcT.current = setTimeout(async () => { const r = await searchPlaces(v); setSrcSugg(r); setShowSrc(r.length > 0); }, 300); };
    const onDst = (v: string) => { setDestination(v); setDstC(null); if (dstT.current) clearTimeout(dstT.current); dstT.current = setTimeout(async () => { const r = await searchPlaces(v); setDstSugg(r); setShowDst(r.length > 0); }, 300); };
    const pickSrc = (p: any) => { setSource(p.display.split(',').slice(0, 2).join(',')); setSrcC({ lat: p.lat, lng: p.lng }); setShowSrc(false); };
    const pickDst = (p: any) => { setDestination(p.display.split(',').slice(0, 2).join(',')); setDstC({ lat: p.lat, lng: p.lng }); setShowDst(false); };
    const swap = () => { setSource(destination); setDestination(source); setSrcC(dstC); setDstC(srcC); };
    const gps = () => {
        setGpsError('');
        if (!navigator.geolocation) { setGpsError('Geolocation not supported by your browser'); return; }
        setGpsLoading(true);
        setSource('Fetching location...');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setSrcC({ lat, lng });
                try {
                    const r = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
                    const data = await r.json();
                    if (data?.address) {
                        const addr = data.address;
                        // Build a short human-readable label
                        const label = [
                            addr.road || addr.pedestrian || addr.footway,
                            addr.suburb || addr.neighbourhood || addr.quarter,
                            addr.city || addr.town || addr.village || addr.county,
                        ].filter(Boolean).slice(0, 2).join(', ');
                        setSource(label || data.display_name.split(',').slice(0, 2).join(','));
                    } else {
                        setSource(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                    }
                } catch {
                    setSource(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                } finally {
                    setGpsLoading(false);
                }
            },
            (err) => {
                setGpsLoading(false);
                setSource('');
                if (err.code === 1) setGpsError('Location permission denied. Please allow access in your browser.');
                else if (err.code === 2) setGpsError('Unable to determine your location. Try again.');
                else setGpsError('Location request timed out. Try again.');
                setTimeout(() => setGpsError(''), 5000);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const search = async () => {
        setError(''); let fc = srcC, tc = dstC;
        if (!fc && source) { const r = await searchPlaces(source); if (r[0]) { fc = { lat: r[0].lat, lng: r[0].lng }; setSrcC(fc); } }
        if (!tc && destination) { const r = await searchPlaces(destination); if (r[0]) { tc = { lat: r[0].lat, lng: r[0].lng }; setDstC(tc); } }
        if (!fc || !tc) { setError('Enter valid locations'); return; }
        setIsLoading(true);
        try {
            const res = await fetch('/api/tripgo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromLat: fc.lat, fromLng: fc.lng, toLat: tc.lat, toLng: tc.lng, modes }) });
            const data = await res.json();
            if (!res.ok) { setError(data.error); setRoutes([]); } else { setRoutes(data.routes || []); setActiveIdx(0); setShowSteps(true); }
        } catch (e: any) { setError(e.message); }
        finally { setIsLoading(false); }
    };

    const active = routes[activeIdx];

    return (
        <div className="min-h-screen bg-rs-sand-light flex flex-col">
            {/* ─── Top Bar ─── */}
            <nav className="bg-white border-b border-rs-sand-dark sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-14 gap-3">
                        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-rs-sand"><ArrowLeft className="h-5 w-5 text-rs-deep-brown" /></button>
                        <span className="text-[15px] font-medium text-rs-deep-brown truncate">
                            {source && destination ? `${source.split(',')[0]} → ${destination.split(',')[0]}` : 'Plan your trip'}
                        </span>
                    </div>
                </div>
            </nav>

            {/* ─── Main Split ─── */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* ═══════ LEFT PANEL ═══════ */}
                <div className="w-full lg:w-[400px] lg:min-w-[400px] bg-white border-r border-rs-sand-dark lg:h-[calc(100vh-56px)] lg:overflow-y-auto lg:sticky lg:top-14 flex flex-col">

                    {/* Search inputs */}
                    <div className="p-4 border-b border-rs-sand">
                        <div className="flex gap-2.5">
                            {/* Timeline dots */}
                            <div className="flex flex-col items-center pt-2.5">
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-rs-terracotta" />
                                <div className="w-0.5 flex-1 bg-rs-sand-dark my-0.5 min-h-[32px]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-rs-dusty-red" />
                            </div>
                            <div className="flex-1 space-y-2">
                                {/* Source */}
                                <div className="relative">
                                    <div className="flex gap-1">
                                        <input type="text" placeholder="Choose starting point, or click on the map" value={source} onChange={e => onSrc(e.target.value)}
                                            onFocus={() => srcSugg.length > 0 && setShowSrc(true)} onBlur={() => setTimeout(() => setShowSrc(false), 200)}
                                            className="flex-1 px-3 py-2 bg-rs-sand rounded-lg text-[13px] text-rs-deep-brown placeholder:text-rs-desert-brown/60 focus:bg-white focus:ring-1 focus:ring-rs-terracotta border-0 outline-none" />
                                        <button
                                            onClick={gps}
                                            disabled={gpsLoading}
                                            title="Use my current location"
                                            className={`p-1.5 rounded-full transition-all flex-shrink-0 ${gpsLoading
                                                ? 'text-rs-terracotta bg-rs-terracotta/10 cursor-wait'
                                                : 'hover:bg-rs-terracotta/10 text-rs-terracotta hover:scale-110'
                                                }`}>
                                            {gpsLoading
                                                ? <Loader className="h-4 w-4 animate-spin" />
                                                : <LocateFixed className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {showSrc && <SuggestionList items={srcSugg} onSelect={pickSrc} />}
                                </div>
                                {/* Destination */}
                                <div className="relative">
                                    <input type="text" placeholder="Choose destination" value={destination} onChange={e => onDst(e.target.value)}
                                        onFocus={() => dstSugg.length > 0 && setShowDst(true)} onBlur={() => setTimeout(() => setShowDst(false), 200)}
                                        className="w-full px-3 py-2 bg-rs-sand rounded-lg text-[13px] text-rs-deep-brown placeholder:text-rs-desert-brown/60 focus:bg-white focus:ring-1 focus:ring-rs-terracotta border-0 outline-none" />
                                    {showDst && <SuggestionList items={dstSugg} onSelect={pickDst} />}
                                </div>
                            </div>
                            <button onClick={swap} className="self-center p-1.5 rounded-full hover:bg-rs-sand text-rs-desert-brown"><ArrowRightLeft className="h-4 w-4 rotate-90" /></button>
                        </div>

                        {/* Search button */}
                        <button onClick={search} disabled={isLoading || !source || !destination}
                            className="w-full mt-3 py-2.5 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange hover:opacity-90 disabled:opacity-40 disabled:from-rs-sand-dark disabled:to-rs-sand-dark text-white text-[13px] font-medium rounded-full flex items-center justify-center gap-2 transition-all">
                            {isLoading ? <><Loader className="h-4 w-4 animate-spin" /> Searching...</> : <><Search className="h-4 w-4" /> Search</>}
                        </button>
                    </div>

                    {(error || gpsError) && (
                        <div className="mx-4 mt-3 p-2.5 bg-rs-dusty-red/10 rounded-lg text-[13px] text-rs-dusty-red flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">⚠️</span>
                            <span>{error || gpsError}</span>
                        </div>
                    )}

                    {/* Route list */}
                    <div className="flex-1 overflow-y-auto">
                        {routes.map((r, i) => {
                            const IC = icons[r.modeIcon] || Navigation;
                            const isActive = activeIdx === i;
                            const isTransit = r.type === 'transit';
                            return (
                                <button key={i} onClick={() => { setActiveIdx(i); setShowSteps(true); }}
                                    className={`w-full text-left px-4 py-3 border-b border-rs-sand transition-colors ${isActive ? 'bg-rs-terracotta/5' : 'hover:bg-rs-sand/50'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: r.modeColor + '15' }}>
                                            <IC className="h-4 w-4" style={{ color: r.modeColor }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {isTransit && r.departureTime ? (
                                                <>
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[14px] font-semibold text-gray-900">{r.departureTime} – {r.arrivalTime}</span>
                                                        <span className="text-[12px] text-gray-500">({fmt(r.totalDuration)})</span>
                                                    </div>
                                                    {r.linesBadges && r.linesBadges.length > 0 && (
                                                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                                                            {r.legs?.map((leg, li) => (
                                                                <span key={li} className="flex items-center gap-0.5">
                                                                    {li > 0 && <span className="text-gray-300 text-[10px] mx-0.5">›</span>}
                                                                    {leg.type === 'walk' ? (
                                                                        <Footprints className="h-3 w-3 text-gray-400" />
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: leg.lineColor || r.modeColor }}>
                                                                            {leg.lineCode}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-[12px] text-gray-500 truncate">{r.summary}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-[14px] font-semibold text-gray-900">{r.modeName}</span>
                                                    <span className="text-[12px] text-gray-500 ml-2">{fmt(r.totalDuration)}</span>
                                                    <p className="text-[12px] text-gray-500">{fmtD(r.totalDistance)}</p>
                                                </>
                                            )}
                                        </div>
                                        {isActive && <div className="w-1 h-8 rounded-full mt-0.5" style={{ background: r.modeColor }} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══════ RIGHT PANEL ═══════ */}
                <div className="flex-1 bg-rs-sand-light lg:h-[calc(100vh-56px)] lg:overflow-y-auto">
                    {!routes.length && !isLoading && (
                        <div className="h-full flex items-center justify-center p-10">
                            <div className="text-center max-w-xs">
                                <div className="w-14 h-14 rounded-full bg-rs-sand flex items-center justify-center mx-auto mb-4"><Navigation className="h-7 w-7 text-rs-sand-dark" /></div>
                                <p className="text-[14px] text-rs-desert-brown">Enter source and destination to find routes</p>
                            </div>
                        </div>
                    )}
                    {isLoading && (
                        <div className="h-full flex items-center justify-center"><div className="text-center">
                            <Loader className="h-8 w-8 text-rs-terracotta animate-spin mx-auto mb-3" />
                            <p className="text-[13px] text-rs-desert-brown">Finding the best routes...</p>
                        </div></div>
                    )}

                    {active && (
                        <div className="p-5 sm:p-6 max-w-2xl mx-auto">
                            {/* ─── Transit Route ─── */}
                            {active.type === 'transit' && active.legs ? (
                                <div className="bg-white rounded-xl border border-rs-sand-dark overflow-hidden shadow-sm">
                                    {/* Header */}
                                    <div className="p-4 sm:p-5 border-b border-rs-sand">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[18px] font-semibold text-rs-deep-brown">{active.departureTime} – {active.arrivalTime}</span>
                                            <span className="text-[13px] text-rs-desert-brown">({fmt(active.totalDuration)})</span>
                                        </div>
                                        {active.linesBadges && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                                {active.legs.map((leg, i) => (
                                                    <span key={i} className="flex items-center gap-0.5">
                                                        {i > 0 && <span className="text-gray-300">›</span>}
                                                        {leg.type === 'walk' ? <Footprints className="h-3.5 w-3.5 text-gray-400" /> : (
                                                            <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: leg.lineColor }}>{leg.lineCode}</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-[12px] text-gray-500">{active.summary}</p>
                                    </div>

                                    {/* ─── Google Maps Timeline ─── */}
                                    <div className="p-4 sm:p-5">
                                        {active.legs.map((leg, li) => {
                                            const isWalk = leg.type === 'walk';
                                            const color = isWalk ? '#9CA3AF' : (leg.lineColor || '#1a73e8');
                                            const isFirst = li === 0;
                                            const isLast = li === active.legs!.length - 1;

                                            return (
                                                <div key={li}>
                                                    {/* FROM point */}
                                                    {(isFirst || li > 0) && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-14 text-right flex-shrink-0">
                                                                {!isWalk && <span className="text-[12px] font-medium text-gray-700">
                                                                    {li === 0 && active.departureTime}
                                                                </span>}
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-3 h-3 rounded-full border-2 bg-white`} style={{ borderColor: color }} />
                                                            </div>
                                                            <div className="pb-0">
                                                                <p className="text-[13px] font-semibold text-gray-900">{leg.from.name}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* LEG details */}
                                                    <div className="flex items-stretch gap-3">
                                                        <div className="w-14 flex-shrink-0" />
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex-1 min-h-[48px]" style={{
                                                                width: isWalk ? '2px' : '4px',
                                                                background: isWalk ? `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 3px, transparent 3px, transparent 7px)` : color,
                                                            }} />
                                                        </div>
                                                        <div className="flex-1 py-2">
                                                            {isWalk ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Footprints className="h-3.5 w-3.5 text-gray-400" />
                                                                    <span className="text-[12px] text-gray-500">Walk · About {leg.duration} min, {fmtD(leg.distance)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gray-50 rounded-lg p-2.5">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Train className="h-3.5 w-3.5" style={{ color }} />
                                                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: color }}>
                                                                            {leg.lineCode}
                                                                        </span>
                                                                        <span className="text-[12px] font-medium text-gray-700">{leg.serviceName}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                                        {leg.stops && <span>{leg.duration} min ({leg.stops} stops)</span>}
                                                                        {leg.frequency && <span>· {leg.frequency}</span>}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* TO point (only for last leg) */}
                                                    {isLast && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-14 text-right flex-shrink-0">
                                                                <span className="text-[12px] font-medium text-gray-700">{active.arrivalTime}</span>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                                            </div>
                                                            <p className="text-[13px] font-semibold text-gray-900">{leg.to.name}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : active.steps ? (
                                /* ─── Single Mode Route ─── */
                                <div className="bg-white rounded-xl border border-rs-sand-dark overflow-hidden shadow-sm">
                                    <div className="p-4 sm:p-5 border-b border-rs-sand">
                                        <div className="flex items-center gap-3 mb-3">
                                            {(() => {
                                                const IC = icons[active.modeIcon] || Navigation; return (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: active.modeColor + '15' }}>
                                                        <IC className="h-5 w-5" style={{ color: active.modeColor }} />
                                                    </div>
                                                );
                                            })()}
                                            <div>
                                                <h2 className="text-[16px] font-semibold text-gray-900">{active.modeName}</h2>
                                                <p className="text-[12px] text-gray-500">{source.split(',')[0]} → {destination.split(',')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <Timer className="h-4 w-4 mx-auto mb-1" style={{ color: active.modeColor }} />
                                                <p className="text-[16px] font-bold text-gray-900">{fmt(active.totalDuration)}</p>
                                                <p className="text-[11px] text-gray-500">Duration</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <Ruler className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                                                <p className="text-[16px] font-bold text-gray-900">{fmtD(active.totalDistance)}</p>
                                                <p className="text-[11px] text-gray-500">Distance</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Steps */}
                                    <button onClick={() => setShowSteps(!showSteps)} className="w-full px-4 sm:px-5 py-3 flex items-center justify-between border-b border-rs-sand hover:bg-rs-sand/30">
                                        <span className="text-[13px] font-medium text-rs-deep-brown flex items-center gap-2">
                                            <Route className="h-4 w-4" style={{ color: active.modeColor }} />
                                            Directions
                                            <span className="text-[11px] text-rs-desert-brown bg-rs-sand px-1.5 py-0.5 rounded">{active.steps!.length}</span>
                                        </span>
                                        {showSteps ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                    </button>

                                    {showSteps && (
                                        <div className="p-4 sm:p-5 space-y-0">
                                            {active.steps.map((step, si) => {
                                                const isLast = si === active.steps!.length - 1;
                                                return (
                                                    <div key={si} className="flex gap-3">
                                                        <div className="flex flex-col items-center w-4 flex-shrink-0">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${isLast ? 'bg-red-500' : 'border-2 bg-white'}`} style={{ borderColor: isLast ? undefined : active.modeColor }} />
                                                            {!isLast && <div className="w-0.5 flex-1 min-h-[20px]" style={{ background: active.modeColor + '30' }} />}
                                                        </div>
                                                        <div className={`flex-1 ${isLast ? '' : 'pb-3'}`}>
                                                            <p className="text-[13px] text-gray-700">{step.instruction}</p>
                                                            {step.distance > 0 && (
                                                                <p className="text-[11px] text-gray-400 mt-0.5">{fmtD(step.distance)} · {fmt(step.duration)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* ── Payment Panel ── */}
                            <PaymentPanel
                                source={source}
                                destination={destination}
                                sourceCoords={srcC}
                                destCoords={dstC}
                                activeRoute={active}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Suggestion dropdown
function SuggestionList({ items, onSelect }: { items: any[]; onSelect: (p: any) => void }) {
    return (
        <div className="absolute z-30 mt-1 w-full bg-white border border-rs-sand-dark rounded-lg shadow-lg max-h-44 overflow-y-auto">
            {items.map((s: any, i: number) => (
                <button key={i} onClick={() => onSelect(s)} className="w-full text-left px-3 py-2.5 text-[12px] text-rs-deep-brown hover:bg-rs-terracotta/5 border-b border-rs-sand last:border-0 flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{s.display}</span>
                </button>
            ))}
        </div>
    );
}

