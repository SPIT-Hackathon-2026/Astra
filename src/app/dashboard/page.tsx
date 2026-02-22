'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Mic,
  Plus,
  Settings,
  LogOut,
  Clock,
  Star,
  ChevronRight,
  Car,
  Route,
  Bell,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TripPlanningForm } from '../../components/trip/TripPlanningForm';
import { VoicePlanModal } from '../../components/trip/VoicePlanModal';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [greeting, setGreeting] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);
<<<<<<< HEAD
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);
=======
  const [trips, setTrips] = useState<any[]>([]);
const [loadingTrips, setLoadingTrips] = useState(true);
// Add this helper function before the return statement
const calculateStats = () => {
  const totalTrips = trips.length;
  
  const confirmedTrips = trips.filter(trip => 
    trip.status?.toLowerCase() === 'confirmed'
  ).length;
  
  const totalSpots = trips.reduce((sum, trip) => 
    sum + (trip.allTouristSpots?.length || 0), 0
  );
  
  const totalCost = trips.reduce((sum, trip) => 
    sum + (trip.costs?.total || 0), 0
  );
>>>>>>> 02dd206811b6adb7b1de1221ba26aadd3c3f4905

  return [
    {
      icon: MapPin,
      label: 'Total Trips',
      value: totalTrips,
      color: 'from-rs-terracotta to-orange-600'
    },
    {
      icon: Calendar,
      label: 'Confirmed',
      value: confirmedTrips,
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Star,
      label: 'Tourist Spots',
      value: totalSpots,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: TrendingUp,
      label: 'Total Budget',
      value: totalCost > 0 ? `₹${(totalCost / 1000).toFixed(1)}k` : '₹0',
      color: 'from-purple-500 to-pink-600'
    }
  ];
};
  useEffect(() => {
    if (searchParams.get('plan') === 'true') {
      fetch('/api/chat/context')
        .then(res => res.json())
        .then(data => {
          setInitialFormData(data);
          setShowTripForm(true);
        })
        .catch(() => {
          setShowTripForm(true);
        });
    }

    /* if (status === 'unauthenticated') {
       router.push('/login');
     }*/
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
<<<<<<< HEAD
  }, [status, router, searchParams]);
=======
  }, [status, router]);
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch('/api/trips/fetch');
        if (!res.ok) throw new Error('Failed to fetch trips');
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error('Error fetching trips:', err);
      } finally {
        setLoadingTrips(false);
      }
    };
  
    if (status === 'authenticated') {
      fetchTrips();
    }
  }, [status]);
>>>>>>> 02dd206811b6adb7b1de1221ba26aadd3c3f4905

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rs-sand-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-rs-terracotta border-t-transparent mx-auto mb-3" />
          <p className="text-rs-desert-brown text-sm">Loading your trips...</p>
        </div>
      </div>
    );
  }


  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

 
  const firstName = session?.user?.name?.split(' ')[0] || 'Traveler';

  return (
    <div className="min-h-screen bg-rs-sand-light">
      {/* Dashboard Nav */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-rs-sand-dark/25 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2.5">
              <Image src="/images/logo-icon.png" alt="Radiator Routes" width={32} height={32} className="rounded-lg" />
              <span className={`${luckiestGuy.className} text-lg text-rs-terracotta hidden sm:block`}>
                Radiator Routes
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="p-2.5 rounded-lg hover:bg-rs-sand/50 transition-colors text-rs-desert-brown" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-lg hover:bg-rs-sand/50 transition-colors text-rs-desert-brown" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-rs-sand-dark/30 mx-1 hidden sm:block" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rs-sand/50 transition-colors text-rs-desert-brown"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-10">
        {/* Welcome */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-rs-deep-brown mb-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-rs-desert-brown text-sm sm:text-base">
            Ready to plan your next adventure?
          </p>
        </div>

        {/* Quick Action Card */}
        <div className="relative rounded-2xl overflow-hidden mb-8 sm:mb-10 shadow-lg">
          <Image
            src="/images/hero-bg.png"
            alt="Open road"
            width={1200}
            height={300}
            className="w-full h-40 sm:h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rs-deep-brown/90 via-rs-deep-brown/70 to-rs-deep-brown/40" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Plan a New Trip</h2>
                <p className="text-white/60 text-sm sm:text-base">Use voice or text to create your perfect route</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange shadow-md"
                  onClick={() => setShowTripForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create long trip
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 sm:flex-none bg-rs-deep-brown shadow-md"
                  onClick={() => setShowVoiceModal(true)}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Voice Plan
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-white/30 text-white hover:bg-white/10"
                  onClick={() => router.push('/plan')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Short Trip
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {calculateStats().map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-rs-sand-dark/20 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-rs-deep-brown mb-0.5">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-rs-desert-brown">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

        {/* Recent Trips */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-rs-deep-brown">
              Your Trips
            </h2>
            <button className="text-rs-terracotta text-sm font-medium flex items-center gap-1 hover:underline">
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
           {loadingTrips ? (
  <p className="text-sm text-rs-desert-brown">Loading trips...</p>
) : trips.length === 0 ? (
  <p className="text-sm text-rs-desert-brown">No trips created yet</p>
) : (
  trips.map((trip) => (
    <div
      key={trip._id}
      onClick={() => router.push(`/trips/${trip._id}`)}
      className="bg-white rounded-xl overflow-hidden border border-rs-sand-dark/20 hover:shadow-lg hover:border-rs-terracotta/15 transition-all duration-300 cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-36 sm:h-40 overflow-hidden">
        <Image
          src={trip.coverImage || '/images/trip-canyon.png'}
          alt={trip.destination}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Status */}
        <div className="mb-2">
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rs-neon-teal/15 text-rs-neon-teal">
            {trip.status || 'Planned'}
          </span>
        </div>

        {/* Destination */}
        <h3 className="text-base sm:text-lg font-bold text-rs-deep-brown mb-1.5 group-hover:text-rs-terracotta transition-colors">
          {trip.destination}
        </h3>

        {/* Dates */}
        <div className="flex items-center text-rs-desert-brown text-sm">
          <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          {new Date(trip.startDate).toLocaleDateString()} –{' '}
          {new Date(trip.endDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  ))
)}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl p-5 sm:p-7 border border-rs-sand-dark/20">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rs-sunset-purple to-rs-sunset-pink flex-shrink-0">
              <Route className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-rs-deep-brown mb-1.5">
                Recommended Routes
              </h3>
              <p className="text-rs-desert-brown text-sm mb-4">
                Based on your travel history, you might enjoy these:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Blue Ridge Parkway', 'Overseas Highway', 'Going-to-the-Sun Road', 'Tail of the Dragon'].map((place, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-rs-sand-light rounded-lg text-sm font-medium text-rs-deep-brown border border-rs-sand-dark/20 hover:bg-rs-terracotta/8 hover:text-rs-terracotta hover:border-rs-terracotta/20 transition-all cursor-pointer"
                  >
                    {place}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Planning Modal */}
      {showTripForm && (
        <TripPlanningForm
          onClose={() => setShowTripForm(false)}
          initialData={initialFormData}
        />
      )}

      {showVoiceModal && (
        <VoicePlanModal
          onClose={() => setShowVoiceModal(false)}
          onSuccess={() => {
            // Optional: refresh trip list logic if implemented
          }}
        />
      )}
    </div>
  );
}