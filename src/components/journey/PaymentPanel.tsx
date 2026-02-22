'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Shield, CreditCard, CheckCircle, XCircle, Loader, AlertTriangle,
    Ticket, KeyRound, X, Phone, Car, Star, UserCircle,
} from 'lucide-react';

interface Leg {
    type: string;
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    estimatedDuration: number;
    estimatedDistance: number;
    cost: number;
    trainLine?: string;
    otp?: string;
}

interface DriverInfo {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    vehicleModel: string;
    rating: number;
}

interface PaymentPanelProps {
    source: string;
    destination: string;
    sourceCoords: { lat: number; lng: number } | null;
    destCoords: { lat: number; lng: number } | null;
    activeRoute: any;
}

const FARE_PER_KM: Record<string, number> = {
    auto: 14, taxi: 18, cab: 20, train: 2, bus: 1.5, walk: 0,
};

function buildLegsFromRoute(route: any, src: any, dst: any, source: string, destination: string): Leg[] {
    const legs: Leg[] = [];
    if (!route) return legs;

    if (route.type === 'transit' && route.legs) {
        route.legs.forEach((leg: any, i: number) => {
            const type = leg.type === 'walk' ? 'walk' : 'train';
            const distMeters = leg.distance || 800;
            const durMins = leg.duration || 5;
            const cost = type === 'train' ? Math.max(5, Math.round((distMeters / 1000) * FARE_PER_KM.train)) : 0;
            legs.push({
                type,
                from: { name: leg.from?.name || (i === 0 ? source : 'Transfer Point'), lat: src?.lat || 19.076, lng: src?.lng || 72.877 },
                to: { name: leg.to?.name || destination, lat: dst?.lat || 19.076, lng: dst?.lng || 72.877 },
                estimatedDuration: durMins, estimatedDistance: distMeters, cost,
                trainLine: leg.lineCode,
            });
        });
    } else {
        const mode = route.modeIcon || 'walk';
        const distMeters = route.totalDistance || 1000;
        const durMins = Math.round((route.totalDuration || 300) / 60);
        const cost = Math.max(mode === 'walk' ? 0 : 20, Math.round((distMeters / 1000) * (FARE_PER_KM[mode] || 0)));
        legs.push({
            type: mode,
            from: { name: source, lat: src?.lat || 19.076, lng: src?.lng || 72.877 },
            to: { name: destination, lat: dst?.lat || 19.076, lng: dst?.lng || 72.877 },
            estimatedDuration: durMins, estimatedDistance: distMeters, cost,
        });
    }
    return legs;
}

const legIcon = (t: string) => ({ auto: '🛺', taxi: '🚕', cab: '🚗', train: '🚆', bus: '🚌' }[t] || '🚶');
const legLabel = (t: string) => ({ auto: 'Auto Rickshaw', taxi: 'Taxi', cab: 'Cab', train: 'Local Train', bus: 'Bus', walk: 'Walk' }[t] || t);
const vehicleEmoji = (t: string) => ({ auto: '🛺', taxi: '🚕', cab: '🚗' }[t] || '🚗');

type PanelState = 'idle' | 'review' | 'paying' | 'active' | 'cancelled' | 'completed';

export default function PaymentPanel({ source, destination, sourceCoords, destCoords, activeRoute }: PaymentPanelProps) {
    const [state, setState] = useState<PanelState>('idle');
    const [legs, setLegs] = useState<Leg[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [journeyId, setJourneyId] = useState('');
    const [journeyData, setJourneyData] = useState<any>(null);
    const [currentLegIdx, setCurrentLegIdx] = useState(0);
    const [amountDeducted, setAmountDeducted] = useState(0);
    const [currentOtp, setCurrentOtp] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [distInfo, setDistInfo] = useState<{ toFrom: number; toTo: number } | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [refundAmt, setRefundAmt] = useState(0);
    const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
    const [rideStatus, setRideStatus] = useState<string | null>(null);
    const geoRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Build legs when route changes
    useEffect(() => {
        if (!activeRoute) return;
        const built = buildLegsFromRoute(activeRoute, sourceCoords, destCoords, source, destination);
        setLegs(built);
        setTotalCost(built.reduce((s, l) => s + l.cost, 0));
        setState('idle');
        setJourneyId('');
        setCurrentOtp(null);
        setAmountDeducted(0);
        setDriverInfo(null);
        setRideStatus(null);
    }, [activeRoute, source, destination, sourceCoords, destCoords]);

    // ── Poll journey status for driver assignment ──
    const startStatusPolling = (jId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        const poll = async () => {
            try {
                const res = await fetch(`/api/journey/status?journeyId=${jId}`);
                const data = await res.json();
                if (!res.ok) return;
                if (data.rideStatus) setRideStatus(data.rideStatus);
                if (data.amountDeducted !== undefined) setAmountDeducted(data.amountDeducted);
                if (data.currentLegIndex !== undefined) setCurrentLegIdx(data.currentLegIndex);
                if (data.otp) setCurrentOtp(data.otp);
                if (data.driver && !driverInfo) {
                    setDriverInfo(data.driver);
                    setStatusMsg('🎉 Driver assigned! Check details below.');
                }
                if (data.status === 'completed') {
                    setState('completed');
                    clearInterval(pollRef.current!);
                }
            } catch { /* silent */ }
        };
        poll();
        pollRef.current = setInterval(poll, 8000); // poll every 8s
    };

    // ── Razorpay ──
    const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
            if ((window as any).Razorpay) { resolve(true); return; }
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            s.onload = () => resolve(true);
            s.onerror = () => resolve(false);
            document.head.appendChild(s);
        });

    const handleBookNow = async () => {
        setIsLoading(true); setError('');
        try {
            const res = await fetch('/api/journey/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: { name: source, lat: sourceCoords?.lat || 0, lng: sourceCoords?.lng || 0 },
                    destination: { name: destination, lat: destCoords?.lat || 0, lng: destCoords?.lng || 0 },
                    legs, totalCost,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setJourneyId(data.journeyId);
            const otps: Record<number, string> = {};
            data.legs?.forEach((l: any) => { if (l.otp) otps[l.index] = l.otp; });
            setJourneyData({ ...data, otps });

            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Failed to load payment gateway');

            const options = {
                key: data.razorpayKeyId,
                amount: data.amount,
                currency: data.currency,
                name: 'Radiator Routes',
                description: `${source.split(',')[0]} → ${destination.split(',')[0]}`,
                order_id: data.razorpayOrderId,
                handler: async (response: any) => {
                    const vRes = await fetch('/api/journey/verify-payment', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            journeyId: data.journeyId,
                            razorpayOrderId: data.razorpayOrderId,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        }),
                    });
                    if (vRes.ok) {
                        setState('active');
                        setStatusMsg('✅ Payment done! Looking for a driver...');
                        startGeolocation(data.journeyId, otps);
                        startStatusPolling(data.journeyId);
                    } else {
                        setError('Payment verification failed');
                    }
                },
                prefill: { name: 'Traveller', email: 'traveller@example.com' },
                theme: { color: '#c2410c' },
                modal: { ondismiss: () => setState('review') },
            };

            const rz = new (window as any).Razorpay(options);
            rz.open();
            setState('paying');
        } catch (e: any) {
            setError(e.message);
            setState('review');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Geolocation ──
    const startGeolocation = (jId: string, otps: Record<number, string>) => {
        if (!navigator.geolocation) return;
        const sendUpdate = (lat: number, lng: number) => {
            fetch('/api/journey/location-update', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ journeyId: jId, lat, lng }),
            }).then(r => r.json()).then(data => {
                if (data.currentLegIndex !== undefined) setCurrentLegIdx(data.currentLegIndex);
                if (data.amountDeducted !== undefined) setAmountDeducted(data.amountDeducted);
                if (data.currentOtp) setCurrentOtp(data.currentOtp);
                if (data.distToFrom !== undefined) setDistInfo({ toFrom: data.distToFrom, toTo: data.distToTo });
                if (data.status === 'completed') { setState('completed'); clearInterval(geoRef.current!); }
                if (data.events?.includes('driver_notified')) setStatusMsg('🚗 Driver notified — they are on the way!');
                if (data.events?.includes('payment_deducted')) setStatusMsg(`💳 Fare settled — ₹${data.amountDeducted} deducted.`);
                if (data.events?.includes('transit_payment_deducted')) setStatusMsg('🎫 Transit fare deducted. Have a great ride!');
            }).catch(console.error);
        };
        navigator.geolocation.getCurrentPosition(p => sendUpdate(p.coords.latitude, p.coords.longitude));
        geoRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(p => sendUpdate(p.coords.latitude, p.coords.longitude), console.error, { enableHighAccuracy: true });
        }, 30000);
    };

    // ── Cancel ──
    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/journey/cancel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ journeyId, reason: 'Customer cancelled' }),
            });
            const data = await res.json();
            if (res.ok) {
                setRefundAmt(data.refundAmount);
                setState('cancelled');
                if (geoRef.current) clearInterval(geoRef.current);
                if (pollRef.current) clearInterval(pollRef.current);
            }
        } catch (e: any) { setError(e.message); }
        finally { setIsLoading(false); setCancelConfirm(false); }
    };

    useEffect(() => () => {
        if (geoRef.current) clearInterval(geoRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
    }, []);

    if (legs.length === 0 || totalCost === 0) return null;

    const refundEstimate = totalCost - amountDeducted;
    const currentLeg = legs[currentLegIdx];
    const currentOtpDisplay = journeyData?.otps?.[currentLegIdx] || currentOtp;
    const isDriverLeg = currentLeg && ['auto', 'taxi', 'cab'].includes(currentLeg.type);

    return (
        <div className="mt-5 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-rs-sand-dark">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange p-4 text-white">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            <span className="text-sm font-bold">Journey Ticket</span>
                        </div>
                        {state === 'active' && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" /> ACTIVE
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-white/80">{source.split(',')[0]} → {destination.split(',')[0]}</p>
                </div>

                {/* Notch */}
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-rs-sand-light rounded-r-full border-r border-t border-b border-rs-sand-dark" />
                    <div className="flex-1 border-t border-dashed border-rs-sand-dark mx-1" />
                    <div className="w-4 h-4 bg-rs-sand-light rounded-l-full border-l border-t border-b border-rs-sand-dark" />
                </div>

                {/* ── Legs ── */}
                <div className="p-4 space-y-2">
                    <p className="text-[10px] font-bold text-rs-desert-brown uppercase tracking-wider mb-3">Journey Breakdown</p>
                    {legs.map((leg, i) => {
                        const isPast = i < currentLegIdx;
                        const isCurrent = state === 'active' && i === currentLegIdx;
                        return (
                            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isCurrent ? 'bg-rs-terracotta/10 border border-rs-terracotta/30' : isPast ? 'opacity-50' : 'bg-rs-sand/30'}`}>
                                <span className="text-lg">{legIcon(leg.type)}</span>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-rs-deep-brown">{legLabel(leg.type)}</p>
                                    <p className="text-[10px] text-rs-desert-brown">{leg.from.name.split(',')[0]} → {leg.to.name.split(',')[0]}</p>
                                </div>
                                <div className="text-right">
                                    {leg.cost > 0
                                        ? <p className={`text-xs font-bold ${isPast ? 'text-green-600 line-through' : 'text-rs-deep-brown'}`}>₹{leg.cost}</p>
                                        : <p className="text-[10px] text-rs-desert-brown">Free</p>}
                                    <p className="text-[9px] text-rs-desert-brown">{leg.estimatedDuration} min</p>
                                </div>
                                {isPast && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                {isCurrent && <div className="w-2 h-2 bg-rs-terracotta rounded-full animate-pulse flex-shrink-0" />}
                            </div>
                        );
                    })}
                </div>

                {/* Notch */}
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-rs-sand-light rounded-r-full border-r border-t border-b border-rs-sand-dark" />
                    <div className="flex-1 border-t border-dashed border-rs-sand-dark mx-1" />
                    <div className="w-4 h-4 bg-rs-sand-light rounded-l-full border-l border-t border-b border-rs-sand-dark" />
                </div>

                {/* ── Total ── */}
                <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-rs-desert-brown">Total Payment</p>
                        <p className="text-2xl font-black text-rs-deep-brown">₹{totalCost}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-rs-desert-brown">Deducted</p>
                        <p className="text-lg font-bold text-rs-terracotta">₹{amountDeducted}</p>
                    </div>
                </div>

                {/* ── Status msg ── */}
                {statusMsg && (
                    <div className="mx-4 mb-3 px-3 py-2 bg-rs-sand/50 rounded-xl">
                        <p className="text-xs text-rs-desert-brown">{statusMsg}</p>
                    </div>
                )}

                {/* ── DRIVER INFO CARD (shown once driver is assigned) ── */}
                {state === 'active' && driverInfo && (
                    <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-amber-200 shadow-md">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 flex items-center justify-between">
                            <p className="text-white text-xs font-bold flex items-center gap-1.5">
                                <Car className="h-3.5 w-3.5" /> Driver Assigned
                            </p>
                            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                                {rideStatus === 'in_progress' ? '🟢 En Route' : '🟡 On the way'}
                            </span>
                        </div>

                        <div className="bg-amber-50 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                {/* Avatar */}
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-300">
                                    <span className="text-2xl">{vehicleEmoji(driverInfo.vehicleType)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{driverInfo.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                        <span className="text-xs text-gray-600">{driverInfo.rating?.toFixed(1)} rating</span>
                                    </div>
                                </div>

                                {/* Call button */}
                                <a href={`tel:${driverInfo.phone}`}
                                    className="ml-auto flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-full transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                    Call
                                </a>
                            </div>

                            {/* Vehicle info */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white rounded-xl p-2.5 text-center border border-amber-100">
                                    <p className="text-[9px] text-gray-500 uppercase font-semibold">Vehicle</p>
                                    <p className="text-xs font-bold text-gray-800 mt-0.5 capitalize">{driverInfo.vehicleType} · {driverInfo.vehicleModel}</p>
                                </div>
                                <div className="bg-white rounded-xl p-2.5 text-center border border-amber-100">
                                    <p className="text-[9px] text-gray-500 uppercase font-semibold">Number Plate</p>
                                    <p className="text-xs font-bold text-gray-800 mt-0.5 tracking-wider">{driverInfo.vehicleNumber}</p>
                                </div>
                            </div>

                            {/* Phone number display */}
                            <div className="mt-2 bg-white rounded-xl p-2.5 flex items-center gap-2 border border-amber-100">
                                <Phone className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-gray-500">Driver's Phone</p>
                                    <p className="text-sm font-bold text-gray-800">{driverInfo.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Searching for driver ── */}
                {state === 'active' && !driverInfo && isDriverLeg && (
                    <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Loader className="h-5 w-5 text-amber-600 animate-spin" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800">Looking for a driver...</p>
                                <p className="text-xs text-amber-600">Nearby {legLabel(currentLeg.type)} drivers are being notified</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── OTP (shown after driver assigned + for driver verification) ── */}
                {state === 'active' && isDriverLeg && driverInfo && currentOtpDisplay && (
                    <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <KeyRound className="h-4 w-4 text-amber-600" />
                            <p className="text-xs font-bold text-amber-800">Share this OTP with your driver</p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            {currentOtpDisplay.split('').map((d: string, i: number) => (
                                <div key={i} className="w-12 h-12 bg-white border-2 border-amber-400 rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-2xl font-black text-amber-700">{d}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-amber-600 text-center mt-2">Driver enters this OTP to start the ride & process payment</p>
                    </div>
                )}

                {/* ── Distance info ── */}
                {state === 'active' && distInfo && (
                    <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
                        <div className="bg-rs-sand/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-rs-desert-brown uppercase">To Pickup</p>
                            <p className="text-sm font-bold text-rs-deep-brown">{distInfo.toFrom < 1000 ? `${distInfo.toFrom}m` : `${(distInfo.toFrom / 1000).toFixed(1)}km`}</p>
                        </div>
                        <div className="bg-rs-sand/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-rs-desert-brown uppercase">To Drop</p>
                            <p className="text-sm font-bold text-rs-deep-brown">{distInfo.toTo < 1000 ? `${distInfo.toTo}m` : `${(distInfo.toTo / 1000).toFixed(1)}km`}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mx-4 mb-3 flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600">{error}</p>
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="p-4 pt-0 space-y-2">
                    {state === 'idle' && (
                        <>
                            <div className="flex items-start gap-2 p-3 bg-rs-sand/50 rounded-xl mb-3">
                                <Shield className="h-4 w-4 text-rs-terracotta mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-rs-desert-brown">
                                    Pay <strong>₹{totalCost}</strong> once upfront. Fares deducted per leg as you travel. Unused fare refunded on cancellation.
                                </p>
                            </div>
                            <button onClick={() => setState('review')}
                                className="w-full py-3.5 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
                                <CreditCard className="h-4 w-4" /> Book & Pay ₹{totalCost}
                            </button>
                        </>
                    )}

                    {state === 'review' && (
                        <div className="space-y-3">
                            <p className="text-xs text-rs-desert-brown font-medium text-center">Confirm your journey details above</p>
                            <button onClick={handleBookNow} disabled={isLoading}
                                className="w-full py-3.5 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                                {isLoading ? <><Loader className="h-4 w-4 animate-spin" /> Processing...</> : <><CheckCircle className="h-4 w-4" /> Proceed to Payment</>}
                            </button>
                            <button onClick={() => setState('idle')} className="w-full py-2.5 text-rs-terracotta text-sm font-medium">Go Back</button>
                        </div>
                    )}

                    {state === 'paying' && (
                        <div className="text-center py-4">
                            <Loader className="h-8 w-8 text-rs-terracotta animate-spin mx-auto mb-2" />
                            <p className="text-sm text-rs-desert-brown">Opening payment gateway...</p>
                        </div>
                    )}

                    {state === 'active' && (
                        <>
                            {!cancelConfirm ? (
                                <button onClick={() => setCancelConfirm(true)}
                                    className="w-full py-3 border-2 border-red-300 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                    <XCircle className="h-4 w-4" /> Cancel Journey
                                </button>
                            ) : (
                                <div className="space-y-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                    <p className="text-xs font-semibold text-red-700 text-center">Cancel this journey?</p>
                                    <p className="text-[11px] text-red-600 text-center">You'll get a refund of <strong>₹{refundEstimate}</strong></p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCancelConfirm(false)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold">Keep Journey</button>
                                        <button onClick={handleCancel} disabled={isLoading}
                                            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50">
                                            {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {state === 'completed' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-bold text-rs-deep-brown text-lg">Journey Complete!</h3>
                            <p className="text-xs text-rs-desert-brown mt-1">Total paid: ₹{amountDeducted}</p>
                        </div>
                    )}

                    {state === 'cancelled' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <X className="h-8 w-8 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-rs-deep-brown">Journey Cancelled</h3>
                            <p className="text-xs text-rs-desert-brown mt-1">₹{refundAmt} will be refunded within 5-7 working days</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
