'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, DollarSign, Sparkles, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface TripPlanningFormProps {
  onClose: () => void;
}

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
    budget: '',
    travelers: '1',
    budgetType: 'moderate',
    interests: [] as string[],
  });

  const interestOptions = [
    'Beach', 'Historical', 'Religious', 'Nature', 'Adventure',
    'Shopping', 'Nightlife', 'Food', 'Photography', 'Wellness'
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
  
    try {
      console.log('Submitting trip data:', formData);
  
      const response = await fetch('/api/trips/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: formData.source.trim(),
          destination: formData.destination.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: Number(formData.budget),
          travelers: Number(formData.travelers),
          budgetType: formData.budgetType,
          interests: formData.interests,
        }),
      });
  
      const data = await response.json();
      console.log('Response:', data);
  
      if (!response.ok) {
        setError(data.error || 'Failed to plan trip');
        setIsLoading(false);
        return;
      }
  
      if (data.success && data.trip?.id) {
        console.log('Trip created successfully, redirecting to:', `/trips/${data.trip.id}`);
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          router.push(`/trips/${data.trip.id}`);
        }, 500);
      } else {
        setError('Failed to create trip. Please try again.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Error planning trip:', error);
      setError(error.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Plan Your Trip
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Step {step} of 3
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 mx-1 rounded-full ${
                    s <= step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="From"
                    placeholder="Pune"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    icon={<MapPin className="h-5 w-5" />}
                    required
                  />
                  <Input
                    label="To"
                    placeholder="Goa"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    icon={<MapPin className="h-5 w-5" />}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    type="date"
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    icon={<Calendar className="h-5 w-5" />}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    icon={<Calendar className="h-5 w-5" />}
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="primary"
                  className="w-full"
                  disabled={!formData.source || !formData.destination || !formData.startDate || !formData.endDate}
                >
                  Next Step
                </Button>
              </div>
            )}

            {/* Step 2: Budget & Travelers */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Budget (₹)"
                    placeholder="50000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    icon={<DollarSign className="h-5 w-5" />}
                    required
                    min="1000"
                  />
                  <Input
                    type="number"
                    label="Number of Travelers"
                    value={formData.travelers}
                    onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                    icon={<Users className="h-5 w-5" />}
                    required
                    min="1"
                    max="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Budget Type
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['budget', 'moderate', 'luxury'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, budgetType: type })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.budgetType === type
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">
                            {type === 'budget' ? '💰' : type === 'moderate' ? '💵' : '💎'}
                          </div>
                          <div className="font-semibold capitalize">{type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    variant="primary"
                    className="flex-1"
                    disabled={!formData.budget || !formData.travelers}
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    What interests you? (Optional)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.interests.includes(interest)
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        AI-Powered Recommendations
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        We'll analyze transport options, tourist spots, and create the perfect itinerary based on your preferences and budget.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin mr-2 h-5 w-5" />
                        Planning...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Plan My Trip
                      </>
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