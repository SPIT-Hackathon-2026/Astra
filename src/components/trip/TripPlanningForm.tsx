'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Calendar, Users, Sparkles, Loader, X,
  Compass, Mountain, UtensilsCrossed, Camera,
  Heart, Waves, History, TreePine, ShoppingBag,
  Moon, Dumbbell, Music, Baby, Dog,
  Accessibility, Briefcase, Palmtree, Backpack, Crown,
  Hotel, Home, Building, Tent,
  Zap, Gauge, Coffee, ArrowRight, Lightbulb,
  Globe, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TripPlanningFormProps {
  onClose: () => void;
}

const INTEREST_OPTIONS = [
  { id: 'beach', label: 'Beaches', icon: Waves, color: '#5BA4CF' },
  { id: 'historical', label: 'Heritage', icon: History, color: '#C75B39' },
  { id: 'religious', label: 'Spiritual', icon: Heart, color: '#D4637A' },
  { id: 'nature', label: 'Nature', icon: TreePine, color: '#40C9B0' },
  { id: 'adventure', label: 'Adventure', icon: Mountain, color: '#E8842A' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#7B4F91' },
  { id: 'nightlife', label: 'Nightlife', icon: Moon, color: '#1A1028' },
  { id: 'food', label: 'Food Tours', icon: UtensilsCrossed, color: '#B5453A' },
  { id: 'photography', label: 'Photography', icon: Camera, color: '#3D2B1F' },
  { id: 'wellness', label: 'Wellness', icon: Dumbbell, color: '#2BA998' },
  { id: 'culture', label: 'Culture', icon: Music, color: '#FFB347' },
  { id: 'wildlife', label: 'Wildlife', icon: Dog, color: '#8B6D47' },
];

const TRAVEL_STYLES = [
  { id: 'explorer', label: 'Explorer', emoji: '🧭', desc: 'Must-see attractions & hidden gems' },
  { id: 'relaxed', label: 'Leisure', emoji: '🌴', desc: 'Take it easy, enjoy the vibes' },
  { id: 'adventure', label: 'Adventure', emoji: '🏔️', desc: 'Thrilling & off-beat experiences' },
  { id: 'cultural', label: 'Cultural', emoji: '🏛️', desc: 'Dive deep into local culture' },
];

const BUDGET_TYPES = [
  { id: 'budget', emoji: '🎒', label: 'Backpacker', desc: '₹500-1.5K/day', color: '#40C9B0' },
  { id: 'moderate', emoji: '💼', label: 'Comfortable', desc: '₹1.5K-4K/day', color: '#5BA4CF' },
  { id: 'luxury', emoji: '👑', label: 'Premium', desc: '₹4K+/day', color: '#FFB347' },
];

const ACCOMMODATION_TYPES = [
  { id: 'hostel', icon: Backpack, label: 'Hostel' },
  { id: 'hotel', icon: Hotel, label: 'Hotel' },
  { id: 'resort', icon: Palmtree, label: 'Resort' },
  { id: 'homestay', icon: Home, label: 'Homestay' },
  { id: 'airbnb', icon: Building, label: 'Airbnb' },
];

const PACE_OPTIONS = [
  { id: 'relaxed', icon: Coffee, label: 'Relaxed', desc: '2-3 spots/day' },
  { id: 'moderate', icon: Gauge, label: 'Moderate', desc: '3-4 spots/day' },
  { id: 'packed', icon: Zap, label: 'Packed', desc: '5+ spots/day' },
];

const COMPANION_TYPES = [
  { id: 'solo', emoji: '🧑', label: 'Solo' },
  { id: 'couple', emoji: '💑', label: 'Couple' },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family' },
  { id: 'friends', emoji: '👯', label: 'Friends' },
  { id: 'business', emoji: '💼', label: 'Business' },
];

const SPECIAL_REQUIREMENTS = [
  { id: 'wheelchair', icon: Accessibility, label: 'Wheelchair Access' },
  { id: 'childFriendly', icon: Baby, label: 'Child Friendly' },
  { id: 'petFriendly', icon: Dog, label: 'Pet Friendly' },
  { id: 'vegetarian', icon: UtensilsCrossed, label: 'Veg-Only Food' },
];

export const TripPlanningForm = ({ onClose }: TripPlanningFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: '2',
    budgetType: 'moderate',
    interests: [] as string[],
    travelStyle: 'explorer',
    accommodationType: 'hotel',
    pacePreference: 'moderate',
    specialRequirements: [] as string[],
    travelCompanion: 'couple',
  });

  const TOTAL_STEPS = 4;

  const tripDays = formData.startDate && formData.endDate
    ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleRequirementToggle = (req: string) => {
    setFormData(prev => ({
      ...prev,
      specialRequirements: prev.specialRequirements.includes(req)
        ? prev.specialRequirements.filter(r => r !== req)
        : [...prev.specialRequirements, req]
    }));
  };

  const canProceedStep1 = formData.source && formData.destination && formData.startDate && formData.endDate && tripDays > 0;
  const canProceedStep2 = formData.travelCompanion && formData.budgetType;
  const canProceedStep3 = formData.travelStyle && formData.pacePreference;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/trips/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: formData.source.trim(),
          destination: formData.destination.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          travelers: Number(formData.travelers),
          budgetType: formData.budgetType,
          interests: formData.interests,
          travelStyle: formData.travelStyle,
          accommodationType: formData.accommodationType,
          pacePreference: formData.pacePreference,
          specialRequirements: formData.specialRequirements,
          travelCompanion: formData.travelCompanion,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to plan trip');

      if (data.success && data.tripId) {
        onClose();
        setTimeout(() => {
          router.push(`/trips/${data.tripId}`);
        }, 100);
      } else {
        setError('Failed to create trip. Please try again.');
        setIsLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(61, 43, 31, 0.7)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #FDF6ED 0%, #F5E6D3 50%, #FDE4D5 100%)',
          border: '1px solid rgba(199, 91, 57, 0.15)',
        }}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Plan Your Trip
                </h2>
              </div>
            </div>
            <button onClick={onClose} disabled={isLoading}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ background: '#DFC9AD' }}>
              <X className="h-4 w-4" style={{ color: '#3D2B1F' }} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm font-medium" style={{ color: '#8B6D47' }}>Step {step} of {TOTAL_STEPS}</p>
            {tripDays > 0 && step === 1 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#C75B39', color: 'white' }}>
                {tripDays} day{tripDays > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background: i < step
                      ? 'linear-gradient(90deg, #C75B39, #E8842A)'
                      : '#DFC9AD',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(181, 69, 58, 0.1)', border: '1px solid rgba(181, 69, 58, 0.3)' }}>
              <p className="text-sm flex items-center gap-2" style={{ color: '#B5453A' }}>
                <span>⚠️</span><span>{error}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ═══════════ STEP 1: Where & When ═══════════ */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-5 w-5" style={{ color: '#C75B39' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#3D2B1F' }}>Where & When</h3>
                </div>

                {/* Source & Destination */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>From</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8B6D47' }} />
                      <input
                        type="text"
                        placeholder="e.g., Mumbai"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2"
                        style={{
                          background: 'white',
                          border: '2px solid #DFC9AD',
                          color: '#3D2B1F',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#C75B39' }} />
                      <input
                        type="text"
                        placeholder="e.g., Goa"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2"
                        style={{
                          background: 'white',
                          border: '2px solid #DFC9AD',
                          color: '#3D2B1F',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>
                      <Calendar className="inline h-4 w-4 mr-1" style={{ color: '#C75B39' }} />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2"
                      style={{ background: 'white', border: '2px solid #DFC9AD', color: '#3D2B1F' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>
                      <Calendar className="inline h-4 w-4 mr-1" style={{ color: '#C75B39' }} />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2"
                      style={{ background: 'white', border: '2px solid #DFC9AD', color: '#3D2B1F' }}
                    />
                  </div>
                </div>

                {/* Trip duration badge */}
                {tripDays > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(199, 91, 57, 0.08)', border: '1px solid rgba(199, 91, 57, 0.15)' }}>
                    <Compass className="h-4 w-4" style={{ color: '#C75B39' }} />
                    <span className="text-sm font-medium" style={{ color: '#3D2B1F' }}>
                      {tripDays} day{tripDays > 1 ? 's' : ''} of adventure awaits!
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01]"
                  style={{ background: canProceedStep1 ? 'linear-gradient(135deg, #C75B39, #E8842A)' : '#DFC9AD' }}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ═══════════ STEP 2: Who & Budget ═══════════ */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5" style={{ color: '#C75B39' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#3D2B1F' }}>Who & Budget</h3>
                </div>

                {/* Travel Companion */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#3D2B1F' }}>Who's traveling?</label>
                  <div className="grid grid-cols-5 gap-2">
                    {COMPANION_TYPES.map((type) => (
                      <button key={type.id} type="button"
                        onClick={() => setFormData({ ...formData, travelCompanion: type.id })}
                        className="p-3 rounded-xl transition-all duration-200 hover:scale-105"
                        style={{
                          background: formData.travelCompanion === type.id ? 'rgba(199, 91, 57, 0.12)' : 'white',
                          border: `2px solid ${formData.travelCompanion === type.id ? '#C75B39' : '#DFC9AD'}`,
                        }}>
                        <div className="text-center">
                          <div className="text-xl mb-0.5">{type.emoji}</div>
                          <div className="text-[10px] font-semibold" style={{ color: '#3D2B1F' }}>{type.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Travelers */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>
                    <Users className="inline h-4 w-4 mr-1" style={{ color: '#C75B39' }} />
                    Number of Travelers
                  </label>
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => setFormData({ ...formData, travelers: String(Math.max(1, Number(formData.travelers) - 1)) })}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition hover:scale-110"
                      style={{ background: '#DFC9AD', color: '#3D2B1F' }}>−</button>
                    <span className="text-2xl font-bold w-8 text-center" style={{ color: '#3D2B1F' }}>{formData.travelers}</span>
                    <button type="button"
                      onClick={() => setFormData({ ...formData, travelers: String(Math.min(20, Number(formData.travelers) + 1)) })}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition hover:scale-110"
                      style={{ background: '#DFC9AD', color: '#3D2B1F' }}>+</button>
                  </div>
                </div>

                {/* Budget Type */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#3D2B1F' }}>Budget per person</label>
                  <div className="grid grid-cols-3 gap-3">
                    {BUDGET_TYPES.map((type) => (
                      <button key={type.id} type="button"
                        onClick={() => setFormData({ ...formData, budgetType: type.id })}
                        className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.03]"
                        style={{
                          background: formData.budgetType === type.id ? `${type.color}15` : 'white',
                          border: `2px solid ${formData.budgetType === type.id ? type.color : '#DFC9AD'}`,
                        }}>
                        <div className="text-center">
                          <div className="text-2xl mb-1">{type.emoji}</div>
                          <div className="font-bold text-sm" style={{ color: '#3D2B1F' }}>{type.label}</div>
                          <div className="text-[10px] mt-0.5 font-medium" style={{ color: '#8B6D47' }}>{type.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accommodation */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#3D2B1F' }}>Where would you like to stay?</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ACCOMMODATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button key={type.id} type="button"
                          onClick={() => setFormData({ ...formData, accommodationType: type.id })}
                          className="p-3 rounded-xl transition-all duration-200 hover:scale-105"
                          style={{
                            background: formData.accommodationType === type.id ? 'rgba(199, 91, 57, 0.12)' : 'white',
                            border: `2px solid ${formData.accommodationType === type.id ? '#C75B39' : '#DFC9AD'}`,
                          }}>
                          <div className="text-center">
                            <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: formData.accommodationType === type.id ? '#C75B39' : '#8B6D47' }} />
                            <div className="text-[10px] font-semibold" style={{ color: '#3D2B1F' }}>{type.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition hover:scale-[1.01]"
                    style={{ border: '2px solid #C75B39', color: '#C75B39', background: 'transparent' }}>
                    Back
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 hover:shadow-lg hover:scale-[1.01]"
                    style={{ background: canProceedStep2 ? 'linear-gradient(135deg, #C75B39, #E8842A)' : '#DFC9AD' }}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 3: Travel Style ═══════════ */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="h-5 w-5" style={{ color: '#C75B39' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#3D2B1F' }}>Your Travel Style</h3>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#3D2B1F' }}>How do you travel?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TRAVEL_STYLES.map((style) => (
                      <button key={style.id} type="button"
                        onClick={() => setFormData({ ...formData, travelStyle: style.id })}
                        className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          background: formData.travelStyle === style.id ? 'rgba(199, 91, 57, 0.1)' : 'white',
                          border: `2px solid ${formData.travelStyle === style.id ? '#C75B39' : '#DFC9AD'}`,
                        }}>
                        <div className="text-2xl mb-1">{style.emoji}</div>
                        <div className="font-bold text-sm" style={{ color: '#3D2B1F' }}>{style.label}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#8B6D47' }}>{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#3D2B1F' }}>Trip pace preference</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PACE_OPTIONS.map((pace) => {
                      const Icon = pace.icon;
                      return (
                        <button key={pace.id} type="button"
                          onClick={() => setFormData({ ...formData, pacePreference: pace.id })}
                          className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.03]"
                          style={{
                            background: formData.pacePreference === pace.id ? 'rgba(199, 91, 57, 0.1)' : 'white',
                            border: `2px solid ${formData.pacePreference === pace.id ? '#C75B39' : '#DFC9AD'}`,
                          }}>
                          <div className="text-center">
                            <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: formData.pacePreference === pace.id ? '#C75B39' : '#8B6D47' }} />
                            <div className="font-bold text-sm" style={{ color: '#3D2B1F' }}>{pace.label}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: '#8B6D47' }}>{pace.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#3D2B1F' }}>Special requirements (optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIAL_REQUIREMENTS.map((req) => {
                      const Icon = req.icon;
                      return (
                        <button key={req.id} type="button"
                          onClick={() => handleRequirementToggle(req.id)}
                          className="p-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                          style={{
                            background: formData.specialRequirements.includes(req.id) ? 'rgba(199, 91, 57, 0.1)' : 'white',
                            border: `2px solid ${formData.specialRequirements.includes(req.id) ? '#C75B39' : '#DFC9AD'}`,
                          }}>
                          <Icon className="h-4 w-4" style={{ color: formData.specialRequirements.includes(req.id) ? '#C75B39' : '#8B6D47' }} />
                          <span className="text-xs font-semibold" style={{ color: '#3D2B1F' }}>{req.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition hover:scale-[1.01]"
                    style={{ border: '2px solid #C75B39', color: '#C75B39', background: 'transparent' }}>
                    Back
                  </button>
                  <button type="button" onClick={() => setStep(4)}
                    disabled={!canProceedStep3}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 hover:shadow-lg hover:scale-[1.01]"
                    style={{ background: canProceedStep3 ? 'linear-gradient(135deg, #C75B39, #E8842A)' : '#DFC9AD' }}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 4: Interests & Submit ═══════════ */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5" style={{ color: '#C75B39' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#3D2B1F' }}>What excites you?</h3>
                </div>

                {/* Interests Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INTEREST_OPTIONS.map((interest) => {
                    const Icon = interest.icon;
                    const selected = formData.interests.includes(interest.id);
                    return (
                      <button key={interest.id} type="button"
                        onClick={() => handleInterestToggle(interest.id)}
                        className="p-3 rounded-xl transition-all duration-200 hover:scale-[1.05]"
                        style={{
                          background: selected ? `${interest.color}18` : 'white',
                          border: `2px solid ${selected ? interest.color : '#DFC9AD'}`,
                        }}>
                        <div className="text-center">
                          <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: selected ? interest.color : '#8B6D47' }} />
                          <div className="text-[10px] font-bold" style={{ color: '#3D2B1F' }}>{interest.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* AI Info Banner */}
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(199, 91, 57, 0.08), rgba(232, 132, 42, 0.08))', border: '1px solid rgba(199, 91, 57, 0.15)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: '#3D2B1F' }}>AI-Powered Trip Planning</h4>
                      <p className="text-xs leading-relaxed" style={{ color: '#8B6D47' }}>
                        Our AI will create a personalized day-by-day itinerary with local recommendations, travel tips, hidden gems, and an interactive map of your journey.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Summary Preview */}
                <div className="rounded-xl p-4" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
                  <h4 className="font-bold text-sm mb-2" style={{ color: '#3D2B1F' }}>Your Trip Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" style={{ color: '#C75B39' }} /><span style={{ color: '#8B6D47' }}>{formData.source} → {formData.destination}</span></div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" style={{ color: '#C75B39' }} /><span style={{ color: '#8B6D47' }}>{tripDays} day{tripDays > 1 ? 's' : ''}</span></div>
                    <div className="flex items-center gap-1.5"><Users className="h-3 w-3" style={{ color: '#C75B39' }} /><span style={{ color: '#8B6D47' }}>{formData.travelers} traveler{Number(formData.travelers) > 1 ? 's' : ''} ({formData.travelCompanion})</span></div>
                    <div className="flex items-center gap-1.5"><Compass className="h-3 w-3" style={{ color: '#C75B39' }} /><span style={{ color: '#8B6D47' }}>{formData.travelStyle} · {formData.pacePreference}</span></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition hover:scale-[1.01]"
                    style={{ border: '2px solid #C75B39', color: '#C75B39', background: 'transparent' }}
                    disabled={isLoading}>
                    Back
                  </button>
                  <button type="submit"
                    className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 hover:shadow-lg hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}
                    disabled={isLoading}>
                    {isLoading ? (
                      <><Loader className="animate-spin h-4 w-4" /> AI is planning...</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Plan My Trip</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};