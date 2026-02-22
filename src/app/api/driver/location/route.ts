// PATCH /api/driver/location — driver updates their location
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Driver from '../../../../models/Driver';

export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const { driverId, lat, lng, isOnline } = await req.json();

        const update: any = { currentLocation: { lat, lng } };
        if (isOnline !== undefined) update.isOnline = isOnline;

        const driver = await Driver.findByIdAndUpdate(driverId, update, { new: true });
        if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
