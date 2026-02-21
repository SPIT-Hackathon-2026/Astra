'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Users, Wallet, Plane, Hotel, Utensils, Landmark, Sparkles } from 'lucide-react';
import TransportFilter from '../../components/trip/TransportFilter';
import TransportSelection from '../../components/trip/TransportSelection';
import TouristSpotSelection from '../../components/trip/TouristSpotSelection';
import ItineraryDisplay from '../../components/trip/ItineraryDisplay';

export default function PlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trip, setTrip] = useState<any>(null);
  const [filteredTransport, setFilteredTransport] = useState<any[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [costs, setCosts] = useState({
    transport: 0,
    accommodation: 0,
    food: 0,
    attractions: 0,
    total: 0,
  });
  const [saving, setSaving] = useState(false);

  // Fetch trip data
  useEffect(() => {
    if (!tripId) {
      console.error('No trip ID found');
      setError('No trip ID provided');
      setLoading(false);
      return;
    }

    fetchTripData();
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching trip:', tripId);

      const res = await fetch(`/api/trips/${tripId}`);
      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('📦 Trip data received:', data);

      if (data.success && data.trip) {
        console.log('✅ Trip loaded successfully');
        setTrip(data.trip);
        setFilteredTransport(data.trip.transportOptions || []);
        setSelectedTransport(data.trip.selectedTransport || null);
        setSelectedSpots(data.trip.selectedTouristSpots || []);
        setItinerary(data.trip.itinerary || []);

        setCosts({
          transport: data.trip.costs?.transport || 0,
          accommodation: data.trip.costs?.accommodation || 0,
          food: data.trip.costs?.food || 0,
          attractions: data.trip.costs?.attractions || 0,
          total: data.trip.costs?.total || 0,
        });
      } else {
        throw new Error('Invalid trip data received');
      }
    } catch (error: any) {
      console.error('❌ Error fetching trip:', error);
      setError(error.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    if (!trip) return;
    console.log('🔧 Applying filters:', filters);
    let filtered = [...trip.transportOptions];

    if (filters.budget) {
      filtered = filtered.filter(
        opt => opt.price * 2 * trip.travelers <= filters.budget
      );
    }

    if (filters.modes && filters.modes.length > 0) {
      filtered = filtered.filter(opt => filters.modes.includes(opt.mode));
    }

    if (filters.maxDuration) {
      filtered = filtered.filter(opt => opt.duration <= filters.maxDuration);
    }

    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'duration') {
      filtered.sort((a, b) => a.duration - b.duration);
    }

    setFilteredTransport(filtered);
  };

  const handleSelectTransport = async (option: any) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transportOption: option }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedTransport(option);
        setCosts(data.costs);
      }
    } catch (error) {
      console.error('Error selecting transport:', error);
    }
  };

  const handleDeselectTransport = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/transport`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setSelectedTransport(null);
        setCosts(data.costs);
      }
    } catch (error) {
      console.error('Error deselecting transport:', error);
    }
  };

  const handleToggleSpot = async (spotName: string) => {
    const newSelected = selectedSpots.includes(spotName)
      ? selectedSpots.filter(s => s !== spotName)
      : [...selectedSpots, spotName];

    try {
      const res = await fetch(`/api/trips/${tripId}/spots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSpots: newSelected }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSpots(newSelected);
        setItinerary(data.itinerary);
        setCosts(data.costs);
      }
    } catch (error) {
      console.error('Error updating spots:', error);
    }
  };

  const handleSaveTrip = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/trips/${tripId}/save`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        alert('Trip saved successfully! ✅');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Trip
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const days = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-orange-100 dark:border-gray-700">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {trip.source} → {trip.destination}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5 rounded-lg">
                <MapPin className="h-4 w-4 text-pink-600" />
                <span className="text-gray-700 dark:text-gray-300">{days} days</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-orange-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Cost Breakdown
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <Plane className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Transport</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-300">₹{costs.transport}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <Hotel className="h-5 w-5 text-purple-600 mb-2" />
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">Accommodation</p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-300">₹{costs.accommodation}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <Utensils className="h-5 w-5 text-orange-600 mb-2" />
              <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">Food</p>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-300">₹{costs.food}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <Landmark className="h-5 w-5 text-green-600 mb-2" />
              <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Attractions</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-300">₹{costs.attractions}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-4 shadow-lg">
              <Sparkles className="h-5 w-5 text-white mb-2" />
              <p className="text-xs text-orange-100 font-medium mb-1">TOTAL</p>
              <p className="text-2xl font-bold text-white">₹{costs.total}</p>
            </div>
          </div>
        </div>

        {/* Transport Section */}
        {filteredTransport.length > 0 ? (
          <div className="mb-8">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <TransportFilter onFilterChange={handleFilterChange} />
              </div>
              <div className="lg:col-span-3">
                <TransportSelection
                  options={filteredTransport}
                  selectedTransport={selectedTransport}
                  onSelect={handleSelectTransport}
                  onDeselect={handleDeselectTransport}
                  travelers={trip.travelers}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
              ⚠️ No transport options available
            </p>
          </div>
        )}

        {/* Tourist Spots Section */}
        {trip.allTouristSpots && trip.allTouristSpots.length > 0 ? (
          <div className="mb-8">
            <TouristSpotSelection
              spots={trip.allTouristSpots}
              selectedSpots={selectedSpots}
              onToggleSpot={handleToggleSpot}
              maxDays={days}
            />
          </div>
        ) : (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
              ⚠️ No tourist spots found
            </p>
          </div>
        )}

        {/* Itinerary Section */}
        <div>
          <ItineraryDisplay
            itinerary={itinerary}
            onSaveTrip={handleSaveTrip}
            isSaving={saving}
          />
        </div>
      </div>
    </div>
  );
}