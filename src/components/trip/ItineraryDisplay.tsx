'use client';

import { Calendar, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface ItinerarySpot {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  travelTimeToNext?: number;
}

interface DayPlan {
  day: number;
  date: Date;
  spots: ItinerarySpot[];
  totalHours: number;
  warnings?: string[];
}

interface Props {
  itinerary: DayPlan[];
  onSaveTrip: () => void;
  isSaving?: boolean;
}

export default function ItineraryDisplay({ itinerary, onSaveTrip, isSaving }: Props) {
  if (itinerary.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-[var(--rs-sand-dark)] p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[var(--rs-deep-brown)] mb-2">
          No Itinerary Yet
        </h3>
        <p className="text-[var(--rs-desert-brown)]">
          Select tourist spots above to generate a smart day-by-day itinerary
        </p>
      </div>
    );
  }

  const hasWarnings = itinerary.some(day => day.warnings && day.warnings.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--rs-deep-brown)]">Your Itinerary</h2>
          <p className="text-[var(--rs-desert-brown)] mt-1">
            {itinerary.length} days planned • {itinerary.reduce((sum, day) => sum + day.spots.length, 0)} spots
          </p>
        </div>
        <button
          onClick={onSaveTrip}
          disabled={isSaving || hasWarnings}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition flex items-center gap-2 ${
            hasWarnings
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Save Trip
            </>
          )}
        </button>
      </div>

      {/* Global Warnings */}
      {hasWarnings && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                Action Required
              </h4>
              <p className="text-sm text-red-700">
                Your itinerary has warnings. Please adjust your spot selection before saving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Days */}
      <div className="space-y-6">
        {itinerary.map((day, idx) => (
          <DayCard key={idx} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day }: { day: DayPlan }) {
  const hasWarnings = day.warnings && day.warnings.length > 0;

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden ${
        hasWarnings ? 'border-red-300' : 'border-[var(--rs-sand-dark)]'
      }`}
    >
      {/* Day Header */}
      <div
        className={`px-6 py-4 ${
          hasWarnings
            ? 'bg-red-50 border-b-2 border-red-200'
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-[var(--rs-sand-dark)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                hasWarnings
                  ? 'bg-red-200 text-red-900'
                  : 'bg-blue-200 text-blue-900'
              }`}
            >
              {day.day}
            </div>
            <div>
              <h3 className="font-bold text-[var(--rs-deep-brown)] text-lg">
                Day {day.day}
              </h3>
              <p className="text-sm text-[var(--rs-desert-brown)]">
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--rs-desert-brown)]">Total time</p>
            <p
              className={`text-xl font-bold ${
                day.totalHours > 15
                  ? 'text-red-600'
                  : day.totalHours > 12
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            >
              {day.totalHours.toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          {day.warnings!.map((warning, idx) => (
            <p key={idx} className="text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Spots Timeline */}
      <div className="p-6">
        <div className="space-y-4">
          {day.spots.map((spot, idx) => (
            <div key={idx}>
              <div className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--rs-terracotta)]" />
                  </div>
                  {idx < day.spots.length - 1 && (
                    <div className="w-0.5 h-full bg-[var(--rs-sand-dark)] my-2 flex-1" />
                  )}
                </div>

                {/* Spot Details */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-[var(--rs-deep-brown)] text-lg">
                        {spot.name}
                      </h4>
                      <p className="text-sm text-[var(--rs-desert-brown)] flex items-center gap-2 mt-1">
                        <span className="font-medium text-[var(--rs-terracotta)]">
                          {spot.startTime}
                        </span>
                        <span>→</span>
                        <span className="font-medium text-purple-600">
                          {spot.endTime}
                        </span>
                      </p>
                    </div>
                    <div className="bg-[var(--rs-sand)] px-3 py-1 rounded-full text-sm font-medium text-[var(--rs-deep-brown)]">
                      {spot.duration}h
                    </div>
                  </div>

                  {/* Travel Time */}
                  {spot.travelTimeToNext && spot.travelTimeToNext > 0.1 && (
                    <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-sm text-orange-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Travel to next spot: ~
                        {Math.round(spot.travelTimeToNext * 60)} minutes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}