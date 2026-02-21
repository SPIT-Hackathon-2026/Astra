'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    MapPin,
    Navigation,
    Search,
    Calendar,
    Clock,
    Car,
    Footprints,
    Bike,
    Loader,
    ChevronDown,
    ChevronUp,
    ArrowRightLeft,
    LocateFixed,
    ArrowRight,
    Route,
    Timer,
    Ruler,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({ weight: '400', subsets: ['latin'] });

interface RouteStep {
    instruction: string;
    name: string;
    distance: number;
    duration: number;
    maneuverType: string;
    maneuverModifier: string;
}

interface RouteResult {
    mode: string;
    modeName: string;
    modeIcon: string;
    modeColor: string;
    totalDistance: number;
    totalDuration: number;
    steps: RouteStep[];
}

const modeIcons: Record<string, any> = { car: Car, walk: Footprints, bike: Bike };

function formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

// Geocoding
async function searchPlaces(query: string): Promise<Array<{ display: string; lat: number; lng: number }>> {
    if (query.length < 3) return [];
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`);
        const data = await res.json();
        return data.map((item: any) => ({
            display: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
        }));
    } catch { return []; }
}

export default function PlanTripPage() {
    const router = useRouter();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [sourceCoords, setSourceCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [sourceSuggestions, setSourceSuggestions] = useState<Array<{ display: string; lat: number; lng: number }>>([]);
    const [destSuggestions, setDestSuggestions] = useState<Array<{ display: string; lat: number; lng: number }>>([]);
    const [showSourceSugg, setShowSourceSugg] = useState(false);
    const [showDestSugg, setShowDestSugg] = useState(false);

    // Multi-vehicle selection
    const [selectedModes, setSelectedModes] = useState<string[]>(['driving', 'foot', 'bicycle']);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [routes, setRoutes] = useState<RouteResult[]>([]);
    const [activeRoute, setActiveRoute] = useState<string | null>(null);
    const [expandedSteps, setExpandedSteps] = useState(false);

    const srcTimer = useRef<NodeJS.Timeout | null>(null);
    const dstTimer = useRef<NodeJS.Timeout | null>(null);

    const handleSourceChange = (v: string) => {
        setSource(v); setSourceCoords(null);
        if (srcTimer.current) clearTimeout(srcTimer.current);
        srcTimer.current = setTimeout(async () => {
            const r = await searchPlaces(v);
            setSourceSuggestions(r); setShowSourceSugg(r.length > 0);
        }, 350);
    };

    const handleDestChange = (v: string) => {
        setDestination(v); setDestCoords(null);
        if (dstTimer.current) clearTimeout(dstTimer.current);
        dstTimer.current = setTimeout(async () => {
            const r = await searchPlaces(v);
            setDestSuggestions(r); setShowDestSugg(r.length > 0);
        }, 350);
    };

    const selectSource = (p: { display: string; lat: number; lng: number }) => {
        setSource(p.display.split(',').slice(0, 3).join(',')); setSourceCoords({ lat: p.lat, lng: p.lng }); setShowSourceSugg(false);
    };
    const selectDest = (p: { display: string; lat: number; lng: number }) => {
        setDestination(p.display.split(',').slice(0, 3).join(',')); setDestCoords({ lat: p.lat, lng: p.lng }); setShowDestSugg(false);
    };

    const swapLocations = () => {
        setSource(destination); setDestination(source);
        setSourceCoords(destCoords); setDestCoords(sourceCoords);
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => { setSourceCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSource('Current Location'); },
            () => setError('Could not get your location')
        );
    };

    const toggleMode = (mode: string) => {
        setSelectedModes(prev =>
            prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
        );
    };

    const handleSearch = async () => {
        setError('');
        let fromC = sourceCoords;
        let toC = destCoords;

        if (!fromC && source) {
            const res = await searchPlaces(source);
            if (res.length > 0) { fromC = { lat: res[0].lat, lng: res[0].lng }; setSourceCoords(fromC); }
        }
        if (!toC && destination) {
            const res = await searchPlaces(destination);
            if (res.length > 0) { toC = { lat: res[0].lat, lng: res[0].lng }; setDestCoords(toC); }
        }

        if (!fromC || !toC) { setError('Please enter valid source and destination'); return; }
        if (selectedModes.length === 0) { setError('Please select at least one travel mode'); return; }

        setIsLoading(true);
        try {
            const response = await fetch('/api/tripgo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromLat: fromC.lat, fromLng: fromC.lng,
                    toLat: toC.lat, toLng: toC.lng,
                    modes: selectedModes,
                }),
            });
            const data = await response.json();
            if (!response.ok) { setError(data.error || 'No routes found'); setRoutes([]); }
            else {
                setRoutes(data.routes || []);
                if (data.routes?.length > 0) setActiveRoute(data.routes[0].mode);
            }
        } catch (e: any) { setError(e.message || 'Failed to fetch routes'); setRoutes([]); }
        finally { setIsLoading(false); }
    };

    const activeRouteData = routes.find(r => r.mode === activeRoute);

    const travelModes = [
        { id: 'driving', label: 'Drive', icon: Car, color: '#C75B39' },
        { id: 'foot', label: 'Walk', icon: Footprints, color: '#8B6D47' },
        { id: 'bicycle', label: 'Bicycle', icon: Bike, color: '#40C9B0' },
    ];

    return (
        <div className="min-h-screen bg-rs-sand-light flex flex-col">
            {/* Top Bar */}
            <nav className="bg-white/90 backdrop-blur-xl border-b border-rs-sand-dark/25 sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-14 gap-3">
                        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-rs-sand/50 transition-colors">
                            <ArrowLeft className="h-5 w-5 text-rs-deep-brown" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-base font-bold text-rs-deep-brown">Plan Your Trip</h1>
                        </div>
                        {source && destination && (
                            <span className="text-xs text-rs-desert-brown hidden sm:block">
                                {source.split(',')[0]} → {destination.split(',')[0]}
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main content — Split layout */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* LEFT PANEL — Inputs */}
                <div className="w-full lg:w-[420px] lg:min-w-[420px] border-r border-rs-sand-dark/20 bg-white lg:h-[calc(100vh-56px)] lg:overflow-y-auto lg:sticky lg:top-14">
                    <div className="p-5">
                        {/* Location inputs */}
                        <div className="flex gap-3 mb-5">
                            <div className="flex flex-col items-center pt-3">
                                <div className="w-3 h-3 rounded-full border-2 border-rs-terracotta bg-white" />
                                <div className="w-0.5 flex-1 bg-rs-sand-dark/50 my-1 min-h-[40px]" />
                                <div className="w-3 h-3 rounded-full bg-rs-terracotta" />
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="relative">
                                    <div className="flex gap-1.5">
                                        <input type="text" placeholder="From — starting point" value={source}
                                            onChange={(e) => handleSourceChange(e.target.value)}
                                            onFocus={() => sourceSuggestions.length > 0 && setShowSourceSugg(true)}
                                            onBlur={() => setTimeout(() => setShowSourceSugg(false), 200)}
                                            className="flex-1 px-3 py-2.5 border border-rs-sand-dark/30 rounded-xl text-sm text-rs-deep-brown placeholder:text-rs-desert-brown/40 focus:ring-2 focus:ring-rs-terracotta/20 focus:border-rs-terracotta bg-rs-sand-light/50"
                                        />
                                        <button onClick={useCurrentLocation} className="p-2 rounded-lg hover:bg-rs-sand/50 text-rs-terracotta" title="Use GPS">
                                            <LocateFixed className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {showSourceSugg && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-rs-sand-dark/25 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                                            {sourceSuggestions.map((s, i) => (
                                                <button key={i} onClick={() => selectSource(s)} className="w-full text-left px-3 py-2.5 text-xs text-rs-deep-brown hover:bg-rs-sand/50 border-b border-rs-sand-dark/10 last:border-0 flex items-start gap-2">
                                                    <MapPin className="h-3 w-3 text-rs-terracotta mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{s.display}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input type="text" placeholder="To — destination" value={destination}
                                        onChange={(e) => handleDestChange(e.target.value)}
                                        onFocus={() => destSuggestions.length > 0 && setShowDestSugg(true)}
                                        onBlur={() => setTimeout(() => setShowDestSugg(false), 200)}
                                        className="w-full px-3 py-2.5 border border-rs-sand-dark/30 rounded-xl text-sm text-rs-deep-brown placeholder:text-rs-desert-brown/40 focus:ring-2 focus:ring-rs-terracotta/20 focus:border-rs-terracotta bg-rs-sand-light/50"
                                    />
                                    {showDestSugg && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-rs-sand-dark/25 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                                            {destSuggestions.map((s, i) => (
                                                <button key={i} onClick={() => selectDest(s)} className="w-full text-left px-3 py-2.5 text-xs text-rs-deep-brown hover:bg-rs-sand/50 border-b border-rs-sand-dark/10 last:border-0 flex items-start gap-2">
                                                    <MapPin className="h-3 w-3 text-rs-terracotta mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{s.display}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button onClick={swapLocations} className="self-center p-2 rounded-lg hover:bg-rs-sand/50 text-rs-desert-brown">
                                <ArrowRightLeft className="h-4 w-4 rotate-90" />
                            </button>
                        </div>

                        {/* Mode selector — multi-select */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-rs-desert-brown mb-2">Compare vehicles (select multiple)</p>
                            <div className="flex gap-2">
                                {travelModes.map((mode) => {
                                    const selected = selectedModes.includes(mode.id);
                                    return (
                                        <button key={mode.id} onClick={() => toggleMode(mode.id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${selected
                                                ? 'border-rs-terracotta/40 bg-rs-terracotta/8 text-rs-terracotta shadow-sm'
                                                : 'border-rs-sand-dark/25 text-rs-desert-brown hover:bg-rs-sand/50'
                                                }`}
                                        >
                                            <mode.icon className="h-4 w-4" />
                                            {mode.label}
                                            {selected && <div className="w-1.5 h-1.5 rounded-full bg-rs-terracotta" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search */}
                        <Button onClick={handleSearch} variant="primary"
                            className="w-full py-3 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange shadow-md mb-4"
                            disabled={isLoading || !source || !destination || selectedModes.length === 0}>
                            {isLoading
                                ? <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" /> Finding routes...</span>
                                : <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Find Routes</span>}
                        </Button>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Route comparison cards */}
                        {routes.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-rs-desert-brown mb-1">
                                    {routes.length} route{routes.length > 1 ? 's' : ''} found — tap to view details
                                </p>
                                {routes.map((route) => {
                                    const IconComp = modeIcons[route.modeIcon] || Navigation;
                                    const isActive = activeRoute === route.mode;
                                    return (
                                        <button key={route.mode} onClick={() => { setActiveRoute(route.mode); setExpandedSteps(false); }}
                                            className={`w-full p-4 rounded-xl border text-left transition-all ${isActive
                                                ? 'border-rs-terracotta/40 bg-rs-terracotta/5 shadow-sm'
                                                : 'border-rs-sand-dark/25 bg-white hover:bg-rs-sand-light/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: route.modeColor + '18' }}>
                                                    <IconComp className="h-5 w-5" style={{ color: route.modeColor }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-rs-deep-brown">{route.modeName}</span>
                                                        <span className="text-sm font-bold" style={{ color: route.modeColor }}>
                                                            {formatDuration(route.totalDuration)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs text-rs-desert-brown flex items-center gap-1">
                                                            <Ruler className="h-3 w-3" /> {formatDistance(route.totalDistance)}
                                                        </span>
                                                        <span className="text-xs text-rs-desert-brown flex items-center gap-1">
                                                            <Route className="h-3 w-3" /> {route.steps.length} steps
                                                        </span>
                                                    </div>
                                                </div>
                                                {isActive && <div className="w-2 h-2 rounded-full bg-rs-terracotta flex-shrink-0" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL — Route details */}
                <div className="flex-1 lg:h-[calc(100vh-56px)] lg:overflow-y-auto">
                    {!routes.length && !isLoading && (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center max-w-sm">
                                <div className="w-16 h-16 rounded-2xl bg-rs-terracotta/10 flex items-center justify-center mx-auto mb-4">
                                    <Navigation className="h-8 w-8 text-rs-terracotta/40" />
                                </div>
                                <h3 className={`${luckiestGuy.className} text-xl text-rs-deep-brown mb-2`}>Enter Your Route</h3>
                                <p className="text-sm text-rs-desert-brown leading-relaxed">
                                    Enter a source and destination on the left, select your travel modes, and hit &quot;Find Routes&quot;
                                    to compare options.
                                </p>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-2 border-rs-terracotta border-t-transparent mx-auto mb-4" />
                                <p className="text-rs-desert-brown text-sm">Searching routes across multiple vehicles...</p>
                            </div>
                        </div>
                    )}

                    {activeRouteData && (
                        <div className="p-5 sm:p-8">
                            {/* Route header */}
                            <div className="bg-white rounded-2xl border border-rs-sand-dark/25 p-5 sm:p-6 mb-5 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    {(() => {
                                        const IC = modeIcons[activeRouteData.modeIcon] || Navigation; return (
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: activeRouteData.modeColor + '15' }}>
                                                <IC className="h-6 w-6" style={{ color: activeRouteData.modeColor }} />
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <h2 className="text-lg font-bold text-rs-deep-brown">{activeRouteData.modeName} Route</h2>
                                        <p className="text-sm text-rs-desert-brown">
                                            {source.split(',')[0]} → {destination.split(',')[0]}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-rs-sand-light/60 rounded-xl p-3 text-center">
                                        <Timer className="h-4 w-4 mx-auto mb-1 text-rs-terracotta" />
                                        <p className="text-lg font-bold text-rs-deep-brown">{formatDuration(activeRouteData.totalDuration)}</p>
                                        <p className="text-xs text-rs-desert-brown">Duration</p>
                                    </div>
                                    <div className="bg-rs-sand-light/60 rounded-xl p-3 text-center">
                                        <Ruler className="h-4 w-4 mx-auto mb-1 text-rs-neon-teal" />
                                        <p className="text-lg font-bold text-rs-deep-brown">{formatDistance(activeRouteData.totalDistance)}</p>
                                        <p className="text-xs text-rs-desert-brown">Distance</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step-by-step timeline */}
                            <div className="bg-white rounded-2xl border border-rs-sand-dark/25 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setExpandedSteps(!expandedSteps)}
                                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <Route className="h-4 w-4 text-rs-terracotta" />
                                        <span className="text-sm font-bold text-rs-deep-brown">Step-by-Step Directions</span>
                                        <span className="text-xs text-rs-desert-brown bg-rs-sand-light px-2 py-0.5 rounded-md">
                                            {activeRouteData.steps.length} steps
                                        </span>
                                    </div>
                                    {expandedSteps ? <ChevronUp className="h-4 w-4 text-rs-desert-brown" /> : <ChevronDown className="h-4 w-4 text-rs-desert-brown" />}
                                </button>

                                {expandedSteps && (
                                    <div className="border-t border-rs-sand-dark/15 px-4 sm:px-5 py-4">
                                        {activeRouteData.steps.map((step, idx) => {
                                            const isFirst = idx === 0;
                                            const isLast = idx === activeRouteData.steps.length - 1;
                                            const isDepart = step.maneuverType === 'depart';
                                            const isArrive = step.maneuverType === 'arrive';

                                            return (
                                                <div key={idx} className="flex gap-3">
                                                    {/* Timeline */}
                                                    <div className="flex flex-col items-center w-5 flex-shrink-0">
                                                        <div
                                                            className={`w-3 h-3 rounded-full flex-shrink-0 ${isLast || isArrive ? 'bg-rs-terracotta' : 'border-2 bg-white'}`}
                                                            style={{ borderColor: isLast || isArrive ? undefined : activeRouteData.modeColor }}
                                                        />
                                                        {!isLast && (
                                                            <div className="w-0.5 flex-1 min-h-[24px]" style={{ background: activeRouteData.modeColor + '40' }} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
                                                        <p className={`text-sm ${isDepart || isArrive ? 'font-bold text-rs-deep-brown' : 'text-rs-deep-brown/80'}`}>
                                                            {step.instruction}
                                                        </p>
                                                        {!isDepart && !isArrive && step.distance > 0 && (
                                                            <p className="text-xs text-rs-desert-brown mt-0.5">
                                                                {formatDistance(step.distance)} · {formatDuration(step.duration)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Vehicle comparison at bottom */}
                            {routes.length > 1 && (
                                <div className="mt-5 bg-white rounded-2xl border border-rs-sand-dark/25 p-4 sm:p-5 shadow-sm">
                                    <p className="text-xs font-medium text-rs-desert-brown mb-3">Compare all vehicles</p>
                                    <div className="space-y-2">
                                        {routes.map((r) => {
                                            const IC = modeIcons[r.modeIcon] || Navigation;
                                            const fastest = Math.min(...routes.map(x => x.totalDuration));
                                            const isFastest = r.totalDuration === fastest;
                                            return (
                                                <div key={r.mode} className="flex items-center gap-3 py-2">
                                                    <IC className="h-4 w-4 flex-shrink-0" style={{ color: r.modeColor }} />
                                                    <span className="text-sm font-medium text-rs-deep-brown w-16">{r.modeName}</span>
                                                    <div className="flex-1 h-2 bg-rs-sand-light rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${Math.min(100, (fastest / r.totalDuration) * 100)}%`,
                                                                background: r.modeColor,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-rs-deep-brown w-20 text-right">
                                                        {formatDuration(r.totalDuration)}
                                                    </span>
                                                    {isFastest && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                            Fastest
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
