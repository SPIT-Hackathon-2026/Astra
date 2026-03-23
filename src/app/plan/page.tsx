'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    ArrowLeft, MapPin, Navigation, Search, Car, Footprints, Bike, Train,
    Loader, ChevronDown, ChevronUp, ArrowRightLeft, LocateFixed, Truck,
    Timer, Ruler, Route, Clock, IndianRupee, Zap, Shield as ShieldIcon, Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import PaymentPanel from '../../components/journey/PaymentPanel';

const TripMap = dynamic(() => import('../../components/trip/TripMap'), {
    ssr: false,
    loading: () => (
        <div className="rounded-xl h-full min-h-[300px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDE4D5, #F5E6D3)', border: '2px solid #DFC9AD' }}>
            <div className="text-center">
                <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#DFC9AD', borderTopColor: '#C75B39' }} />
                <p className="text-sm font-medium" style={{ color: '#8B6D47' }}>Loading map...</p>
            </div>
        </div>
    ),
});

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
    fare?: number;
    linesBadges?: { code: string; color: string }[];
    legs?: TransitLeg[];
    steps?: { instruction: string; distance: number; duration: number }[];
    trafficInfo?: string;
}

// ─── Helpers ──────────────────────────────────────────
const icons: Record<string, any> = { car: Car, walk: Footprints, bike: Bike, train: Train, auto: Truck };
function fmt(sec: number) { const m = Math.round(sec / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`; }
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
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FDF6ED, #F5E6D3)' }}>
            {/* ─── Top Bar ─── */}
            <nav className="bg-white/95 backdrop-blur-xl border-b sticky top-0 z-50" style={{ borderColor: '#DFC9AD' }}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-14 gap-3">
                        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-[#F5E6D3] transition-colors">
                            <ArrowLeft className="h-5 w-5" style={{ color: '#3D2B1F' }} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                                <Navigation className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-[15px] font-semibold truncate" style={{ color: '#3D2B1F' }}>
                                {source && destination ? `${source.split(',')[0]} → ${destination.split(',')[0]}` : 'City Trip Planner'}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Main Layout ─── */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* ═══════ LEFT PANEL ═══════ */}
                <div className="w-full lg:w-[420px] lg:min-w-[420px] bg-white border-r lg:h-[calc(100vh-56px)] lg:overflow-y-auto lg:sticky lg:top-14 flex flex-col" style={{ borderColor: '#DFC9AD' }}>

                    {/* Search inputs */}
                    <div className="p-4 border-b" style={{ borderColor: '#DFC9AD' }}>
                        <div className="flex gap-2.5">
                            {/* Timeline dots */}
                            <div className="flex flex-col items-center pt-2.5">
                                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#40C9B0' }} />
                                <div className="w-0.5 flex-1 my-0.5 min-h-[32px]" style={{ background: '#DFC9AD' }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: '#C75B39' }} />
                            </div>
                            <div className="flex-1 space-y-2">
                                {/* Source */}
                                <div className="relative">
                                    <div className="flex gap-1">
                                        <input type="text" placeholder="Choose starting point, or click 📍"
                                            value={source} onChange={e => onSrc(e.target.value)}
                                            onFocus={() => srcSugg.length > 0 && setShowSrc(true)}
                                            onBlur={() => setTimeout(() => setShowSrc(false), 200)}
                                            className="flex-1 px-3 py-2.5 rounded-xl text-[13px] font-medium focus:ring-2 border-0 outline-none transition-all"
                                            style={{ background: '#FDF6ED', color: '#3D2B1F', ...(srcC ? { borderLeft: '3px solid #40C9B0' } : {}) }}
                                        />
                                        <button onClick={gps} disabled={gpsLoading} title="Use my current location"
                                            className="p-2 rounded-xl transition-all flex-shrink-0 hover:scale-110"
                                            style={{ background: gpsLoading ? 'rgba(199,91,57,0.1)' : 'transparent', color: '#C75B39' }}>
                                            {gpsLoading ? <Loader className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {showSrc && <SuggestionList items={srcSugg} onSelect={pickSrc} />}
                                </div>
                                {/* Destination */}
                                <div className="relative">
                                    <input type="text" placeholder="Where are you going?"
                                        value={destination} onChange={e => onDst(e.target.value)}
                                        onFocus={() => dstSugg.length > 0 && setShowDst(true)}
                                        onBlur={() => setTimeout(() => setShowDst(false), 200)}
                                        className="w-full px-3 py-2.5 rounded-xl text-[13px] font-medium focus:ring-2 border-0 outline-none transition-all"
                                        style={{ background: '#FDF6ED', color: '#3D2B1F', ...(dstC ? { borderLeft: '3px solid #C75B39' } : {}) }}
                                    />
                                    {showDst && <SuggestionList items={dstSugg} onSelect={pickDst} />}
                                </div>
                            </div>
                            <button onClick={swap} className="self-center p-1.5 rounded-full hover:bg-[#FDF6ED] transition-colors" style={{ color: '#8B6D47' }}>
                                <ArrowRightLeft className="h-4 w-4 rotate-90" />
                            </button>
                        </div>

                        {/* Search button */}
                        <button onClick={search} disabled={isLoading || !source || !destination}
                            className="w-full mt-3 py-3 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
                            style={{ background: isLoading || !source || !destination ? '#DFC9AD' : 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                            {isLoading ? <><Loader className="h-4 w-4 animate-spin" /> Searching routes...</> : <><Search className="h-4 w-4" /> Find Routes</>}
                        </button>
                    </div>

                    {(error || gpsError) && (
                        <div className="mx-4 mt-3 p-2.5 rounded-lg text-[13px] flex items-start gap-2" style={{ background: 'rgba(181,69,58,0.1)', color: '#B5453A' }}>
                            <span className="flex-shrink-0 mt-0.5">⚠️</span>
                            <span>{error || gpsError}</span>
                        </div>
                    )}

                    {/* Route list */}
                    <div className="flex-1 overflow-y-auto">
                        {routes.length > 0 && (
                            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8B6D47' }}>
                                    {routes.length} routes found
                                </p>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(64,201,176,0.1)' }}>
                                    <Zap className="h-3 w-3" style={{ color: '#40C9B0' }} />
                                    <span className="text-[9px] font-bold uppercase" style={{ color: '#40C9B0' }}>Faster options</span>
                                </div>
                            </div>
                        )}
                        {routes.map((r, i) => {
                            const IC = icons[r.modeIcon] || Navigation;
                            const isActive = activeIdx === i;
                            const isTransit = r.type === 'transit';

                            // Calculate "Insights"
                            const co2Saved = r.modeIcon === 'train' || r.modeIcon === 'bus' ? Math.round(r.totalDistance * 0.12 / 1000) : 0;
                            const calories = r.modeIcon === 'walk' ? Math.round(r.totalDistance * 0.05) : r.modeIcon === 'bike' ? Math.round(r.totalDistance * 0.03) : 0;

                            return (
                                <button key={i} onClick={() => { setActiveIdx(i); setShowSteps(true); }}
                                    className={`w-full text-left px-4 py-3.5 border-b transition-all ${isActive ? 'border-l-[4px]' : 'hover:bg-[#FDF6ED]/50'}`}
                                    style={{ borderColor: '#DFC9AD', ...(isActive ? { borderLeftColor: r.modeColor, background: `${r.modeColor}08` } : {}) }}>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: isActive ? r.modeColor : r.modeColor + '12' }}>
                                            <IC className="h-4 w-4" style={{ color: isActive ? 'white' : r.modeColor }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[14px] font-bold" style={{ color: '#3D2B1F' }}>{r.modeName}</span>
                                                {r.fare !== undefined && r.fare > 0 && (
                                                    <span className="text-[13px] font-black" style={{ color: '#3D2B1F' }}>₹{r.fare}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[12px] font-medium" style={{ color: r.trafficInfo?.includes('Heavy') ? '#B5453A' : '#3D2B1F' }}>
                                                    {fmt(r.totalDuration)}
                                                </span>
                                                <span className="text-[10px]" style={{ color: '#8B6D47' }}>• {fmtD(r.totalDistance)}</span>
                                            </div>

                                            {/* Insight badges */}
                                            <div className="flex items-center gap-2 mt-2">
                                                {co2Saved > 0 && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(64,201,176,0.1)', color: '#40C9B0' }}>
                                                        🌿 -{co2Saved}kg CO2
                                                    </span>
                                                )}
                                                {calories > 0 && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(232,132,42,0.1)', color: '#E8842A' }}>
                                                        🔥 {calories} kcal
                                                    </span>
                                                )}
                                                {r.trafficInfo && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg" style={{
                                                        background: r.trafficInfo.includes('Heavy') ? 'rgba(181,69,58,0.1)' : 'rgba(64,201,176,0.1)',
                                                        color: r.trafficInfo.includes('Heavy') ? '#B5453A' : '#40C9B0',
                                                    }}>{r.trafficInfo}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══════ RIGHT PANEL ═══════ */}
                <div className="flex-1 lg:h-[calc(100vh-56px)] lg:overflow-y-auto">
                    {!routes.length && !isLoading && (
                        <div className="h-full flex flex-col">
                            {/* Map placeholder or actual map when coords are set */}
                            {srcC && dstC ? (
                                <div className="flex-1 min-h-[400px]">
                                    <TripMap
                                        key={`map-${srcC.lat}-${dstC.lat}`}
                                        markers={[]}
                                        source={{ ...srcC, name: source.split(',')[0] }}
                                        destination={{ ...dstC, name: destination.split(',')[0] }}
                                        height="100%"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center p-10">
                                    <div className="text-center max-w-xs">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(199,91,57,0.1), rgba(232,132,42,0.1))' }}>
                                            <Navigation className="h-8 w-8" style={{ color: '#C75B39' }} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2" style={{ color: '#3D2B1F' }}>Plan Your City Trip</h3>
                                        <p className="text-[14px]" style={{ color: '#8B6D47' }}>Enter source & destination to find the best routes with live fare estimates, maps, and booking</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {isLoading && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <Loader className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: '#C75B39' }} />
                                <p className="font-semibold" style={{ color: '#3D2B1F' }}>Finding the best routes...</p>
                                <p className="text-sm mt-1" style={{ color: '#8B6D47' }}>Checking transit, driving, walking & cycling</p>
                            </div>
                        </div>
                    )}

                    {active && (
                        <div className="flex flex-col h-full bg-[#FDF6ED]/30">
                            {/* Map */}
                            {srcC && dstC && (
                                <div className="h-[320px] lg:h-[420px] flex-shrink-0 relative group">
                                    <TripMap
                                        key={`map-route-${srcC.lat}-${dstC.lat}-${activeIdx}`}
                                        markers={[]}
                                        source={{ ...srcC, name: source.split(',')[0] }}
                                        destination={{ ...dstC, name: destination.split(',')[0] }}
                                        height="100%"
                                        className="rounded-none border-0"
                                    />
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur shadow-sm border text-[11px] font-bold" style={{ borderColor: '#DFC9AD', color: '#3D2B1F' }}>
                                            Live Traffic Updated
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Route details */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
                                {/* Mode Insight Header */}
                                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white shadow-sm border-2" style={{ borderColor: '#DFC9AD' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: active.modeColor + '12' }}>
                                            {(() => { const IC = icons[active.modeIcon] || Navigation; return <IC className="h-7 w-7" style={{ color: active.modeColor }} /> })()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black" style={{ color: '#3D2B1F' }}>{active.modeName} Efficiency</h2>
                                            <p className="text-sm" style={{ color: '#8B6D47' }}>The smart choice for this timing.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-center px-4 py-2 rounded-xl bg-[#FDF6ED] border border-[#DFC9AD]/50">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B6D47]">Reach By</p>
                                            <p className="text-lg font-black text-[#C75B39]">
                                                {(() => {
                                                    const now = new Date();
                                                    now.setSeconds(now.getSeconds() + active.totalDuration);
                                                    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                })()}
                                            </p>
                                        </div>
                                        {active.fare !== undefined && active.fare > 0 && (
                                            <div className="text-center px-4 py-2 rounded-xl bg-[#FDF6ED] border border-[#DFC9AD]/50">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B6D47]">Wallet</p>
                                                <p className="text-lg font-black text-[#40C9B0]">₹{active.fare}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Grid stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="p-4 rounded-2xl bg-white border border-[#DFC9AD]/40">
                                        <Clock className="h-4 w-4 mb-1" style={{ color: '#8B6D47' }} />
                                        <p className="text-[10px] font-bold uppercase text-[#8B6D47]">Duration</p>
                                        <p className="text-lg font-bold text-[#3D2B1F]">{fmt(active.totalDuration)}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#DFC9AD]/40">
                                        <Ruler className="h-4 w-4 mb-1" style={{ color: '#8B6D47' }} />
                                        <p className="text-[10px] font-bold uppercase text-[#8B6D47]">Distance</p>
                                        <p className="text-lg font-bold text-[#3D2B1F]">{fmtD(active.totalDistance)}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#DFC9AD]/40">
                                        <ShieldIcon className="h-4 w-4 mb-1" style={{ color: '#40C9B0' }} />
                                        <p className="text-[10px] font-bold uppercase text-[#8B6D47]">Safety</p>
                                        <p className="text-lg font-bold text-[#3D2B1F]">High Verified</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#DFC9AD]/40">
                                        <Sparkles className="h-4 w-4 mb-1" style={{ color: '#E8842A' }} />
                                        <p className="text-[10px] font-bold uppercase text-[#8B6D47]">Comfort</p>
                                        <p className="text-lg font-bold text-[#3D2B1F]">Premium</p>
                                    </div>
                                </div>

                                {/* ─── Transit Route ─── */}
                                {active.type === 'transit' && active.legs ? (
                                    <div className="rounded-3xl overflow-hidden shadow-xl mb-10" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
                                        <div className="p-6 border-b bg-[#FDF6ED]/50" style={{ borderColor: '#DFC9AD' }}>
                                            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: '#3D2B1F' }}>
                                                <Route className="h-5 w-5" style={{ color: '#C75B39' }} /> Journey Breakdown
                                            </h3>
                                        </div>

                                        {/* Google Maps-style Timeline */}
                                        <div className="p-6">
                                            {active.legs.map((leg, li) => {
                                                const isWalk = leg.type === 'walk';
                                                const color = isWalk ? '#8B6D47' : (leg.lineColor || '#C75B39');
                                                const isFirst = li === 0;
                                                const isLast = li === active.legs!.length - 1;

                                                return (
                                                    <div key={li}>
                                                        {(isFirst || li > 0) && (
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-16 text-right flex-shrink-0 pt-1">
                                                                    {!isWalk && <span className="text-[13px] font-bold" style={{ color: '#3D2B1F' }}>
                                                                        {li === 0 && active.departureTime}
                                                                    </span>}
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <div className="w-4 h-4 rounded-full border-4 bg-white" style={{ borderColor: color }} />
                                                                </div>
                                                                <p className="text-[14px] font-bold pt-0.5" style={{ color: '#3D2B1F' }}>{leg.from.name}</p>
                                                            </div>
                                                        )}

                                                        <div className="flex items-stretch gap-4">
                                                            <div className="w-16 flex-shrink-0" />
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex-1 min-h-[64px]" style={{
                                                                    width: isWalk ? '2px' : '6px',
                                                                    background: isWalk ? `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 3px, transparent 3px, transparent 7px)` : color,
                                                                    borderRadius: '4px',
                                                                }} />
                                                            </div>
                                                            <div className="flex-1 py-3">
                                                                {isWalk ? (
                                                                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                                                                        <Footprints className="h-4 w-4" style={{ color: '#8B6D47' }} />
                                                                        <span className="text-[13px] font-medium" style={{ color: '#8B6D47' }}>Walk {leg.duration} min • {fmtD(leg.distance)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="rounded-2xl p-4 shadow-sm" style={{ background: '#FDF6ED', border: '1px solid #DFC9AD' }}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Train className="h-4 w-4" style={{ color }} />
                                                                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black text-white" style={{ background: color }}>{leg.lineCode}</span>
                                                                            <span className="text-[14px] font-bold" style={{ color: '#3D2B1F' }}>{leg.serviceName}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-[12px] font-medium" style={{ color: '#8B6D47' }}>
                                                                            {leg.stops && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{leg.duration}m ({leg.stops} stops)</span>}
                                                                            {leg.frequency && <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />{leg.frequency}</span>}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isLast && (
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-16 text-right flex-shrink-0 pt-1">
                                                                    <span className="text-[13px] font-bold" style={{ color: '#3D2B1F' }}>{active.arrivalTime}</span>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <div className="w-4 h-4 rounded-full" style={{ background: '#C75B39' }} />
                                                                </div>
                                                                <p className="text-[14px] font-bold pt-0.5" style={{ color: '#3D2B1F' }}>{leg.to.name}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : active.steps ? (
                                    /* ─── Single Mode Route ─── */
                                    <div className="rounded-3xl overflow-hidden shadow-xl mb-10" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
                                        <div className="p-6 border-b bg-[#FDF6ED]/50" style={{ borderColor: '#DFC9AD' }}>
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: '#3D2B1F' }}>
                                                    <Route className="h-5 w-5" style={{ color: '#C75B39' }} /> Detailed Directions
                                                </h3>
                                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border" style={{ borderColor: '#DFC9AD', color: '#8B6D47' }}>{active.steps!.length} Steps</span>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-0">
                                            {active.steps.map((step, si) => {
                                                const isLast = si === active.steps!.length - 1;
                                                return (
                                                    <div key={si} className="flex gap-4">
                                                        <div className="flex flex-col items-center w-5 flex-shrink-0">
                                                            <div className={`w-3.5 h-3.5 rounded-full ${isLast ? '' : 'border-4 bg-white'}`}
                                                                style={isLast ? { background: '#C75B39' } : { borderColor: active.modeColor }} />
                                                            {!isLast && <div className="w-1 flex-1 min-h-[28px]" style={{ background: active.modeColor + '25', borderRadius: '2px' }} />}
                                                        </div>
                                                        <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
                                                            <p className="text-[14px] font-medium leading-relaxed" style={{ color: '#3D2B1F' }}>{step.instruction}</p>
                                                            {step.distance > 0 && (
                                                                <p className="text-[11px] mt-1 font-bold" style={{ color: '#8B6D47' }}>{fmtD(step.distance)} • {fmt(step.duration)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
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
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-xl max-h-52 overflow-y-auto" style={{ border: '2px solid #DFC9AD' }}>
            {items.map((s: any, i: number) => (
                <button key={i} onClick={() => onSelect(s)}
                    className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-[#FDF6ED] border-b last:border-0 flex items-start gap-2 transition-colors"
                    style={{ color: '#3D2B1F', borderColor: '#DFC9AD' }}>
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: '#C75B39' }} />
                    <span className="line-clamp-2">{s.display}</span>
                </button>
            ))}
        </div>
    );
}
