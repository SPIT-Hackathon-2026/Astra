'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Sparkles,
  Wallet,
  Plane,
  Hotel,
  Utensils,
  Landmark,
  Save,
  Loader,
} from 'lucide-react';
import TransportFilter from '../../../components/trip/TransportFilter';
import TransportSelection from '../../../components/trip/TransportSelection';
import TouristSpotSelection from '../../../components/trip/TouristSpotSelection';
import ItineraryDisplay from '../../../components/trip/ItineraryDisplay';

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredTransport, setFilteredTransport] = useState<any[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTripDetails();
    }
  }, [params.id]);

   const fetchTripDetails = async () => {
    try {
      console.log('🔍 Fetching trip:', params.id);
      
      const response = await fetch(`/api/trips/${params.id}`);
      const data = await response.json();

      console.log('📥 Raw API Response:', data);
      console.log('📦 Trip object keys:', Object.keys(data.trip || {}));
      console.log('🎯 allTouristSpots exists?', 'allTouristSpots' in (data.trip || {}));
      console.log('🎯 touristSpots exists?', 'touristSpots' in (data.trip || {}));
      console.log('🎯 allTouristSpots value:', data.trip?.allTouristSpots);
      console.log('🎯 touristSpots value:', data.trip?.touristSpots);
      
      if (!response.ok) {
        setError(data.error || 'Failed to load trip');
        setIsLoading(false);
        return;
      }

      console.log('✅ Trip data counts:');
      console.log('  - Transport options:', data.trip?.transportOptions?.length || 0);
      console.log('  - Tourist spots (allTouristSpots):', data.trip?.allTouristSpots?.length || 0);
      console.log('  - Tourist spots (touristSpots):', data.trip?.touristSpots?.length || 0);
      console.log('  - Itinerary days:', data.trip?.itinerary?.length || 0);

      setTripData(data.trip);
      setFilteredTransport(data.trip.transportOptions || []);
      setSelectedSpots(data.trip.selectedTouristSpots || []);
    } catch (error: any) {
      console.error('❌ Error fetching trip:', error);
      setError('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    if (!tripData || !tripData.transportOptions) return;
    
    let filtered = [...tripData.transportOptions];

    if (filters.budget) {
      filtered = filtered.filter(
        opt => opt.price * 2 * tripData.travelers <= filters.budget
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
      const res = await fetch(`/api/trips/${params.id}/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transportOption: option }),
      });

      const data = await res.json();
      if (data.success) {
        setTripData({
          ...tripData,
          selectedTransport: option,
          costs: data.costs,
        });
      }
    } catch (error) {
      console.error('Error selecting transport:', error);
    }
  };

  const handleDeselectTransport = async () => {
    try {
      const res = await fetch(`/api/trips/${params.id}/transport`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setTripData({
          ...tripData,
          selectedTransport: null,
          costs: data.costs,
        });
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
      const res = await fetch(`/api/trips/${params.id}/spots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSpots: newSelected }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSpots(newSelected);
        setTripData({
          ...tripData,
          selectedTouristSpots: newSelected,
          itinerary: data.itinerary,
          costs: data.costs,
        });
      }
    } catch (error) {
      console.error('Error updating spots:', error);
    }
  };

  const handleSaveTrip = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/trips/${params.id}/save`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        alert('Trip saved successfully! ✅');
        router.push('/dashboard');
      } else {
        alert('Failed to save trip: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-purple-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Trip Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Unable to load trip details'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const days = Math.ceil(
    (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {tripData.source} → {tripData.destination}
              </h1>
              <button
                onClick={handleSaveTrip}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Trip
                  </>
                )}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(tripData.startDate).toLocaleDateString()} - {new Date(tripData.endDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>{days} days</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{tripData.travelers} traveler{tripData.travelers > 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <DollarSign className="h-4 w-4" />
                <span className="capitalize">{tripData.budgetType}</span>
              </div>
              
            </div>
            {/* Debug Info - Remove in production */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs">
          <p className="font-bold mb-2">Debug Info:</p>
          <p>Transport Options: {tripData.transportOptions?.length || 0}</p>
          <p>Tourist Spots: {tripData.touristSpots?.length || 0}</p>
          <p>Itinerary Days: {tripData.itinerary?.length || 0}</p>
          <p>Selected Spots: {selectedSpots.length}</p>
        </div>
          </div>
        </div>

        {/* Cost Summary */}
        {tripData.costs && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Wallet className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Cost Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <Plane className="h-5 w-5 text-blue-600 mb-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transport</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{tripData.costs.transport}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <Hotel className="h-5 w-5 text-purple-600 mb-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Accommodation</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{tripData.costs.accommodation}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <Utensils className="h-5 w-5 text-orange-600 mb-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Food</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{tripData.costs.food}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <Landmark className="h-5 w-5 text-green-600 mb-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Attractions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{tripData.costs.attractions}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 shadow-lg">
                <Sparkles className="h-5 w-5 text-white mb-2" />
                <p className="text-xs text-white/80 mb-1">TOTAL</p>
                <p className="text-2xl font-bold text-white">₹{tripData.costs.total}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transport Section with Filters */}
        {tripData.transportOptions && tripData.transportOptions.length > 0 && (
          <div className="mb-8">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <TransportFilter onFilterChange={handleFilterChange} />
              </div>
              <div className="lg:col-span-3">
                <TransportSelection
                  options={filteredTransport}
                  selectedTransport={tripData.selectedTransport || null}
                  onSelect={handleSelectTransport}
                  onDeselect={handleDeselectTransport}
                  travelers={tripData.travelers}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tourist Spots Selection */}
        {tripData.allTouristSpots?.length > 0 && (
  <TouristSpotSelection
    spots={tripData.allTouristSpots}
    selectedSpots={selectedSpots}
    onToggleSpot={handleToggleSpot}
    maxDays={days}
  />
)}

        {/* Itinerary Display */}
        {tripData.itinerary && tripData.itinerary.length > 0 && (
          <div>
            <ItineraryDisplay
              itinerary={tripData.itinerary}
              onSaveTrip={handleSaveTrip}
              isSaving={saving}
            />
          </div>
        )}

        
      </div>
    </div>
  );
}