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
    <div className="bg-white rounded-xl border border-[var(--rs-sand-dark)] p-5 shadow-sm">
      <h3 className="text-base font-bold text-[var(--rs-deep-brown)] mb-4">Filter Options</h3>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-[var(--rs-desert-brown)] mb-1.5">Max Budget (₹)</label>
        <input type="number" value={budget || ''} onChange={(e) => setBudget(Number(e.target.value))}
          placeholder="e.g. 5000"
          className="w-full px-3 py-2 border border-[var(--rs-sand-dark)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--rs-terracotta)] focus:border-[var(--rs-terracotta)] bg-[var(--rs-sand-light)] text-[var(--rs-deep-brown)]" />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-[var(--rs-desert-brown)] mb-1.5">Transport Modes</label>
        <div className="flex flex-wrap gap-1.5">
          {modes.map(mode => (
            <button key={mode} onClick={() => handleModeToggle(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedModes.includes(mode)
                  ? 'bg-[var(--rs-terracotta)] text-white'
                  : 'bg-[var(--rs-sand)] text-[var(--rs-deep-brown)] hover:bg-[var(--rs-sand-dark)]'
                }`}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-[var(--rs-desert-brown)] mb-1.5">Max Duration (hours)</label>
        <input type="number" value={maxDuration || ''} onChange={(e) => setMaxDuration(Number(e.target.value))}
          placeholder="e.g. 12"
          className="w-full px-3 py-2 border border-[var(--rs-sand-dark)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--rs-terracotta)] focus:border-[var(--rs-terracotta)] bg-[var(--rs-sand-light)] text-[var(--rs-deep-brown)]" />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-[var(--rs-desert-brown)] mb-1.5">Sort By</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full px-3 py-2 border border-[var(--rs-sand-dark)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--rs-terracotta)] bg-[var(--rs-sand-light)] text-[var(--rs-deep-brown)]">
          <option value="price">Price (Low to High)</option>
          <option value="duration">Duration (Shortest)</option>
          <option value="rating">Best Rated</option>
        </select>
      </div>

      <button onClick={handleApplyFilters}
        className="w-full bg-gradient-to-r from-[var(--rs-terracotta)] to-[var(--rs-sunset-orange)] text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition">
        Apply Filters
      </button>
    </div>
  );
}