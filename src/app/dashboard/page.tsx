'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Mic, 
  Plus,
  Settings,
  User,
  LogOut,
  TrendingUp,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TripPlanningForm } from '../../components/trip/TripPlanningForm';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const stats = [
    { label: 'Active Trips', value: '3', icon: Plane, color: 'from-blue-500 to-cyan-500' },
    { label: 'Places Visited', value: '24', icon: MapPin, color: 'from-purple-500 to-pink-500' },
    { label: 'Upcoming', value: '2', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { label: 'Saved Routes', value: '12', icon: Star, color: 'from-green-500 to-emerald-500' },
  ];

  const recentTrips = [
    {
      destination: 'Paris, France',
      date: 'Dec 15-22, 2024',
      status: 'Upcoming',
      image: '🗼',
      color: 'from-pink-500 to-rose-500',
    },
    {
      destination: 'Tokyo, Japan',
      date: 'Jan 5-12, 2025',
      status: 'Planning',
      image: '🗾',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      destination: 'New York, USA',
      date: 'Nov 10-15, 2024',
      status: 'Completed',
      image: '🗽',
      color: 'from-purple-500 to-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950">
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Radiator Routes
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {greeting}, {session?.user?.name?.split(' ')[0] || 'Traveler'}! 👋
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Ready to plan your next adventure?
          </p>
        </div>

        {/* Quick Action - Create Trip */}
        <Card className="p-8 mb-12 bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl font-bold mb-2">Plan New Trip</h2>
              <p className="text-blue-100 text-lg">Use voice or text to create your perfect itinerary</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowTripForm(true)}
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Trip
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Mic className="mr-2 h-5 w-5" />
                Voice Plan
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Trips */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Trips
            </h2>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center">
              View All
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentTrips.map((trip, index) => (
              <Card key={index} hover className="overflow-hidden group cursor-pointer">
                <div className={`h-32 bg-gradient-to-br ${trip.color} flex items-center justify-center text-6xl`}>
                  {trip.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.status === 'Upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      trip.status === 'Planning' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {trip.destination}
                  </h3>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">{trip.date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                AI Recommendations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Based on your travel history, we think you'll love these destinations
              </p>
              <div className="flex flex-wrap gap-3">
                {['Bali, Indonesia', 'Barcelona, Spain', 'Dubai, UAE', 'Iceland'].map((place, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:scale-105 transform transition-transform"
                  >
                    {place}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trip Planning Modal */}
      {showTripForm && (
        <TripPlanningForm onClose={() => setShowTripForm(false)} />
      )}
    </div>
  );
}