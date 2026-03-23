import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  source: string;
  destination: string;
  sourceCoords?: { lat: number; lng: number };
  destCoords?: { lat: number; lng: number };
  startDate: Date;
  endDate: Date;
  travelers: number;

  // Transport options
  transportOptions: {
    mode: string;
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
  }[];

  selectedTransport?: {
    mode: string;
    provider: string;
    price: number;
    duration: number;
  };

  // Tourist spots
  allTouristSpots: {
    name: string;
    description: string;
    category: string;
    rating: number;
    estimatedTime: number;
    entryFee: number;
    bestTimeToVisit: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    image?: string;
    address?: string;
    isPopular?: boolean;
    popularity?: number;
  }[];

  selectedTouristSpots: string[];

  // Classic Itinerary
  itinerary: {
    day: number;
    date: Date;
    spots: {
      name: string;
      startTime: string;
      endTime: string;
      duration: number;
      travelTimeToNext?: number;
    }[];
    totalHours: number;
    warnings?: string[];
  }[];

  // AI-powered itinerary
  aiItinerary?: {
    day: number;
    theme: string;
    activities: {
      time: string;
      title: string;
      description: string;
      type: 'visit' | 'food' | 'travel' | 'rest' | 'activity';
      duration: string;
      cost?: number;
      tip?: string;
    }[];
  }[];

  aiTips?: string[];
  aiSummary?: string;

  // Costs
  costs: {
    transport: number;
    accommodation: number;
    food: number;
    attractions: number;
    total: number;
  };

  preferences: {
    budgetType?: string;
    interests?: string[];
    maxHoursPerDay?: number;
    travelStyle?: string;
    accommodationType?: string;
    pacePreference?: string;
    specialRequirements?: string[];
    travelCompanion?: string;
  };

  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  sourceCoords: {
    lat: Number,
    lng: Number,
  },
  destCoords: {
    lat: Number,
    lng: Number,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  travelers: {
    type: Number,
    default: 1,
  },
  transportOptions: [{
    mode: String,
    provider: String,
    price: Number,
    duration: Number,
    departureTime: String,
    arrivalTime: String,
    stops: Number,
    carbonFootprint: Number,
    amenities: [String],
    distance: Number,
    isRecommended: Boolean,
    recommendationReason: String,
  }],
  selectedTransport: {
    mode: String,
    provider: String,
    price: Number,
    duration: Number,
  },
  allTouristSpots: [{
    name: String,
    description: String,
    category: String,
    rating: Number,
    estimatedTime: Number,
    entryFee: Number,
    bestTimeToVisit: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    image: String,
    address: String,
    isPopular: Boolean,
    popularity: Number,
  }],
  selectedTouristSpots: [String],
  itinerary: [{
    day: Number,
    date: Date,
    spots: [{
      name: String,
      startTime: String,
      endTime: String,
      duration: Number,
      travelTimeToNext: Number,
    }],
    totalHours: Number,
    warnings: [String],
  }],
  aiItinerary: [{
    day: Number,
    theme: String,
    activities: [{
      time: String,
      title: String,
      description: String,
      type: { type: String, enum: ['visit', 'food', 'travel', 'rest', 'activity'] },
      duration: String,
      cost: Number,
      tip: String,
    }],
  }],
  aiTips: [String],
  aiSummary: String,
  costs: {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    attractions: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  preferences: {
    budgetType: String,
    interests: [String],
    maxHoursPerDay: { type: Number, default: 12 },
    travelStyle: String,
    accommodationType: String,
    pacePreference: String,
    specialRequirements: [String],
    travelCompanion: String,
  },
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'completed', 'cancelled'],
    default: 'planning',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);