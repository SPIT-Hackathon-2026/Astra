'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, IndianRupee, Sparkles, Loader, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface TripPlanningFormProps {
  onClose: () => void;
  initialData?: any;
}

export const TripPlanningForm = ({ onClose, initialData }: TripPlanningFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState(1); // Always start at Step 1 to let user review auto-filled data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    source: initialData?.source || '',
    destination: initialData?.destination || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    budget: initialData?.budget || '',
    travelers: initialData?.travelers || '1',
    tripType: initialData?.tripType || 'solo',
    budgetType: initialData?.budgetType || 'moderate',
    interests: initialData?.interests || [] as string[],
    travelerContacts: initialData?.travelerContacts || [] as string[],
  });

  const interestOptions = [
    'Beach', 'Historical', 'Religious', 'Nature', 'Adventure',
    'Shopping', 'Nightlife', 'Food', 'Photography', 'Wellness'
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

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
          budget: Number(formData.budget),
          travelers: Number(formData.travelers),
          tripType: formData.tripType,
          travelerContacts: formData.travelerContacts,
          budgetType: formData.budgetType,
          interests: formData.interests,
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
    <div className="fixed inset-0 bg-rs-deep-brown/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-rs-sand-light">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange bg-clip-text text-transparent">
                Plan Your Trip
              </h2>
              <p className="text-rs-desert-brown text-sm mt-1">Step {step} of 3</p>
            </div>
            <button onClick={onClose} disabled={isLoading}
              className="w-8 h-8 rounded-full bg-rs-sand hover:bg-rs-sand-dark flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-rs-deep-brown" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 mx-1 rounded-full RS{
                    s <= step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-rs-dusty-red/10 border border-rs-dusty-red/30 rounded-xl">
              <p className="text-rs-dusty-red text-sm flex items-center gap-2">
                <span>⚠️</span><span>{error}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="From" placeholder="Mumbai" value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    icon={<MapPin className="h-5 w-5" />} required />
                  <Input label="To" placeholder="Goa" value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    icon={<MapPin className="h-5 w-5" />} required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input type="date" label="Start Date" value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    icon={<Calendar className="h-5 w-5" />} required min={new Date().toISOString().split('T')[0]} />
                  <Input type="date" label="End Date" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    icon={<Calendar className="h-5 w-5" />} required min={formData.startDate || new Date().toISOString().split('T')[0]} />
                </div>
                <Button type="button" onClick={() => setStep(2)} variant="primary"
                  className="w-full bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange"
                  disabled={!formData.source || !formData.destination || !formData.startDate || !formData.endDate}>
                  Next Step
                </Button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input type="number" label="Budget (₹)" placeholder="50000" value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    icon={<IndianRupee className="h-5 w-5" />} required min="1000" />
                  <Input type="number" label="Number of Travelers" value={formData.travelers}
                    onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                    icon={<Users className="h-5 w-5" />} required min="1" max="20" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-rs-deep-brown mb-3">Trip Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'solo', emoji: '🧘', label: 'Solo' },
                      { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family' },
                      { id: 'group', emoji: '🎉', label: 'Group' },
                    ].map((type) => (
                      <button key={type.id} type="button" onClick={() => setFormData({ ...formData, tripType: type.id })}
                        className={`p-3 rounded-xl border-2 transition-all ${formData.tripType === type.id
                          ? 'border-rs-sunset-orange bg-rs-sunset-orange/10'
                          : 'border-rs-sand-dark hover:border-rs-sunset-orange/30'
                          }`}>
                        <div className="text-center">
                          <div className="text-xl mb-0.5">{type.emoji}</div>
                          <div className="font-bold text-rs-deep-brown text-xs">{type.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Traveler Contacts Review */}
                {formData.travelerContacts.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-rs-deep-brown mb-2">Group Contacts (Auto-Filled)</label>
                    <div className="space-y-2">
                      {formData.travelerContacts.map((contact: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            placeholder="Mobile Number"
                            value={contact}
                            onChange={(e) => {
                              const newContacts = [...formData.travelerContacts];
                              newContacts[idx] = e.target.value;
                              setFormData({ ...formData, travelerContacts: newContacts });
                            }}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-rs-deep-brown mb-3">Budget Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'budget', emoji: '💰', label: 'Budget' },
                      { id: 'moderate', emoji: '💵', label: 'Moderate' },
                      { id: 'luxury', emoji: '💎', label: 'Luxury' },
                    ].map((type) => (
                      <button key={type.id} type="button" onClick={() => setFormData({ ...formData, budgetType: type.id })}
                        className={`p-4 rounded-xl border-2 transition-all ${formData.budgetType === type.id
                          ? 'border-rs-terracotta bg-rs-terracotta/10'
                          : 'border-rs-sand-dark hover:border-rs-terracotta-light'
                          }`}>
                        <div className="text-center">
                          <div className="text-2xl mb-1">{type.emoji}</div>
                          <div className="font-semibold text-rs-deep-brown text-sm">{type.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1 border-rs-terracotta text-rs-terracotta">Back</Button>
                  <Button type="button" onClick={() => setStep(3)} variant="primary"
                    className="flex-1 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange"
                    disabled={!formData.budget || !formData.travelers}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-rs-deep-brown mb-3">What interests you? (Optional)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {interestOptions.map((interest) => {
                      const isSelected = formData.interests.some((i: string) => i.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(i.toLowerCase()));
                      return (
                        <button key={interest} type="button" onClick={() => handleInterestToggle(interest)}
                          className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${isSelected
                            ? 'border-rs-sunset-orange bg-rs-sunset-orange/10 text-rs-terracotta-dark'
                            : 'border-rs-sand-dark text-rs-desert-brown hover:border-rs-sunset-orange'
                            }`}>
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-rs-terracotta/10 to-rs-sunset-orange/10 p-5 rounded-xl border border-rs-terracotta/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-rs-terracotta flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-rs-deep-brown mb-1 text-sm">AI-Powered Planning</h4>
                      <p className="text-xs text-rs-desert-brown">We'll find the best transport, tourist spots, and create a perfect itinerary for your trip.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(2)} variant="outline"
                    className="flex-1 border-rs-terracotta text-rs-terracotta" disabled={isLoading}>Back</Button>
                  <Button type="submit" variant="primary"
                    className="flex-1 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange"
                    disabled={isLoading}>
                    {isLoading ? (
                      <><Loader className="animate-spin mr-2 h-4 w-4" /> Planning...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Plan My Trip</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
};