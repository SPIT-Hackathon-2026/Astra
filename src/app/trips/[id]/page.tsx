'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plane,
  Train,
  Bus,
  Car,
  Clock,
  DollarSign,
  MapPin,
  Star,
  CheckCircle,
  Leaf,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

      console.log('📥 Trip data:', data);

      if (!response.ok) {
        setError(data.error || 'Failed to load trip');
        setIsLoading(false);
        return;
      }

      setTripData(data.trip);
    } catch (error: any) {
      console.error('❌ Error fetching trip:', error);
      setError('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'flight': return <Plane className="h-5 w-5 text-white" />;
      case 'train': return <Train className="h-5 w-5 text-white" />;
      case 'bus': return <Bus className="h-5 w-5 text-white" />;
      case 'car': return <Car className="h-5 w-5 text-white" />;
      default: return <MapPin className="h-5 w-5 text-white" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-purple-950">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Trip not found'}
          </h2>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {tripData.source} → {tripData.destination}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {tripData.duration} day{tripData.duration > 1 ? 's' : ''} trip • {tripData.travelers} traveler{tripData.travelers > 1 ? 's' : ''}
          </p>
        </div>

        {/* Cost Breakdown */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Estimated Cost Breakdown
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(tripData.costBreakdown).map(([key, value]) => (
              key !== 'total' && (
                <div key={key}>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">
                    {key}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{(value as number).toLocaleString()}
                  </div>
                </div>
              )
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-800">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Total Estimated Cost
              </span>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                ₹{tripData.costBreakdown.total.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Transport Options */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🚗 Transport Options
          </h2>

          {tripData.transportOptions.recommended && tripData.transportOptions.recommended.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Recommended Options
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {tripData.transportOptions.recommended.map((option: any, index: number) => (
                  <Card key={index} hover className="p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${
                          option.mode === 'flight' ? 'from-blue-500 to-cyan-500' :
                          option.mode === 'train' ? 'from-green-500 to-emerald-500' :
                          option.mode === 'bus' ? 'from-orange-500 to-red-500' :
                          'from-purple-500 to-pink-500'
                        }`}>
                          {getTransportIcon(option.mode)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white capitalize">
                            {option.mode}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.provider}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          ₹{option.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          per person
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {option.duration}h journey
                        </span>
                      </div>
                      {option.carbonFootprint && (
                        <div className="flex items-center space-x-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {option.carbonFootprint}kg CO₂
                          </span>
                        </div>
                      )}
                    </div>

                    {option.departureTime && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        🕐 Departs: {option.departureTime} • Arrives: {option.arrivalTime}
                      </div>
                    )}

                    {option.amenities && option.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {option.amenities.map((amenity: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button variant="primary" className="w-full">
                      Select This Option
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No transport options available for this route.</p>
          )}
        </Card>

        {/* Tourist Spots */}
        {tripData.touristSpots && tripData.touristSpots.length > 0 && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🏖️ Top Tourist Spots in {tripData.destination}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripData.touristSpots.map((spot: any, index: number) => (
                <Card key={index} hover className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {spot.name}
                    </h3>
                    <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        {spot.rating}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {spot.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Category:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {spot.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Time needed:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {spot.estimatedTime}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Entry fee:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {spot.entryFee === 0 ? 'Free' : `₹${spot.entryFee}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Best time:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {spot.bestTimeToVisit}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Suggested Itinerary */}
        {tripData.itinerary && tripData.itinerary.length > 0 && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📋 Suggested {tripData.duration}-Day Itinerary
            </h2>
            <div className="space-y-6">
              {tripData.itinerary.map((day: any[], index: number) => (
                <div key={index} className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Day {index + 1}
                  </h3>
                  <div className="space-y-3">
                    {day.map((spot: any, spotIndex: number) => (
                      <div key={spotIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {spotIndex + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {spot.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {spot.estimatedTime}h • {spot.category} • {spot.entryFee === 0 ? 'Free' : `₹${spot.entryFee}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="primary" className="flex-1">
            Confirm & Save Trip
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}