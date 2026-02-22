import mongoose, { Schema } from 'mongoose';

export interface IDriver extends mongoose.Document {
    name: string;
    phone: string;
    email: string;
    password: string;
    vehicleType: 'auto' | 'taxi' | 'cab';
    vehicleNumber: string;
    vehicleModel: string;
    isOnline: boolean;
    currentLocation?: { lat: number; lng: number };
    rating: number;
    totalRides: number;
    earnings: number;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, select: false },
        vehicleType: { type: String, enum: ['auto', 'taxi', 'cab'], default: 'auto' },
        vehicleNumber: { type: String, required: true },
        vehicleModel: { type: String, default: 'Standard' },
        isOnline: { type: Boolean, default: false },
        currentLocation: {
            lat: { type: Number },
            lng: { type: Number },
        },
        rating: { type: Number, default: 4.5 },
        totalRides: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.Driver || mongoose.model<IDriver>('Driver', DriverSchema);
