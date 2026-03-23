'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
    Sparkles, MapPin, UtensilsCrossed, Car, Coffee,
    Activity, Clock, Lightbulb, ChevronDown, ChevronUp,
    IndianRupee, Sun, Sunset, Moon as MoonIcon,
    Eye, RotateCcw, Loader, Image as ImageIcon,
} from 'lucide-react';

// Dynamic import for StreetViewVR (heavy component)
const StreetViewVR = dynamic<any>(() => import('./StreetViewVR'), {
    ssr: false,
    loading: () => null,
});

interface AIActivity {
    time: string;
    title: string;
    description: string;
    type: 'visit' | 'food' | 'travel' | 'rest' | 'activity';
    duration: string;
    cost?: number;
    tip?: string;
}

interface AIDay {
    day: number;
    theme: string;
    activities: AIActivity[];
}

interface TouristSpot {
    name: string;
    coordinates?: { lat: number; lng: number };
    category?: string;
    description?: string;
    rating?: number;
}

interface Props {
    itinerary: AIDay[];
    tips: string[];
    summary: string;
    spots?: TouristSpot[];
    tripId?: string;
    destination?: string;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    visit: { icon: MapPin, color: '#C75B39', bg: 'rgba(199, 91, 57, 0.1)', label: 'Visit' },
    food: { icon: UtensilsCrossed, color: '#B5453A', bg: 'rgba(181, 69, 58, 0.1)', label: 'Dining' },
    travel: { icon: Car, color: '#5BA4CF', bg: 'rgba(91, 164, 207, 0.1)', label: 'Travel' },
    rest: { icon: Coffee, color: '#40C9B0', bg: 'rgba(64, 201, 176, 0.1)', label: 'Rest' },
    activity: { icon: Activity, color: '#E8842A', bg: 'rgba(232, 132, 42, 0.1)', label: 'Activity' },
};

function getTimeOfDay(time: string): 'morning' | 'afternoon' | 'evening' {
    const match = time.match(/(\d{1,2})/);
    if (!match) return 'morning';
    const hour = parseInt(match[1]);
    const isPM = time.toLowerCase().includes('pm');
    const h24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;
    if (h24 < 12) return 'morning';
    if (h24 < 17) return 'afternoon';
    return 'evening';
}

const todIcons = { morning: Sun, afternoon: Sunset, evening: MoonIcon };
const todLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

// Find spot coordinates by matching activity title to spot names
function findSpotCoords(activityTitle: string, spots: TouristSpot[]): TouristSpot | null {
    if (!spots || spots.length === 0) return null;
    const title = activityTitle.toLowerCase();
    return spots.find(s =>
        s.coordinates?.lat &&
        (title.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(title))
    ) || null;
}

export default function AIItineraryDisplay({
    itinerary, tips, summary, spots = [], tripId, destination,
    onRegenerate, isRegenerating,
}: Props) {
    const [expandedDays, setExpandedDays] = useState<number[]>(itinerary.length > 0 ? [1] : []);
    const [showTips, setShowTips] = useState(false);
    const [vrLocation, setVrLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

    const toggleDay = (day: number) => {
        setExpandedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const totalCost = itinerary.reduce((sum, day) =>
        sum + day.activities.reduce((s, a) => s + (a.cost || 0), 0), 0);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    // Empty state: No itinerary
    if (!itinerary || itinerary.length === 0) {
        return (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'white', border: '2px dashed #DFC9AD' }}>
                <Sparkles className="h-16 w-16 mx-auto mb-4" style={{ color: '#DFC9AD' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#3D2B1F' }}>No AI Itinerary Yet</h3>
                <p className="mb-6 max-w-md mx-auto" style={{ color: '#8B6D47' }}>
                    {destination
                        ? `Let AI create a personalized day-by-day itinerary for your trip to ${destination} with local recommendations, hidden gems, and travel tips.`
                        : 'Generate an AI-powered day-by-day itinerary with activity timings, meal suggestions, and travel tips.'}
                </p>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                        {isRegenerating ? (
                            <><Loader className="h-4 w-4 animate-spin" /> Generating...</>
                        ) : (
                            <><Sparkles className="h-4 w-4" /> Generate AI Itinerary</>
                        )}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* VR Modal */}
            {vrLocation && (
                <StreetViewVR
                    lat={vrLocation.lat}
                    lng={vrLocation.lng}
                    name={vrLocation.name}
                    onClose={() => setVrLocation(null)}
                />
            )}

            {/* Header */}
            <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)', border: '2px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">AI-Powered Itinerary</h2>
                            <p className="text-white/80 text-sm leading-relaxed">{summary}</p>
                        </div>
                    </div>
                    {onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                            {isRegenerating
                                ? <><Loader className="h-3 w-3 animate-spin" /> Generating</>
                                : <><RotateCcw className="h-3 w-3" /> Regenerate</>
                            }
                        </button>
                    )}
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <p className="text-white/70 text-[10px] uppercase font-bold">Days</p>
                        <p className="text-white text-xl font-bold">{itinerary.length}</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <p className="text-white/70 text-[10px] uppercase font-bold">Activities</p>
                        <p className="text-white text-xl font-bold">{itinerary.reduce((s, d) => s + d.activities.length, 0)}</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <p className="text-white/70 text-[10px] uppercase font-bold">Est. Cost</p>
                        <p className="text-white text-xl font-bold">₹{totalCost.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Day-by-day Itinerary */}
            <div className="space-y-4">
                {itinerary.map((day) => {
                    const isExpanded = expandedDays.includes(day.day);
                    const dayCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);

                    // Group activities by time of day
                    const grouped = day.activities.reduce((acc, act) => {
                        const tod = getTimeOfDay(act.time);
                        if (!acc[tod]) acc[tod] = [];
                        acc[tod].push(act);
                        return acc;
                    }, {} as Record<string, AIActivity[]>);

                    return (
                        <div key={day.day} className="rounded-xl overflow-hidden shadow-sm transition-all duration-300"
                            style={{ background: 'white', border: '2px solid #DFC9AD' }}>
                            {/* Day Header */}
                            <button
                                onClick={() => toggleDay(day.day)}
                                className="w-full p-4 flex items-center justify-between transition-all duration-200 hover:bg-[#FDF6ED]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white"
                                        style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                                        {day.day}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-base" style={{ color: '#3D2B1F' }}>Day {day.day}</h3>
                                        <p className="text-xs font-medium" style={{ color: '#8B6D47' }}>{day.theme}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs" style={{ color: '#8B6D47' }}>{day.activities.length} activities</p>
                                        {dayCost > 0 && <p className="text-xs font-bold" style={{ color: '#C75B39' }}>₹{dayCost.toLocaleString()}</p>}
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-5 w-5" style={{ color: '#8B6D47' }} />
                                    ) : (
                                        <ChevronDown className="h-5 w-5" style={{ color: '#8B6D47' }} />
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t" style={{ borderColor: '#DFC9AD' }}>
                                    {(['morning', 'afternoon', 'evening'] as const).map((tod) => {
                                        const activities = grouped[tod];
                                        if (!activities || activities.length === 0) return null;
                                        const TodIcon = todIcons[tod];

                                        return (
                                            <div key={tod} className="mt-4">
                                                {/* Time of day label */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <TodIcon className="h-4 w-4" style={{ color: '#E8842A' }} />
                                                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6D47' }}>
                                                        {todLabels[tod]}
                                                    </span>
                                                    <div className="flex-1 h-px" style={{ background: '#DFC9AD' }} />
                                                </div>

                                                {/* Activities */}
                                                <div className="space-y-3 ml-2">
                                                    {activities.map((activity, idx) => {
                                                        const config = typeConfig[activity.type] || typeConfig.activity;
                                                        const Icon = config.icon;
                                                        const matchedSpot = activity.type === 'visit'
                                                            ? findSpotCoords(activity.title, spots)
                                                            : null;
                                                        const hasCoords = matchedSpot?.coordinates?.lat && matchedSpot?.coordinates?.lng;

                                                        return (
                                                            <div key={idx} className="flex gap-3">
                                                                {/* Timeline dot */}
                                                                <div className="flex flex-col items-center pt-1">
                                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.bg }}>
                                                                        <Icon className="h-4 w-4" style={{ color: config.color }} />
                                                                    </div>
                                                                    {idx < activities.length - 1 && (
                                                                        <div className="w-0.5 flex-1 mt-1" style={{ background: '#DFC9AD' }} />
                                                                    )}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 pb-3">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1">
                                                                            <h4 className="font-bold text-sm" style={{ color: '#3D2B1F' }}>{activity.title}</h4>
                                                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                                <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#C75B39' }}>
                                                                                    <Clock className="h-3 w-3" /> {activity.time}
                                                                                </span>
                                                                                <span className="text-[11px]" style={{ color: '#8B6D47' }}>• {activity.duration}</span>
                                                                                {activity.cost !== undefined && activity.cost > 0 && (
                                                                                    <span className="text-[11px] font-medium flex items-center gap-0.5" style={{ color: '#40C9B0' }}>
                                                                                        <IndianRupee className="h-3 w-3" />{activity.cost}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                            {/* VR Button */}
                                                                            {hasCoords && (
                                                                                <button
                                                                                    onClick={() => setVrLocation({
                                                                                        lat: matchedSpot!.coordinates!.lat,
                                                                                        lng: matchedSpot!.coordinates!.lng,
                                                                                        name: activity.title,
                                                                                    })}
                                                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                                                                                    style={{ background: 'linear-gradient(135deg, #7B4F91, #D4637A)', color: 'white' }}
                                                                                    title="View in 360° VR">
                                                                                    <Eye className="h-3 w-3" />
                                                                                    VR
                                                                                </button>
                                                                            )}
                                                                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full"
                                                                                style={{ background: config.bg, color: config.color }}>
                                                                                {config.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8B6D47' }}>
                                                                        {activity.description}
                                                                    </p>

                                                                    {/* Location Preview Image for visits */}
                                                                    {activity.type === 'visit' && hasCoords && apiKey && (
                                                                        <div className="mt-2 rounded-lg overflow-hidden relative group cursor-pointer"
                                                                            style={{ border: '1px solid #DFC9AD' }}
                                                                            onClick={() => setVrLocation({
                                                                                lat: matchedSpot!.coordinates!.lat,
                                                                                lng: matchedSpot!.coordinates!.lng,
                                                                                name: activity.title,
                                                                            })}>
                                                                            <img
                                                                                src={`https://maps.googleapis.com/maps/api/streetview?size=400x180&location=${matchedSpot!.coordinates!.lat},${matchedSpot!.coordinates!.lng}&fov=100&key=${apiKey}`}
                                                                                alt={activity.title}
                                                                                className="w-full h-[140px] object-cover transition-transform duration-300 group-hover:scale-105"
                                                                                onError={(e) => {
                                                                                    // Hide on error
                                                                                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                                                                }}
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3">
                                                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                                                                                    style={{ background: 'rgba(199, 91, 57, 0.9)' }}>
                                                                                    <Eye className="h-3.5 w-3.5" /> Open 360° VR View
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Pro Tip */}
                                                                    {activity.tip && (
                                                                        <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: '#FDF6ED' }}>
                                                                            <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: '#FFB347' }} />
                                                                            <p className="text-[11px] italic" style={{ color: '#8B6D47' }}>{activity.tip}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Travel Tips */}
            {tips && tips.length > 0 && (
                <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
                    <button
                        onClick={() => setShowTips(!showTips)}
                        className="w-full p-4 flex items-center justify-between transition-all duration-200 hover:bg-[#FDF6ED]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 179, 71, 0.15)' }}>
                                <Lightbulb className="h-5 w-5" style={{ color: '#FFB347' }} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-base" style={{ color: '#3D2B1F' }}>Travel Tips</h3>
                                <p className="text-xs" style={{ color: '#8B6D47' }}>{tips.length} expert recommendations</p>
                            </div>
                        </div>
                        {showTips ? (
                            <ChevronUp className="h-5 w-5" style={{ color: '#8B6D47' }} />
                        ) : (
                            <ChevronDown className="h-5 w-5" style={{ color: '#8B6D47' }} />
                        )}
                    </button>

                    {showTips && (
                        <div className="px-4 pb-4 border-t" style={{ borderColor: '#DFC9AD' }}>
                            <div className="mt-3 space-y-2">
                                {tips.map((tip, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: idx % 2 === 0 ? '#FDF6ED' : 'transparent' }}>
                                        <span className="text-sm">💡</span>
                                        <p className="text-sm" style={{ color: '#3D2B1F' }}>{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
