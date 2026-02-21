'use client';

import { useState } from 'react';
import { Star, Clock, MapPin, IndianRupee } from 'lucide-react';

interface TouristSpot {
  name: string;
  description: string;
  category: string;
  rating: number;
  estimatedTime: number;
  entryFee: number;
  bestTimeToVisit: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  image?: string;
  address?: string;
  isPopular?: boolean;
  popularity?: number;
}

interface Props {
  spots: TouristSpot[];
  selectedSpots: string[];
  onToggleSpot: (spotName: string) => void;
  maxDays: number;
}

export default function TouristSpotSelection({
  spots,
  selectedSpots,
  onToggleSpot,
  maxDays,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'popular'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const popularSpots = spots.filter(s => s.isPopular);
  const regularSpots = spots.filter(s => !s.isPopular);

  const displaySpots = filter === 'popular' ? popularSpots : spots;

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(spots.map(s => s.category)))];

  const filteredSpots =
    categoryFilter === 'all'
      ? displaySpots
      : displaySpots.filter(s => s.category === categoryFilter);

  const isSelected = (spotName: string) => selectedSpots.includes(spotName);

  const totalSelectedTime = selectedSpots.reduce((sum, name) => {
    const spot = spots.find(s => s.name === name);
    return sum + (spot?.estimatedTime || 0);
  }, 0);

  const totalSelectedFee = selectedSpots.reduce((sum, name) => {
    const spot = spots.find(s => s.name === name);
    return sum + (spot?.entryFee || 0);
  }, 0);

  const estimatedDaysNeeded = Math.ceil(totalSelectedTime / 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Select Tourist Spots
        </h2>
        <p className="text-gray-600 mt-1">
          Choose places you want to visit. We'll create a smart itinerary for you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">Selected</p>
          <p className="text-2xl font-bold text-blue-900">
            {selectedSpots.length}
          </p>
          <p className="text-xs text-blue-700 mt-1">spots</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">Total Time</p>
          <p className="text-2xl font-bold text-green-900">
            {totalSelectedTime.toFixed(1)}h
          </p>
          <p className="text-xs text-green-700 mt-1">
            ~{estimatedDaysNeeded} days needed
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-600 text-sm font-medium">Entry Fees</p>
          <p className="text-2xl font-bold text-purple-900">₹{totalSelectedFee}</p>
          <p className="text-xs text-purple-700 mt-1">per person</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-orange-600 text-sm font-medium">Trip Days</p>
          <p className="text-2xl font-bold text-orange-900">{maxDays}</p>
          <p className={`text-xs mt-1 ${
            estimatedDaysNeeded > maxDays ? 'text-red-600 font-semibold' : 'text-orange-700'
          }`}>
            {estimatedDaysNeeded > maxDays
              ? `⚠️ Reduce ${estimatedDaysNeeded - maxDays} days of spots`
              : '✓ Fits in schedule'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Spots ({spots.length})
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1 ${
              filter === 'popular'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className="w-4 h-4" />
            Popular ({popularSpots.length})
          </button>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Spots Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpots.map((spot, idx) => (
          <SpotCard
            key={idx}
            spot={spot}
            isSelected={isSelected(spot.name)}
            onToggle={() => onToggleSpot(spot.name)}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredSpots.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No spots found with current filters.</p>
        </div>
      )}
    </div>
  );
}

function SpotCard({
  spot,
  isSelected,
  onToggle,
}: {
  spot: TouristSpot;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 ring-4 ring-blue-100'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Popular Badge */}
      {spot.isPopular && (
        <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          POPULAR
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
          ✓
        </div>
      )}

      {/* Image */}
      {spot.image ? (
        <img
          src={spot.image}
          alt={spot.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <MapPin className="w-12 h-12 text-gray-400" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
          {spot.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">
              {spot.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-600 capitalize">
            {spot.category.replace(/_/g, ' ')}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {spot.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <Clock className="w-4 h-4" />
              Time needed
            </span>
            <span className="font-semibold text-gray-900">
              {spot.estimatedTime}h
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <IndianRupee className="w-4 h-4" />
              Entry fee
            </span>
            <span className="font-semibold text-gray-900">
              {spot.entryFee === 0 ? 'Free' : `₹${spot.entryFee}`}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">Best time:</p>
            <p className="text-sm font-medium text-gray-700">
              {spot.bestTimeToVisit}
            </p>
          </div>
        </div>

        {/* Address */}
        {spot.address && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 line-clamp-1">{spot.address}</p>
          </div>
        )}
      </div>

      {/* Select Button */}
      <div className="px-4 pb-4">
        <button
          className={`w-full py-2 rounded-lg font-medium text-sm transition ${
            isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSelected ? '✓ Selected' : 'Select Spot'}
        </button>
      </div>
    </div>
  );
}