// GET /api/rides — list current user's rides
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Ride from '../../../../models/Ride';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const rides = await Ride.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ success: true, rides });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
