import mongoose, { Schema } from 'mongoose';

export type RideStatus =
    | 'searching'   // Customer booked, looking for driver
    | 'driver_assigned' // Driver matched
    | 'otp_pending' // Driver at pickup, waiting for OTP
    | 'in_progress' // OTP verified, journey started
    | 'completed'   // Journey ended, payment settled
    | 'cancelled';  // Cancelled by user

export type LegType = 'auto' | 'taxi' | 'cab' | 'train' | 'bus' | 'walk';

export interface IRideLeg {
    type: LegType;
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    estimatedDuration: number; // minutes
    estimatedDistance: number; // meters
    cost: number; // INR
    trainLine?: string;
    driverId?: string;
    otp?: string;
    otpVerified?: boolean;
    paymentDeducted?: boolean;
    startedAt?: Date;
    completedAt?: Date;
}

export interface IActiveJourney extends mongoose.Document {
    userId: string;
    source: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
    legs: IRideLeg[];

    // Payment
    totalCost: number;
    amountPaid: number;          // full upfront payment
    amountDeducted: number;      // deducted so far (leg by leg)
    refundAmount: number;
    razorpayOrderId: string;
    razorpayPaymentId?: string;

    // Status
    status: RideStatus;
    currentLegIndex: number;     // which leg is active

    // Cancel
    cancelledAt?: Date;
    cancelReason?: string;

    createdAt: Date;
    updatedAt: Date;
}

const RideLegSchema = new Schema({
    type: { type: String, enum: ['auto', 'taxi', 'cab', 'train', 'bus', 'walk'] },
    from: { name: String, lat: Number, lng: Number },
    to: { name: String, lat: Number, lng: Number },
    estimatedDuration: Number,
    estimatedDistance: Number,
    cost: Number,
    trainLine: String,
    driverId: String,
    otp: String,
    otpVerified: { type: Boolean, default: false },
    paymentDeducted: { type: Boolean, default: false },
    startedAt: Date,
    completedAt: Date,
});

const ActiveJourneySchema = new Schema<IActiveJourney>(
    {
        userId: { type: String, required: true, index: true },
        source: { name: String, lat: Number, lng: Number },
        destination: { name: String, lat: Number, lng: Number },
        legs: [RideLegSchema],
        totalCost: { type: Number, required: true },
        amountPaid: { type: Number, default: 0 },
        amountDeducted: { type: Number, default: 0 },
        refundAmount: { type: Number, default: 0 },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        status: {
            type: String,
            enum: ['searching', 'driver_assigned', 'otp_pending', 'in_progress', 'completed', 'cancelled'],
            default: 'searching',
        },
        currentLegIndex: { type: Number, default: 0 },
        cancelledAt: Date,
        cancelReason: String,
    },
    { timestamps: true }
);

export default mongoose.models.ActiveJourney ||
    mongoose.model<IActiveJourney>('ActiveJourney', ActiveJourneySchema);
