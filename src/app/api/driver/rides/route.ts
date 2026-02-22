// GET /api/driver/rides — get pending ride requests near driver's location
// POST /api/driver/rides — accept or reject a ride request
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import RideRequest from '../../../../models/RideRequest';
import Driver from '../../../../models/Driver';

const R = 6371000;
function dist(lat1: number, lng1: number, lat2: number, lng2: number) {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const driverId = searchParams.get('driverId');
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');

        if (!driverId) return NextResponse.json({ error: 'driverId required' }, { status: 400 });

        const driver = await Driver.findById(driverId);
        if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

        // Get all pending requests filtered by vehicle type
        const pending = await RideRequest.find({
            status: 'pending',
            vehicleType: driver.vehicleType,
        }).sort({ createdAt: -1 });

        // Filter by 50km proximity (generous for testing).
        // If driver has no saved location and no GPS params, show all.
        const driverLat = lat || driver.currentLocation?.lat || 0;
        const driverLng = lng || driver.currentLocation?.lng || 0;

        const nearby = (driverLat === 0 && driverLng === 0)
            ? pending
            : pending.filter((r) => {
                const d = dist(driverLat, driverLng, r.pickupLat, r.pickupLng);
                return d <= 50000; // 50km for testing
            });

        return NextResponse.json({ rides: nearby, count: nearby.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { rideId, driverId, action } = await req.json();

        const ride = await RideRequest.findById(rideId);
        if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });

        if (ride.status !== 'pending') {
            return NextResponse.json({ error: 'Ride is no longer available' }, { status: 409 });
        }

        if (action === 'accept') {
            ride.status = 'accepted';
            ride.driverId = driverId;

            // Update driver's last active location / mark as busy
            await Driver.findByIdAndUpdate(driverId, {
                isOnline: true,
            });
        } else {
            ride.status = 'rejected';
        }

        await ride.save();

        // If accepted, fetch full driver info to return to caller (customer polling)
        let driverInfo = null;
        if (action === 'accept') {
            const driver = await Driver.findById(driverId).select(
                'name phone vehicleType vehicleNumber vehicleModel rating'
            );
            driverInfo = driver;
        }

        return NextResponse.json({ success: true, ride, driver: driverInfo });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
