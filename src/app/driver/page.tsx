'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Car, MapPin, CheckCircle, XCircle, Clock, IndianRupee, Navigation,
    Wifi, WifiOff, Star, KeyRound, Phone, User, Truck, Shield, LogOut,
    ChevronRight, Bell, TrendingUp, Route, AlertCircle,
} from 'lucide-react';

interface DriverData {
    id: string;
    name: string;
    email: string;
    vehicleType: string;
    vehicleNumber: string;
}

interface RideRequest {
    _id: string;
    journeyId: string;
    legIndex: number;
    pickupName: string;
    dropName: string;
    estimatedFare: number;
    estimatedDuration: number;
    estimatedDistance: number;
    vehicleType: string;
    otp?: string;
    status: string;
    createdAt: string;
}

type Screen = 'auth' | 'dashboard' | 'ride_active';

export default function DriverDashboard() {
    const [screen, setScreen] = useState<Screen>('auth');
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const [driver, setDriver] = useState<DriverData | null>(null);
    const [token, setToken] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [earnings, setEarnings] = useState({ today: 0, total: 0, rides: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const locationRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Auth form
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        vehicleType: 'auto', vehicleNumber: '', vehicleModel: '',
    });

    // ── Geolocation ──
    const startTracking = useCallback(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setLocation({ lat, lng });
                if (driver && token) {
                    fetch('/api/driver/location', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ driverId: driver.id, lat, lng, isOnline: true }),
                    });
                }
            },
            (err) => console.error('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [driver, token]);

    // ── Poll for ride requests ──
    const pollRides = useCallback(() => {
        if (!driver || !isOnline) return;
        // Use current location if available, otherwise send 0,0 (API will return all pending)
        const lat = location?.lat ?? 0;
        const lng = location?.lng ?? 0;
        fetch(`/api/driver/rides?driverId=${driver.id}&lat=${lat}&lng=${lng}`)
            .then(r => r.json())
            .then(data => setRides(data.rides || []))
            .catch(console.error);
    }, [driver, location, isOnline]);

    useEffect(() => {
        if (isOnline && driver) {
            // Immediate fetch, then poll every 10s
            pollRides();
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(pollRides, 10000);
            return () => { if (pollRef.current) clearInterval(pollRef.current); };
        } else {
            if (pollRef.current) clearInterval(pollRef.current);
            setRides([]);
        }
    }, [isOnline, driver, pollRides]);

    useEffect(() => {
        if (screen === 'dashboard') startTracking();
    }, [screen, startTracking]);

    // ── Auth ──
    const handleAuth = async () => {
        setIsLoading(true); setError('');
        const action = authTab;
        const payload = action === 'login'
            ? { action, email: form.email, password: form.password }
            : { action, ...form };

        const res = await fetch('/api/driver/auth', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        setIsLoading(false);

        if (!res.ok) { setError(data.error); return; }
        setDriver(data.driver);
        setToken(data.token);
        localStorage.setItem('driver_token', data.token);
        localStorage.setItem('driver_data', JSON.stringify(data.driver));
        setScreen('dashboard');
    };

    // ── Accept/Reject Ride ──
    const handleRideAction = async (rideId: string, act: 'accept' | 'reject') => {
        setIsLoading(true);
        const res = await fetch('/api/driver/rides', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rideId, driverId: driver!.id, action: act }),
        });
        const data = await res.json();
        setIsLoading(false);

        if (act === 'accept' && res.ok) {
            setActiveRide(data.ride);
            setRides(prev => prev.filter(r => r._id !== rideId));
            setScreen('ride_active');
        } else {
            setRides(prev => prev.filter(r => r._id !== rideId));
        }
    };

    // ── Verify OTP ──
    const handleVerifyOTP = async () => {
        if (!activeRide) return;
        setIsLoading(true); setError('');
        const res = await fetch('/api/journey/verify-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ journeyId: activeRide.journeyId, legIndex: activeRide.legIndex, otp: otpInput, driverId: driver!.id }),
        });
        const data = await res.json();
        setIsLoading(false);
        if (res.ok) {
            setOtpVerified(true);
            setSuccess('OTP verified! Journey started. Drop customer at destination.');
        } else {
            setError(data.error || 'Invalid OTP');
        }
    };

    // ── Complete Ride ──
    const handleCompleteRide = () => {
        setEarnings(prev => ({
            today: prev.today + (activeRide?.estimatedFare || 0),
            total: prev.total + (activeRide?.estimatedFare || 0),
            rides: prev.rides + 1,
        }));
        setActiveRide(null);
        setOtpInput('');
        setOtpVerified(false);
        setSuccess('Ride completed! Payment received.');
        setScreen('dashboard');
    };

    const vehicleIcon = (type: string) => {
        if (type === 'auto') return '🛺';
        if (type === 'taxi') return '🚕';
        return '🚗';
    };

    // ══════════════════════════════════════════
    // AUTH SCREEN
    // ══════════════════════════════════════════
    if (screen === 'auth') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <span className="text-4xl">🛺</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">RideConnect</h1>
                        <p className="text-yellow-900/80 text-sm mt-1">Driver Partner App</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Tab toggle */}
                        <div className="flex border-b border-gray-100">
                            {(['login', 'register'] as const).map(tab => (
                                <button key={tab} onClick={() => setAuthTab(tab)}
                                    className={`flex-1 py-4 text-sm font-bold capitalize transition-colors ${authTab === tab ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {tab === 'login' ? 'Sign In' : 'Register'}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 space-y-4">
                            {authTab === 'register' && (
                                <>
                                    <input placeholder="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                    <input placeholder="Phone Number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                    <select value={form.vehicleType} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                                        <option value="auto">Auto Rickshaw 🛺</option>
                                        <option value="taxi">Taxi 🚕</option>
                                        <option value="cab">Cab 🚗</option>
                                    </select>
                                    <input placeholder="Vehicle Number (e.g. MH-01-AB-1234)" value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                </>
                            )}
                            <input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

                            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                            <button onClick={handleAuth} disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-base disabled:opacity-50 transition-all shadow-lg">
                                {isLoading ? 'Please wait...' : authTab === 'login' ? 'Sign In →' : 'Create Account →'}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                By continuing, you agree to our Terms of Service and Privacy Policy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // ACTIVE RIDE SCREEN
    // ══════════════════════════════════════════
    if (screen === 'ride_active' && activeRide) {
        return (
            <div className="min-h-screen bg-amber-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 pt-8 pb-6">
                    <h2 className="text-xl font-black mb-1">Active Ride 🛺</h2>
                    <p className="text-amber-100 text-sm">Verify OTP then start journey</p>
                </div>

                <div className="px-4 -mt-3 space-y-4 pb-24">
                    {/* Route card */}
                    <div className="bg-white rounded-2xl shadow-md p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex flex-col items-center mt-1">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <div className="w-0.5 h-12 bg-gray-200" />
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                            </div>
                            <div className="flex-1">
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup</p>
                                    <p className="text-sm font-semibold text-gray-800">{activeRide.pickupName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Drop</p>
                                    <p className="text-sm font-semibold text-gray-800">{activeRide.dropName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Fare</p>
                                <p className="text-lg font-black text-amber-600">₹{activeRide.estimatedFare}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Distance</p>
                                <p className="text-lg font-black text-gray-800">{(activeRide.estimatedDistance / 1000).toFixed(1)} km</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">ETA</p>
                                <p className="text-lg font-black text-gray-800">{activeRide.estimatedDuration} min</p>
                            </div>
                        </div>
                    </div>

                    {/* OTP verification */}
                    {!otpVerified ? (
                        <div className="bg-white rounded-2xl shadow-md p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <KeyRound className="h-5 w-5 text-amber-600" />
                                <h3 className="font-bold text-gray-800">Enter Customer OTP</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Ask the customer for their OTP to start the journey. Payment will be processed at the drop location.</p>

                            <div className="flex gap-2 mb-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="flex-1 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center">
                                        <span className="text-xl font-black text-amber-700">{otpInput[i] || '·'}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Number pad */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
                                    <button key={i}
                                        onClick={() => {
                                            if (num === '⌫') setOtpInput(p => p.slice(0, -1));
                                            else if (num !== '' && otpInput.length < 4) setOtpInput(p => p + num);
                                        }}
                                        className={`h-12 rounded-xl font-bold text-lg transition-colors ${num === '' ? '' : 'bg-amber-50 hover:bg-amber-100 text-gray-700 active:scale-95'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>

                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                            <button onClick={handleVerifyOTP} disabled={otpInput.length !== 4 || isLoading}
                                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl disabled:opacity-40 transition-all">
                                {isLoading ? 'Verifying...' : 'Verify OTP & Start'}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-md p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">OTP Verified!</h3>
                                    <p className="text-xs text-gray-500">Journey in progress</p>
                                </div>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-amber-800">🎯 Drop customer at <strong>{activeRide.dropName}</strong></p>
                                <p className="text-xs text-amber-600 mt-1">Payment of <strong>₹{activeRide.estimatedFare}</strong> will be auto-settled when customer reaches destination.</p>
                            </div>
                            <button onClick={handleCompleteRide}
                                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">
                                Mark as Completed ✓
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">{success}</div>
                    )}
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // MAIN DRIVER DASHBOARD
    // ══════════════════════════════════════════
    return (
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 pt-8 pb-20">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-amber-100 text-xs">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'} 👋</p>
                        <h1 className="text-xl font-black">{driver?.name}</h1>
                    </div>
                    <button onClick={() => { setDriver(null); setToken(''); setScreen('auth'); }}
                        className="p-2 bg-white/20 rounded-full">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{vehicleIcon(driver?.vehicleType || 'auto')}</span>
                    <span className="text-amber-100 text-sm">{driver?.vehicleType?.toUpperCase()} · {driver?.vehicleNumber || 'N/A'}</span>
                </div>
            </div>

            {/* Online toggle */}
            <div className="px-4 -mt-10 mb-4">
                <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className={`text-base font-black ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                            {isOnline ? '🟢 Online — Accepting Rides' : '⚪ Offline'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOnline(prev => !prev)}
                        className={`w-16 h-8 rounded-full transition-all flex items-center ${isOnline ? 'bg-green-500 justify-end' : 'bg-gray-200 justify-start'} p-1`}>
                        <div className="w-6 h-6 bg-white rounded-full shadow-md" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 mb-4 grid grid-cols-3 gap-3">
                {[
                    { label: "Today's Earning", value: `₹${earnings.today}`, icon: IndianRupee, color: 'text-amber-600' },
                    { label: 'Total Rides', value: earnings.rides, icon: Route, color: 'text-blue-600' },
                    { label: 'Rating', value: '4.8 ⭐', icon: Star, color: 'text-yellow-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm p-3 text-center">
                        <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Ride requests */}
            <div className="px-4 pb-24">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-800">Incoming Requests</h2>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                        {rides.filter(r => r.status === 'pending').length} nearby
                    </span>
                </div>

                {!isOnline && (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <WifiOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Go online to receive ride requests</p>
                    </div>
                )}

                {isOnline && rides.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="h-8 w-8 text-amber-500 animate-pulse" />
                        </div>
                        <p className="text-gray-700 font-semibold">Waiting for requests...</p>
                        <p className="text-gray-400 text-sm mt-1">Requests within 10km will appear here</p>
                    </div>
                )}

                <div className="space-y-4">
                    {rides.filter(r => r.status === 'pending').map((ride) => (
                        <div key={ride._id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                            {/* Top accent */}
                            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
                            <div className="p-4">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl">{vehicleIcon(ride.vehicleType)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                            <div className="flex flex-col items-center mt-1 mr-1">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                <div className="w-0.5 h-8 bg-gray-200" />
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Pickup</p>
                                                <p className="text-sm font-semibold text-gray-800 leading-tight">{ride.pickupName}</p>
                                                <p className="text-xs text-gray-500 mt-2 mb-1">Drop</p>
                                                <p className="text-sm font-semibold text-gray-800 leading-tight">{ride.dropName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 p-3 bg-amber-50 rounded-xl mb-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500">Fare</p>
                                        <p className="font-black text-amber-600 text-base">₹{ride.estimatedFare}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500">Distance</p>
                                        <p className="font-bold text-gray-700 text-sm">{(ride.estimatedDistance / 1000).toFixed(1)} km</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500">Duration</p>
                                        <p className="font-bold text-gray-700 text-sm">{ride.estimatedDuration} min</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => handleRideAction(ride._id, 'reject')}
                                        className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-red-300 hover:text-red-500 transition-colors flex items-center justify-center gap-1">
                                        <XCircle className="h-4 w-4" /> Decline
                                    </button>
                                    <button onClick={() => handleRideAction(ride._id, 'accept')}
                                        className="flex-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all active:scale-95">
                                        <CheckCircle className="h-4 w-4" /> Accept Ride
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around">
                {[
                    { icon: '🏠', label: 'Home' },
                    { icon: '📋', label: 'History' },
                    { icon: '💰', label: 'Earnings' },
                    { icon: '👤', label: 'Profile' },
                ].map((item, i) => (
                    <button key={i} className={`flex flex-col items-center gap-0.5 py-1 px-3 ${i === 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
