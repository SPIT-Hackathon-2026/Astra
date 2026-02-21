'use client';

import { useState } from 'react';

interface FilterOptions {
  budget?: number;
  modes?: string[];
  maxDuration?: number;
  sortBy?: 'price' | 'duration' | 'rating';
}

interface Props {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function TransportFilter({ onFilterChange }: Props) {
  const [budget, setBudget] = useState<number>();
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [maxDuration, setMaxDuration] = useState<number>();
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating'>('price');

  const modes = ['train', 'flight', 'bus', 'car', 'metro'];

  const handleApplyFilters = () => {
    onFilterChange({
      budget,
      modes: selectedModes.length > 0 ? selectedModes : undefined,
      maxDuration,
      sortBy,
    });
  };

  const handleModeToggle = (mode: string) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Filter Transport Options</h3>

      {/* Budget */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Budget (₹)
        </label>
        <input
          type="number"
          value={budget || ''}
          onChange={(e) => setBudget(Number(e.target.value))}
          placeholder="Enter max budget"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Transport Modes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transport Modes
        </label>
        <div className="flex flex-wrap gap-2">
          {modes.map(mode => (
            <button
              key={mode}
              onClick={() => handleModeToggle(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedModes.includes(mode)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Max Duration */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Duration (hours)
        </label>
        <input
          type="number"
          value={maxDuration || ''}
          onChange={(e) => setMaxDuration(Number(e.target.value))}
          placeholder="Enter max duration"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sort By */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="price">Price (Low to High)</option>
          <option value="duration">Duration (Shortest)</option>
          <option value="rating">Best Rated</option>
        </select>
      </div>

      <button
        onClick={handleApplyFilters}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
      >
        Apply Filters
      </button>
    </div>
  );
}