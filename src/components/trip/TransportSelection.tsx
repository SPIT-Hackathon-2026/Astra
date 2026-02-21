'use client';

import { useState } from 'react';
import { Train, Plane, Bus, Car, Navigation } from 'lucide-react';

interface TransportOption {
  mode: 'flight' | 'train' | 'bus' | 'metro' | 'car';
  provider: string;
  price: number;
  duration: number;
  departureTime: string;
  arrivalTime: string;
  stops?: number;
  carbonFootprint?: number;
  amenities?: string[];
  distance?: number;
  isRecommended?: boolean;
  recommendationReason?: string;
}

interface Props {
  options: TransportOption[];
  selectedTransport?: TransportOption;
  onSelect: (option: TransportOption) => void;
  onDeselect: () => void;
  travelers: number;
}

const modeIcons: Record<string, any> = {
  train: Train,
  flight: Plane,
  bus: Bus,
  car: Car,
  metro: Navigation,
};

const modeColors: Record<string, string> = {
  train: 'bg-blue-100 text-blue-700',
  flight: 'bg-purple-100 text-purple-700',
  bus: 'bg-green-100 text-green-700',
  car: 'bg-orange-100 text-orange-700',
  metro: 'bg-cyan-100 text-cyan-700',
};

export default function TransportSelection({
  options,
  selectedTransport,
  onSelect,
  onDeselect,
  travelers,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const recommendedOptions = options.filter(opt => opt.isRecommended);
  const otherOptions = options.filter(opt => !opt.isRecommended);

  const displayOptions = showAll ? options : recommendedOptions;

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const isSelected = (option: TransportOption) => {
    return (
      selectedTransport?.mode === option.mode &&
      selectedTransport?.provider === option.provider
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Choose Your Transport
          </h2>
          <p className="text-gray-600 mt-1">
            {selectedTransport
              ? 'Transport selected. Click to change or deselect.'
              : 'Select a transport option to update your trip cost'}
          </p>
        </div>
        {selectedTransport && (
          <button
            onClick={onDeselect}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
          >
            Deselect Transport
          </button>
        )}
      </div>

      {/* Recommended Options */}
      {recommendedOptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>🏆</span> Recommended for You
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendedOptions.map((option, idx) => (
              <TransportCard
                key={idx}
                option={option}
                travelers={travelers}
                isSelected={isSelected(option)}
                onSelect={onSelect}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Options Toggle */}
      {otherOptions.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition"
          >
            {showAll ? '▲ Show Less' : `▼ Show All ${options.length} Options`}
          </button>

          {showAll && (
            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherOptions.map((option, idx) => (
                <TransportCard
                  key={idx}
                  option={option}
                  travelers={travelers}
                  isSelected={isSelected(option)}
                  onSelect={onSelect}
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Options */}
      {options.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">
            No transport options available for this route.
          </p>
        </div>
      )}
    </div>
  );
}

function TransportCard({
  option,
  travelers,
  isSelected,
  onSelect,
  formatDuration,
}: {
  option: TransportOption;
  travelers: number;
  isSelected: boolean;
  onSelect: (option: TransportOption) => void;
  formatDuration: (hours: number) => string;
}) {
  const Icon = modeIcons[option.mode];
  const totalPrice = option.price * 2 * travelers; // Round trip

  return (
    <div
      onClick={() => onSelect(option)}
      className={`relative bg-white rounded-xl border-2 p-5 cursor-pointer transition hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 ring-4 ring-blue-100'
          : option.isRecommended
          ? 'border-yellow-400'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Recommended Badge */}
      {option.isRecommended && !isSelected && (
        <div className="absolute -top-3 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
          RECOMMENDED
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute -top-3 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <span>✓</span> SELECTED
        </div>
      )}

      {/* Mode Icon */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-lg ${modeColors[option.mode]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
            {option.provider}
          </h4>
          <p className="text-xs text-gray-500 mt-1 uppercase font-medium">
            {option.mode}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration</span>
          <span className="font-semibold text-gray-900">
            {formatDuration(option.duration)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Departure</span>
          <span className="font-semibold text-gray-900">
            {option.departureTime}
          </span>
        </div>
        {option.stops !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stops</span>
            <span className="font-semibold text-gray-900">{option.stops}</span>
          </div>
        )}
        {option.distance && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Distance</span>
            <span className="font-semibold text-gray-900">
              {option.distance} km
            </span>
          </div>
        )}
      </div>


      {/* Amenities */}
      {option.amenities && option.amenities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {option.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {amenity}
              </span>
            ))}
            {option.amenities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{option.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommendation Reason */}
      {option.recommendationReason && (
        <div className="mb-4 bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-800 leading-relaxed">
            {option.recommendationReason}
          </p>
        </div>
      )}

      {/* Price */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500">Total (Round Trip)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalPrice}</p>
            <p className="text-xs text-gray-500">
              ₹{option.price} × 2 × {travelers} traveler{travelers > 1 ? 's' : ''}
            </p>
          </div>
          <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
}