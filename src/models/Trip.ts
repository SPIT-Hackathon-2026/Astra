import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransportOption {
  mode: 'flight' | 'train' | 'bus' | 'car';
  provider: string;
  price: number;
  duration: number; // in hours
  departureTime?: string;
  arrivalTime?: string;
  stops?: number;
  carbonFootprint?: number;
  amenities?: string[];
}

export interface ITouristSpot {
  name: string;
  description: string;
  category: string;
  rating: number;
  estimatedTime: number; // hours
  entryFee: number;
  bestTimeToVisit: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  source: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  travelers: number;
  transportOptions: ITransportOption[];
  selectedTransport?: ITransportOption;
  touristSpots: ITouristSpot[];
  selectedSpots?: string[];
  accommodation?: {
    type: string;
    name: string;
    price: number;
    rating: number;
  };
  totalEstimatedCost: number;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  preferences: {
    budgetType: 'budget' | 'moderate' | 'luxury';
    pace: 'relaxed' | 'moderate' | 'packed';
    interests: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransportOptionSchema = new Schema({
  mode: {
    type: String,
    enum: ['flight', 'train', 'bus', 'car'],
    required: true,
  },
  provider: String,
  price: Number,
  duration: Number,
  departureTime: String,
  arrivalTime: String,
  stops: Number,
  carbonFootprint: Number,
  amenities: [String],
});

const TouristSpotSchema = new Schema({
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
});

const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    budget: {
      type: Number,
      required: true,
    },
    travelers: {
      type: Number,
      default: 1,
    },
    transportOptions: [TransportOptionSchema],
    selectedTransport: TransportOptionSchema,
    touristSpots: [TouristSpotSchema],
    selectedSpots: [String],
    accommodation: {
      type: {
        type: String,
      },
      name: String,
      price: Number,
      rating: Number,
    },
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['planning', 'confirmed', 'completed', 'cancelled'],
      default: 'planning',
    },
    preferences: {
      budgetType: {
        type: String,
        enum: ['budget', 'moderate', 'luxury'],
        default: 'moderate',
      },
      pace: {
        type: String,
        enum: ['relaxed', 'moderate', 'packed'],
        default: 'moderate',
      },
      interests: [String],
    },
  },
  {
    timestamps: true,
  }
);

const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);

export default Trip;