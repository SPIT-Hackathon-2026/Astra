import mongoose, { Schema } from 'mongoose';

export interface IRideRequest extends mongoose.Document {
    journeyId: string;
    legIndex: number;
    userId: string;
    driverId?: string;

    pickupLat: number;
    pickupLng: number;
    pickupName: string;
    dropLat: number;
    dropLng: number;
    dropName: string;

    vehicleType: 'auto' | 'taxi' | 'cab';
    estimatedFare: number;
    estimatedDuration: number;
    estimatedDistance: number;

    otp?: string;
    otpVerified: boolean;

    status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
    notifyDriversAt?: Date; // 15 min before pickup
    driverArrivedAt?: Date;
    journeyStartedAt?: Date;
    journeyCompletedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const RideRequestSchema = new Schema<IRideRequest>(
    {
        journeyId: { type: String, required: true, index: true },
        legIndex: { type: Number, required: true },
        userId: { type: String, required: true },
        driverId: String,

        pickupLat: Number,
        pickupLng: Number,
        pickupName: String,
        dropLat: Number,
        dropLng: Number,
        dropName: String,

        vehicleType: { type: String, enum: ['auto', 'taxi', 'cab'] },
        estimatedFare: Number,
        estimatedDuration: Number,
        estimatedDistance: Number,

        otp: String,
        otpVerified: { type: Boolean, default: false },

        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
            default: 'pending',
        },
        notifyDriversAt: Date,
        driverArrivedAt: Date,
        journeyStartedAt: Date,
        journeyCompletedAt: Date,
    },
    { timestamps: true }
);

export default mongoose.models.RideRequest ||
    mongoose.model<IRideRequest>('RideRequest', RideRequestSchema);
