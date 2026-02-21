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
  MapPin,
  Star,
  CheckCircle,
  Leaf,
  IndianRupee,
  Calendar,
  Users,
  Navigation,
  Sparkles,
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
    if (params.id) fetchTripDetails();
  }, [params.id]);

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`);
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to load trip'); setIsLoading(false); return; }
      setTripData(data.trip);
    } catch {
      setError('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransportIcon = (mode: string) => {
    const cls = 'h-5 w-5 text-white';
    switch (mode) {
      case 'flight': return <Plane className={cls} />;
      case 'train': return <Train className={cls} />;
      case 'bus': return <Bus className={cls} />;
      case 'car': return <Car className={cls} />;
      default: return <Navigation className={cls} />;
    }
  };

  const modeGradient = (mode: string) => {
    switch (mode) {
      case 'flight': return 'from-rs-sky-blue to-rs-sky-blue-light';
      case 'train': return 'from-rs-terracotta to-rs-sunset-orange';
      case 'bus': return 'from-rs-neon-teal to-emerald-400';
      case 'car': return 'from-rs-sunset-purple to-rs-sunset-pink';
      default: return 'from-rs-desert-brown to-rs-terracotta-light';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rs-sand-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rs-terracotta mx-auto mb-4" />
          <p className="text-rs-desert-brown">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rs-sand-light">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-rs-sand flex items-center justify-center mx-auto mb-4">
            <Navigation className="h-8 w-8 text-rs-terracotta" />
          </div>
          <h2 className="text-2xl font-bold text-rs-deep-brown mb-2">{error || 'Trip not found'}</h2>
          <p className="text-rs-desert-brown mb-6">We couldn't find the trip you're looking for.</p>
          <Button onClick={() => router.push('/dashboard')} variant="primary" className="bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rs-sand-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')} className="flex items-center text-rs-terracotta hover:text-rs-terracotta-dark mb-4 transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-rs-deep-brown mb-2">
                {tripData.source} → {tripData.destination}
              </h1>
              <div className="flex items-center gap-4 text-rs-desert-brown text-sm">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {tripData.duration || '–'} days</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {tripData.travelers} traveler{tripData.travelers > 1 ? 's' : ''}</span>
              </div>
            </div>
            {tripData?.costs?.total > 0 && (
              <div className="bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange rounded-xl px-6 py-3 text-white">
                <p className="text-white/80 text-xs font-medium">Total Estimated Cost</p>
                <p className="text-2xl font-bold">₹{tripData.costs.total.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        {tripData?.costs && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-rs-deep-brown mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-rs-terracotta" /> Cost Breakdown
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['transport', 'accommodation', 'food', 'attractions'] as const).map(key => (
                  <div key={key} className="bg-rs-sand/50 rounded-xl p-4">
                    <p className="text-xs text-rs-desert-brown capitalize mb-1">{key}</p>
                    <p className="text-xl font-bold text-rs-deep-brown">₹{(tripData.costs[key] || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Transport Options */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-bold text-rs-deep-brown mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-rs-terracotta" /> Transport Options
            </h2>

            {tripData.transportOptions?.recommended?.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-4 w-4 text-rs-neon-teal" />
                  <span className="text-sm font-semibold text-rs-deep-brown">Recommended</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {tripData.transportOptions.recommended.map((option: any, i: number) => (
                    <div key={i} className="border-2 border-rs-sand-dark rounded-xl p-5 hover:border-rs-terracotta transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${modeGradient(option.mode)}`}>
                            {getTransportIcon(option.mode)}
                          </div>
                          <div>
                            <h4 className="font-bold text-rs-deep-brown capitalize">{option.mode}</h4>
                            <p className="text-xs text-rs-desert-brown">{option.provider}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-rs-deep-brown">₹{option.price?.toLocaleString()}</p>
                          <p className="text-[10px] text-rs-desert-brown">per person</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-rs-desert-brown mb-3">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {option.duration}h</span>
                        {option.carbonFootprint && <span className="flex items-center gap-1"><Leaf className="h-3.5 w-3.5 text-rs-neon-teal" /> {option.carbonFootprint}kg CO₂</span>}
                      </div>
                      {option.departureTime && (
                        <p className="text-xs text-rs-desert-brown mb-3">🕐 {option.departureTime} → {option.arrivalTime}</p>
                      )}
                      {option.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {option.amenities.map((a: string, j: number) => (
                            <span key={j} className="px-2 py-0.5 bg-rs-sand text-rs-deep-brown text-[10px] rounded-full font-medium">{a}</span>
                          ))}
                        </div>
                      )}
                      <Button variant="primary" className="w-full bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange text-sm">
                        Select This Option
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-rs-sand/50 rounded-xl p-8 text-center">
                <Navigation className="h-8 w-8 text-rs-desert-brown mx-auto mb-2" />
                <p className="text-rs-desert-brown">No transport options available for this route.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Tourist Spots */}
        {tripData.touristSpots?.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-rs-deep-brown mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rs-sunset-pink" /> Top Spots in {tripData.destination}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tripData.touristSpots.map((spot: any, i: number) => (
                  <div key={i} className="border border-rs-sand-dark rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-rs-deep-brown">{spot.name}</h3>
                      <div className="flex items-center gap-0.5 bg-rs-neon-amber/20 px-1.5 py-0.5 rounded-full">
                        <Star className="h-3 w-3 text-rs-neon-amber fill-rs-neon-amber" />
                        <span className="text-xs font-semibold text-rs-deep-brown">{spot.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-rs-desert-brown mb-3 line-clamp-2">{spot.description}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-rs-desert-brown">Category</span><span className="font-medium text-rs-deep-brown">{spot.category}</span></div>
                      <div className="flex justify-between"><span className="text-rs-desert-brown">Time</span><span className="font-medium text-rs-deep-brown">{spot.estimatedTime}h</span></div>
                      <div className="flex justify-between"><span className="text-rs-desert-brown">Entry</span><span className="font-medium text-rs-deep-brown">{spot.entryFee === 0 ? 'Free' : `₹${spot.entryFee}`}</span></div>
                      <div className="flex justify-between"><span className="text-rs-desert-brown">Best time</span><span className="font-medium text-rs-deep-brown">{spot.bestTimeToVisit}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Itinerary */}
        {tripData.itinerary?.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-rs-deep-brown mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rs-sunset-orange" /> {tripData.duration}-Day Itinerary
              </h2>
              <div className="space-y-6">
                {tripData.itinerary.map((day: any[], i: number) => (
                  <div key={i} className="border-l-4 border-rs-terracotta pl-5">
                    <h3 className="text-base font-bold text-rs-deep-brown mb-3">Day {i + 1}</h3>
                    <div className="space-y-2.5">
                      {day.map((spot: any, j: number) => (
                        <div key={j} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-rs-terracotta to-rs-sunset-orange text-white rounded-full flex items-center justify-center text-xs font-bold">{j + 1}</div>
                          <div>
                            <p className="font-semibold text-rs-deep-brown text-sm">{spot.name}</p>
                            <p className="text-xs text-rs-desert-brown">{spot.estimatedTime}h · {spot.category} · {spot.entryFee === 0 ? 'Free' : `₹${spot.entryFee}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="primary" className="flex-1 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange">
            <CheckCircle className="mr-2 h-4 w-4" /> Confirm & Save Trip
          </Button>
          <Button variant="outline" className="flex-1 border-rs-terracotta text-rs-terracotta hover:bg-rs-terracotta/10" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}