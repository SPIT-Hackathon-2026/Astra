import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  source: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  tripType: 'solo' | 'family' | 'group' | string;
  travelerContacts: string[];

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

  selectedTouristSpots: string[]; // Array of spot names

  // Itinerary
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
  };

  accommodationOptions: {
    type: 'hotel' | 'airbnb' | 'hostel';
    name: string;
    pricePerNight: number;
    rating: number;
    amenities: string[];
    description: string;
    isRecommended?: boolean;
    recommendationReason?: string;
  }[];

  selectedAccommodation?: {
    name: string;
    type: string;
    pricePerNight: number;
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
  tripType: {
    type: String,
    enum: ['solo', 'family', 'group', null],
    default: null,
  },
  travelerContacts: [String],
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
  costs: {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    attractions: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  accommodationOptions: [{
    type: { type: String, enum: ['hotel', 'airbnb', 'hostel'] },
    name: String,
    pricePerNight: Number,
    rating: Number,
    amenities: [String],
    description: String,
    isRecommended: Boolean,
    recommendationReason: String,
  }],
  selectedAccommodation: {
    name: String,
    type: String,
    pricePerNight: Number,
  },
  preferences: {
    budgetType: String,
    interests: [String],
    maxHoursPerDay: { type: Number, default: 12 },
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