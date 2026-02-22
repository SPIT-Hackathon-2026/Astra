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
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'time' | 'fee'>('popularity');

  const popularSpots = spots.filter(s => s.isPopular);

  const displaySpots = filter === 'popular' ? popularSpots : spots;

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(spots.map(s => s.category)))];

  const sortedSpots = [...displaySpots].sort((a, b) => {
    if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'time') return b.estimatedTime - a.estimatedTime;
    if (sortBy === 'fee') return a.entryFee - b.entryFee; // free first
    return 0;
  });

  const filteredSpots =
    categoryFilter === 'all'
      ? sortedSpots
      : sortedSpots.filter(s => s.category === categoryFilter);

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
        <h2 className="text-2xl font-bold text-[var(--rs-deep-brown)]">
          Select Tourist Spots
        </h2>
        <p className="text-[var(--rs-desert-brown)] mt-1">
          Choose places you want to visit. We'll create a smart itinerary for you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rs-sand)] rounded-lg p-4">
          <p className="text-[var(--rs-terracotta)] text-sm font-medium">Selected</p>
          <p className="text-2xl font-bold text-blue-900">
            {selectedSpots.length}
          </p>
          <p className="text-xs text-[var(--rs-terracotta-dark)] mt-1">spots</p>
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
          <p className={`text-xs mt-1 ${estimatedDaysNeeded > maxDays ? 'text-red-600 font-semibold' : 'text-orange-700'
            }`}>
            {estimatedDaysNeeded > maxDays
              ? `⚠️ Reduce ${estimatedDaysNeeded - maxDays} days of spots`
              : '✓ Fits in schedule'}
          </p>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filter === 'all'
                ? 'bg-[var(--rs-terracotta)] text-white'
                : 'bg-[var(--rs-sand)] text-[var(--rs-deep-brown)] hover:bg-[var(--rs-sand-dark)]'
              }`}
          >
            All Spots ({spots.length})
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-1 ${filter === 'popular'
                ? 'bg-yellow-500 text-white'
                : 'bg-[var(--rs-sand)] text-[var(--rs-deep-brown)] hover:bg-[var(--rs-sand-dark)]'
              }`}
          >
            <Star className="w-4 h-4" />
            Popular ({popularSpots.length})
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-[var(--rs-sand-dark)] rounded-lg focus:ring-2 focus:ring-[var(--rs-terracotta)] text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-[var(--rs-sand-dark)] rounded-lg focus:ring-2 focus:ring-[var(--rs-terracotta)] text-sm"
          >
            <option value="popularity">⭐ Most Popular</option>
            <option value="rating">🌟 Highest Rated</option>
            <option value="time">⏱ Longest Visit</option>
            <option value="fee">🆓 Free First</option>
          </select>
        </div>
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
        <div className="text-center py-12 bg-[var(--rs-sand-light)] rounded-lg">
          <p className="text-[var(--rs-desert-brown)] text-lg">No spots found with current filters.</p>
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
      className={`relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition hover:shadow-lg ${isSelected
          ? 'border-[var(--rs-terracotta)] ring-4 ring-blue-100'
          : 'border-[var(--rs-sand-dark)] hover:border-[var(--rs-terracotta-light)]'
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
        <div className="absolute top-3 right-3 z-10 bg-[var(--rs-terracotta)] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
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
        <h3 className="font-bold text-[var(--rs-deep-brown)] text-lg mb-1 line-clamp-1">
          {spot.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-[var(--rs-deep-brown)]">
              {spot.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-[var(--rs-desert-brown)]">•</span>
          <span className="text-xs text-[var(--rs-desert-brown)] capitalize">
            {spot.category.replace(/_/g, ' ')}
          </span>
        </div>

        <p className="text-sm text-[var(--rs-desert-brown)] line-clamp-2 mb-3">
          {spot.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-[var(--rs-desert-brown)]">
              <Clock className="w-4 h-4" />
              Time needed
            </span>
            <span className="font-semibold text-[var(--rs-deep-brown)]">
              {spot.estimatedTime}h
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-[var(--rs-desert-brown)]">
              <IndianRupee className="w-4 h-4" />
              Entry fee
            </span>
            <span className="font-semibold text-[var(--rs-deep-brown)]">
              {spot.entryFee === 0 ? 'Free' : `₹${spot.entryFee}`}
            </span>
          </div>

          <div className="pt-2 border-t border-[var(--rs-sand-dark)]">
            <p className="text-xs text-[var(--rs-desert-brown)]">Best time:</p>
            <p className="text-sm font-medium text-[var(--rs-deep-brown)]">
              {spot.bestTimeToVisit}
            </p>
          </div>
        </div>

        {/* Address */}
        {spot.address && (
          <div className="mt-3 pt-3 border-t border-[var(--rs-sand-dark)]">
            <p className="text-xs text-[var(--rs-desert-brown)] line-clamp-1">{spot.address}</p>
          </div>
        )}
      </div>

      {/* Select Button */}
      <div className="px-4 pb-4">
        <button
          className={`w-full py-2 rounded-lg font-medium text-sm transition ${isSelected
              ? 'bg-[var(--rs-terracotta)] text-white'
              : 'bg-[var(--rs-sand)] text-[var(--rs-deep-brown)] hover:bg-[var(--rs-sand-dark)]'
            }`}
        >
          {isSelected ? '✓ Selected' : 'Select Spot'}
        </button>
      </div>
    </div>
  );
}