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
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);

  useEffect(() => {
    if (params.id) fetchTripDetails();
  }, [params.id]);

   const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`);
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to load trip'); setIsLoading(false); return; }
      setTripData(data.trip);
      if (data.trip.selectedTransport) setSelectedTransport(data.trip.selectedTransport);
      if (data.trip.selectedTouristSpots) setSelectedSpots(data.trip.selectedTouristSpots);
    } catch {
      setError('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTransport = (option: any) => {
    setSelectedTransport(option);
    // In a real app, you'd call an API to save this to the trip record
    setTripData((prev: any) => ({
      ...prev,
      costs: {
        ...prev.costs,
        transport: option.price,
        total: (prev.costs.accommodation || 0) + (prev.costs.food || 0) + (prev.costs.attractions || 0) + option.price
      }
    }));
  };

  const handleSelectSpot = (spot: any) => {
    setSelectedSpots(prev => {
      const isSelected = prev.includes(spot.name);
      const next = isSelected ? prev.filter(name => name !== spot.name) : [...prev, spot.name];

      // Update attractions cost
      const spotCost = spot.entryFee || 0;
      setTripData((old: any) => {
        const newAttractionsCost = isSelected
          ? (old.costs.attractions - spotCost)
          : (old.costs.attractions + spotCost);

        return {
          ...old,
          costs: {
            ...old.costs,
            attractions: newAttractionsCost,
            total: (old.costs.transport || 0) + (old.costs.accommodation || 0) + (old.costs.food || 0) + newAttractionsCost
          }
        };
      });

      return next;
    });
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

  const days = Math.ceil(
    (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

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

            {tripData.transportOptions && tripData.transportOptions.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-4 w-4 text-rs-neon-teal" />
                  <span className="text-sm font-semibold text-rs-deep-brown">Recommended Options</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {tripData.transportOptions
                    .filter((opt: any) => opt.isRecommended)
                    .map((option: any, i: number) => {
                      const isSelected = selectedTransport?.provider === option.provider && selectedTransport?.mode === option.mode;
                      return (
                        <div key={i} className={`border-2 rounded-xl p-5 transition-all cursor-pointer ${isSelected ? 'border-rs-terracotta bg-rs-terracotta/5 shadow-md ring-1 ring-rs-terracotta' : 'border-rs-sand-dark hover:border-rs-terracotta/50'
                          }`} onClick={() => handleSelectTransport(option)}>
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
                          {option.recommendationReason && (
                            <p className="text-[10px] font-medium text-rs-terracotta-dark bg-rs-terracotta/5 px-2 py-1 rounded mb-3">
                              {option.recommendationReason}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-rs-desert-brown mb-3">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {option.duration}h</span>
                            {option.carbonFootprint && <span className="flex items-center gap-1"><Leaf className="h-3.5 w-3.5 text-rs-neon-teal" /> {option.carbonFootprint}kg CO₂</span>}
                          </div>
                          <Button
                            variant={isSelected ? "primary" : "outline"}
                            className={`w-full text-sm ${isSelected ? 'bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange' : 'border-rs-terracotta text-rs-terracotta'}`}
                          >
                            {isSelected ? 'Selected' : 'Select This Option'}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                {tripData.transportOptions.some((opt: any) => !opt.isRecommended) && (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-rs-desert-brown mb-4">Other Options</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tripData.transportOptions
                        .filter((opt: any) => !opt.isRecommended)
                        .map((option: any, i: number) => {
                          const isSelected = selectedTransport?.provider === option.provider && selectedTransport?.mode === option.mode;
                          return (
                            <div key={i} className={`border rounded-xl p-4 transition-all cursor-pointer ${isSelected ? 'border-rs-terracotta bg-rs-terracotta/5 ring-1 ring-rs-terracotta' : 'border-rs-sand-dark hover:border-rs-terracotta/50 bg-white/50'
                              }`} onClick={() => handleSelectTransport(option)}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${modeGradient(option.mode)}`}>
                                    {getTransportIcon(option.mode)}
                                  </div>
                                  <div className="font-bold text-rs-deep-brown text-sm">{option.mode}</div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-rs-deep-brown">₹{option.price}</p>
                                </div>
                              </div>
                              <p className="text-[10px] text-rs-desert-brown mb-2">{option.provider}</p>
                              <div className="flex items-center justify-between text-[10px] text-rs-desert-brown">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {option.duration}h</span>
                                <button className={`font-semibold ${isSelected ? 'text-rs-deep-brown' : 'text-rs-terracotta'}`}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
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
        {(tripData.allTouristSpots || tripData.touristSpots)?.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-rs-deep-brown flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-rs-sunset-pink" />
                  Popular Spots in {tripData.destination}
                </h2>
                <span className="text-xs text-rs-desert-brown font-medium bg-rs-sand px-3 py-1 rounded-full border border-rs-sand-dark">
                  Sorted by Popularity
                </span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...(tripData.allTouristSpots || tripData.touristSpots || [])]
                  .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                  .map((spot: any, i: number) => {
                    const isSelected = selectedSpots.includes(spot.name);
                    const isHot = spot.popularity >= 80;
                    return (
                      <div key={i} className={`group relative border rounded-xl p-4 transition-all cursor-pointer ${isSelected ? 'border-rs-terracotta bg-rs-terracotta/5 ring-1 ring-rs-terracotta' : 'border-rs-sand-dark bg-white hover:border-rs-terracotta/50 hover:shadow-md'
                        }`} onClick={() => handleSelectSpot(spot)}>

                        {isHot && (
                          <div className="absolute -top-2 -right-2 bg-rs-sunset-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> HOT SPOT
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-rs-deep-brown group-hover:text-rs-terracotta transition-colors">{spot.name}</h3>
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle className="h-4 w-4 text-rs-terracotta" />}
                            <div className="flex items-center gap-0.5 bg-rs-neon-amber/20 px-1.5 py-0.5 rounded-full">
                              <Star className="h-3 w-3 text-rs-neon-amber fill-rs-neon-amber" />
                              <span className="text-xs font-semibold text-rs-deep-brown">{spot.rating}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-rs-desert-brown mb-3 line-clamp-2">{spot.description}</p>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] mt-auto">
                          <div className="flex flex-col">
                            <span className="text-rs-desert-brown uppercase tracking-wider text-[8px] font-bold">Category</span>
                            <span className="font-medium text-rs-deep-brown">{spot.category}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-rs-desert-brown uppercase tracking-wider text-[8px] font-bold">Popularity</span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-rs-sand-dark rounded-full overflow-hidden">
                                <div className="h-full bg-rs-terracotta rounded-full" style={{ width: `${spot.popularity || 50}%` }} />
                              </div>
                              <span className="font-bold text-rs-deep-brown">{Math.round(spot.popularity || 50)}%</span>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-rs-desert-brown uppercase tracking-wider text-[8px] font-bold">Visit Time</span>
                            <span className="font-medium text-rs-deep-brown">{spot.estimatedTime} hours</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-rs-desert-brown uppercase tracking-wider text-[8px] font-bold">Entry Fee</span>
                            <span className="font-medium text-rs-deep-brown">{spot.entryFee === 0 ? 'Free Entry' : `₹${spot.entryFee}`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
        )}

        {/* Journey Plan (Dynamic) */}
        {(selectedTransport || selectedSpots.length > 0) && (
          <Card className="mb-6 bg-white border-2 border-rs-terracotta/30">
            <div className="p-6">
              <h2 className="text-xl font-bold text-rs-deep-brown mb-6 flex items-center gap-2">
                <Navigation className="h-6 w-6 text-rs-terracotta" /> Your Journey Plan
              </h2>

              <div className="space-y-6">
                {/* Selected Transport */}
                {selectedTransport && (
                  <div className="flex items-center gap-4 p-4 bg-rs-sand/30 rounded-xl border border-rs-sand-dark">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${modeGradient(selectedTransport.mode)}`}>
                      {getTransportIcon(selectedTransport.mode)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-rs-terracotta uppercase">Transportation</p>
                      <h4 className="font-bold text-rs-deep-brown">{selectedTransport.provider}</h4>
                      <p className="text-xs text-rs-desert-brown">{selectedTransport.duration}h travel time</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rs-deep-brown">₹{selectedTransport.price?.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Selected Spots as Timeline */}
                {selectedSpots.length > 0 && (
                  <div className="space-y-0 relative pl-4 border-l-2 border-rs-terracotta/20 ml-4">
                    {selectedSpots.map((name, i) => {
                      const spot = (tripData.allTouristSpots || tripData.touristSpots || []).find((s: any) => s.name === name);
                      return (
                        <div key={i} className="relative pb-6 last:pb-0">
                          <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-rs-terracotta border-4 border-white shadow-sm" />
                          <div className="bg-white p-3 rounded-lg border border-rs-sand-dark ml-2">
                            <h4 className="font-bold text-rs-deep-brown text-sm">{name}</h4>
                            <p className="text-[10px] text-rs-desert-brown">{spot?.category} · {spot?.estimatedTime}h visit</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-rs-sand-dark flex justify-between items-center">
                <div>
                  <p className="text-xs text-rs-desert-brown">Plan Summary</p>
                  <p className="text-sm font-bold text-rs-deep-brown">
                    {selectedTransport ? '1 Transport' : 'No transport selected'} · {selectedSpots.length} Spots
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-rs-desert-brown">Updated Total</p>
                  <p className="text-2xl font-bold text-rs-terracotta">₹{tripData.costs.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Static Itinerary if available */}
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