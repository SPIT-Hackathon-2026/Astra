'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toaster } from 'react-hot-toast';
import {
  ArrowLeft, Calendar, Users, MapPin, Sparkles,
  Wallet, Plane, Hotel, Utensils, Landmark,
  Save, Loader, Compass, Globe, Download,
  ChevronDown, ChevronUp, Map as MapIcon,
} from 'lucide-react';
import TransportFilter from '../../../components/trip/TransportFilter';
import TransportSelection from '../../../components/trip/TransportSelection';
import TouristSpotSelection from '../../../components/trip/TouristSpotSelection';
import ItineraryDisplay from '../../../components/trip/ItineraryDisplay';
import AIItineraryDisplay from '../../../components/trip/AIItineraryDisplay';

// Dynamic import for map (SSR incompatible)
const TripMap = dynamic(() => import('../../../components/trip/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl h-[400px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDE4D5, #F5E6D3)', border: '2px solid #DFC9AD' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#DFC9AD', borderTopColor: '#C75B39' }} />
        <p className="text-sm font-medium" style={{ color: '#8B6D47' }}>Loading map...</p>
      </div>
    </div>
  ),
});

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredTransport, setFilteredTransport] = useState<any[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'classic' | 'transport' | 'spots'>('ai');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerateAI = async () => {
    if (!params.id) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/trips/${params.id}/regenerate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTripData((prev: any) => ({
          ...prev,
          aiItinerary: data.aiItinerary,
          aiTips: data.aiTips,
          aiSummary: data.aiSummary,
        }));
      } else {
        console.error('Regeneration failed:', data.error);
      }
    } catch (error) {
      console.error('Error regenerating AI itinerary:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const generateTripPDF = (trip: any, selectedSpots: any[], selectedTransport: any[]) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(199, 91, 57);
    doc.text('🌍 Trip Itinerary', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(61, 43, 31);
    doc.text(`${trip.source} → ${trip.destination}`, 105, 30, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let y = 45;
    doc.text(`📅 Dates: ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`, 20, y);
    doc.text(`👥 Travelers: ${trip.travelers}`, 20, y + 8);
    doc.text(`🎯 Style: ${trip.preferences?.travelStyle || 'N/A'} | Pace: ${trip.preferences?.pacePreference || 'N/A'}`, 20, y + 16);

    // AI Itinerary
    if (trip.aiItinerary?.length > 0) {
      y += 30;
      doc.setFontSize(14);
      doc.setTextColor(199, 91, 57);
      doc.text('📋 AI-Powered Itinerary', 20, y);

      trip.aiItinerary.forEach((day: any) => {
        y += 10;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(61, 43, 31);
        doc.text(`Day ${day.day}: ${day.theme}`, 20, y);

        const actData = day.activities.map((a: any, i: number) => [
          a.time, a.title, a.duration, a.cost ? `₹${a.cost}` : '-'
        ]);

        autoTable(doc, {
          startY: y + 4,
          head: [['Time', 'Activity', 'Duration', 'Cost']],
          body: actData,
          theme: 'grid',
          headStyles: { fillColor: [199, 91, 57] },
          styles: { fontSize: 9 },
          margin: { left: 22 },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
      });
    }

    // Cost Summary
    if (y > 250) { doc.addPage(); y = 20; }
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(199, 91, 57);
    doc.text('💰 Cost Summary', 20, y);

    const costs = trip.costs || {};
    autoTable(doc, {
      startY: y + 4,
      body: [
        ['Transport', `₹${costs.transport || 0}`],
        ['Accommodation', `₹${costs.accommodation || 0}`],
        ['Food', `₹${costs.food || 0}`],
        ['Attractions', `₹${costs.attractions || 0}`],
        ['TOTAL', `₹${costs.total || 0}`],
      ],
      theme: 'plain',
      styles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
    });

    doc.save(`trip-${trip.source}-to-${trip.destination}.pdf`);
  };

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/trips/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load trip');
        setIsLoading(false);
        return;
      }

      setTripData(data.trip);
      setFilteredTransport(data.trip.transportOptions || []);
      setSelectedSpots(data.trip.selectedTouristSpots || []);

      // If AI itinerary exists, default to AI tab
      if (data.trip.aiItinerary?.length > 0) {
        setActiveTab('ai');
      } else if (data.trip.itinerary?.length > 0) {
        setActiveTab('classic');
      }

      // Geocode source/destination if coords not stored (fallback for older trips)
      if (!data.trip.sourceCoords?.lat || !data.trip.destCoords?.lat) {
        try {
          const geocode = async (city: string) => {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`);
            const results = await res.json();
            if (results?.[0]) return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
            return null;
          };
          const [src, dst] = await Promise.all([
            !data.trip.sourceCoords?.lat ? geocode(data.trip.source) : Promise.resolve(null),
            !data.trip.destCoords?.lat ? geocode(data.trip.destination) : Promise.resolve(null),
          ]);
          setTripData((prev: any) => ({
            ...prev,
            sourceCoords: src || prev.sourceCoords,
            destCoords: dst || prev.destCoords,
          }));
        } catch (e) { /* ignore geocode failure */ }
      }
    } catch (error: any) {
      setError('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTripDetails();
    }
  }, [params.id]);

  const handleFilterChange = (filters: any) => {
    if (!tripData || !tripData.transportOptions) return;
    let filtered = [...tripData.transportOptions];
    if (filters.budget) filtered = filtered.filter(opt => opt.price * 2 * tripData.travelers <= filters.budget);
    if (filters.modes?.length > 0) filtered = filtered.filter(opt => filters.modes.includes(opt.mode));
    if (filters.maxDuration) filtered = filtered.filter(opt => opt.duration <= filters.maxDuration);
    if (filters.sortBy === 'price') filtered.sort((a, b) => a.price - b.price);
    else if (filters.sortBy === 'duration') filtered.sort((a, b) => a.duration - b.duration);
    setFilteredTransport(filtered);
  };

  const handleSelectTransport = async (option: any) => {
    try {
      const res = await fetch(`/api/trips/${params.id}/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transportOption: option }),
      });
      const data = await res.json();
      if (data.success) {
        setTripData({ ...tripData, selectedTransport: option, costs: data.costs });
      }
    } catch (error) {
      console.error('Error selecting transport:', error);
    }
  };

  const handleDeselectTransport = async () => {
    try {
      const res = await fetch(`/api/trips/${params.id}/transport`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTripData({ ...tripData, selectedTransport: null, costs: data.costs });
      }
    } catch (error) {
      console.error('Error deselecting transport:', error);
    }
  };

  const handleToggleSpot = async (spotName: string) => {
    const newSelected = selectedSpots.includes(spotName)
      ? selectedSpots.filter(s => s !== spotName)
      : [...selectedSpots, spotName];
    try {
      const res = await fetch(`/api/trips/${params.id}/spots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSpots: newSelected }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSpots(newSelected);
        setTripData({ ...tripData, selectedTouristSpots: newSelected, itinerary: data.itinerary, costs: data.costs });
      }
    } catch (error) {
      console.error('Error updating spots:', error);
    }
  };

  const handleSaveTrip = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/trips/${params.id}/save`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to save trip');
      const data = await response.json();

      generateTripPDF(
        data.trip || tripData,
        tripData.allTouristSpots?.filter((s: any) => selectedSpots.includes(s.name)) || [],
        tripData.selectedTransport ? [tripData.selectedTransport] : []
      );
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving trip:', error);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDF6ED, #F5E6D3, #FDE4D5)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full animate-spin mx-auto mb-4" style={{ border: '4px solid #DFC9AD', borderTopColor: '#C75B39' }} />
          <p className="font-semibold text-lg" style={{ color: '#3D2B1F' }}>Planning your trip...</p>
          <p className="text-sm mt-1" style={{ color: '#8B6D47' }}>AI is crafting the perfect itinerary</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FDF6ED, #F5E6D3)' }}>
        <div className="text-center max-w-md p-8 rounded-2xl shadow-xl" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#3D2B1F' }}>Trip Not Found</h2>
          <p className="mb-6" style={{ color: '#8B6D47' }}>{error || 'Unable to load trip details'}</p>
          <button onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const days = Math.ceil(
    (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  ) + 1;

  // Build map markers
  const mapMarkers = (tripData.allTouristSpots || [])
    .filter((s: any) => s.coordinates?.lat && s.coordinates?.lng)
    .map((s: any) => ({
      lat: s.coordinates.lat,
      lng: s.coordinates.lng,
      title: s.name,
      type: 'spot' as const,
      isSelected: selectedSpots.includes(s.name),
      description: `${s.category} • ⭐ ${s.rating}`,
    }));

  // Source/destination coords from DB (geocoded at plan time)
  const srcCoords = tripData.sourceCoords?.lat && tripData.sourceCoords?.lng
    ? { lat: tripData.sourceCoords.lat, lng: tripData.sourceCoords.lng }
    : null;
  const dstCoords = tripData.destCoords?.lat && tripData.destCoords?.lng
    ? { lat: tripData.destCoords.lat, lng: tripData.destCoords.lng }
    : null;

  const tabs = [
    { id: 'ai', label: 'AI Itinerary', icon: Sparkles, show: true },
    { id: 'spots', label: 'Tourist Spots', icon: MapPin, show: (tripData.allTouristSpots?.length || 0) > 0 },
    { id: 'transport', label: 'Transport', icon: Plane, show: (tripData.transportOptions?.length || 0) > 0 },
    { id: 'classic', label: 'Classic Plan', icon: Calendar, show: true },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen py-6" style={{ background: 'linear-gradient(135deg, #FDF6ED, #F5E6D3, #FDE4D5)' }}>
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push('/dashboard')}
            className="mb-4 flex items-center gap-2 font-medium transition-colors hover:opacity-80"
            style={{ color: '#C75B39' }}>
            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
          </button>

          <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#3D2B1F' }}>
                    {tripData.source} → {tripData.destination}
                  </h1>
                  {tripData.aiSummary && (
                    <p className="text-sm mt-0.5 max-w-xl" style={{ color: '#8B6D47' }}>{tripData.aiSummary}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generateTripPDF(tripData, tripData.allTouristSpots?.filter((s: any) => selectedSpots.includes(s.name)) || [], tripData.selectedTransport ? [tripData.selectedTransport] : [])}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:shadow-md"
                  style={{ background: '#FDF6ED', border: '2px solid #DFC9AD', color: '#3D2B1F' }}>
                  <Download className="h-4 w-4" /> PDF
                </button>
                <button
                  onClick={handleSaveTrip}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                  {saving ? (
                    <><Loader className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Trip</>
                  )}
                </button>
              </div>
            </div>

            {/* Trip Info Badges */}
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDF6ED', color: '#3D2B1F' }}>
                <Calendar className="h-3.5 w-3.5" style={{ color: '#C75B39' }} />
                {new Date(tripData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(tripData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDF6ED', color: '#3D2B1F' }}>
                <MapPin className="h-3.5 w-3.5" style={{ color: '#C75B39' }} /> {days} days
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDF6ED', color: '#3D2B1F' }}>
                <Users className="h-3.5 w-3.5" style={{ color: '#C75B39' }} /> {tripData.travelers} traveler{tripData.travelers > 1 ? 's' : ''}
              </div>
              {tripData.preferences?.travelStyle && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDF6ED', color: '#3D2B1F' }}>
                  <Compass className="h-3.5 w-3.5" style={{ color: '#C75B39' }} /> {tripData.preferences.travelStyle}
                </div>
              )}
              {tripData.preferences?.budgetType && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#FDF6ED', color: '#3D2B1F' }}>
                  <Wallet className="h-3.5 w-3.5" style={{ color: '#C75B39' }} /> {tripData.preferences.budgetType}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="mb-6">
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 mb-3 font-semibold text-sm transition-all"
            style={{ color: '#3D2B1F' }}>
            <MapIcon className="h-4 w-4" style={{ color: '#C75B39' }} />
            Trip Map
            {showMap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showMap && (
            <TripMap
              key={`map-${srcCoords?.lat || 'nosrc'}-${dstCoords?.lat || 'nodst'}-${mapMarkers.length}`}
              markers={mapMarkers}
              source={srcCoords ? { ...srcCoords, name: tripData.source } : undefined}
              destination={dstCoords ? { ...dstCoords, name: tripData.destination } : undefined}
              height="420px"
            />
          )}
        </div>

        {/* Cost Summary */}
        {tripData.costs && (
          <div className="rounded-2xl p-6 shadow-lg mb-6" style={{ background: 'white', border: '2px solid #DFC9AD' }}>
            <div className="flex items-center gap-2 mb-5">
              <Wallet className="h-5 w-5" style={{ color: '#C75B39' }} />
              <h2 className="text-xl font-bold" style={{ color: '#3D2B1F' }}>Cost Breakdown</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: Plane, label: 'Transport', value: tripData.costs.transport, color: '#5BA4CF', bg: 'rgba(91, 164, 207, 0.1)' },
                { icon: Hotel, label: 'Accommodation', value: tripData.costs.accommodation, color: '#7B4F91', bg: 'rgba(123, 79, 145, 0.1)' },
                { icon: Utensils, label: 'Food', value: tripData.costs.food, color: '#E8842A', bg: 'rgba(232, 132, 42, 0.1)' },
                { icon: Landmark, label: 'Attractions', value: tripData.costs.attractions, color: '#40C9B0', bg: 'rgba(64, 201, 176, 0.1)' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: bg }}>
                  <Icon className="h-5 w-5 mb-2" style={{ color }} />
                  <p className="text-xs mb-1" style={{ color: '#8B6D47' }}>{label}</p>
                  <p className="text-xl font-bold" style={{ color: '#3D2B1F' }}>₹{(value || 0).toLocaleString()}</p>
                </div>
              ))}
              <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                <Sparkles className="h-5 w-5 mb-2 text-white" />
                <p className="text-xs text-white/80 mb-1">TOTAL</p>
                <p className="text-2xl font-bold">₹{(tripData.costs.total || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200"
                style={{
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #C75B39, #E8842A)' : 'white',
                  color: activeTab === tab.id ? 'white' : '#3D2B1F',
                  border: `2px solid ${activeTab === tab.id ? 'transparent' : '#DFC9AD'}`,
                }}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'ai' && (
          <AIItineraryDisplay
            itinerary={tripData.aiItinerary || []}
            tips={tripData.aiTips || []}
            summary={tripData.aiSummary || ''}
            spots={tripData.allTouristSpots || []}
            tripId={params.id as string}
            destination={tripData.destination}
            onRegenerate={handleRegenerateAI}
            isRegenerating={isRegenerating}
          />
        )}

        {activeTab === 'spots' && tripData.allTouristSpots?.length > 0 && (
          <TouristSpotSelection
            spots={tripData.allTouristSpots}
            selectedSpots={selectedSpots}
            onToggleSpot={handleToggleSpot}
            maxDays={days}
          />
        )}

        {activeTab === 'transport' && tripData.transportOptions?.length > 0 && (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <TransportFilter onFilterChange={handleFilterChange} />
            </div>
            <div className="lg:col-span-3">
              <TransportSelection
                options={filteredTransport}
                selectedTransport={tripData.selectedTransport || null}
                onSelect={handleSelectTransport}
                onDeselect={handleDeselectTransport}
                travelers={tripData.travelers}
              />
            </div>
          </div>
        )}

        {activeTab === 'classic' && (
          tripData.itinerary?.length > 0 ? (
            <ItineraryDisplay
              itinerary={tripData.itinerary}
              onSaveTrip={handleSaveTrip}
              isSaving={saving}
            />
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'white', border: '2px dashed #DFC9AD' }}>
              <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#DFC9AD' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#3D2B1F' }}>No Classic Itinerary</h3>
              <p style={{ color: '#8B6D47' }}>
                Select tourist spots in the "Tourist Spots" tab to auto-generate a classic day-by-day itinerary.
              </p>
            </div>
          )
        )}

        {/* Spacer */}
        <div className="h-12" />
      </div>
    </div>
  );
}