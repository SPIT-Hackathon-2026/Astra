import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Trip from '../../../../models/Trip';

/* ===================== GET TRIP ===================== */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🔍 Fetching trip with ID:', id);

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Duration
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Transport
    const transportOptions = trip.transportOptions || [];
    const fastest = transportOptions.length
      ? transportOptions.reduce((a: any, b: any) =>
          b.duration < a.duration ? b : a
        )
      : null;

    const cheapest = transportOptions.length
      ? transportOptions.reduce((a: any, b: any) =>
          b.price < a.price ? b : a
        )
      : null;

    const recommended = transportOptions.slice(0, 2);

    // Itinerary
    const touristSpots = trip.touristSpots || [];
    const hoursPerDay = 8;
    const itinerary: any[][] = [];
    let day: any[] = [];
    let hours = 0;

    for (const spot of touristSpots) {
      if (hours + spot.estimatedTime <= hoursPerDay) {
        day.push(spot);
        hours += spot.estimatedTime;
      } else {
        itinerary.push(day);
        day = [spot];
        hours = spot.estimatedTime;
      }
      if (itinerary.length >= duration) break;
    }
    if (day.length && itinerary.length < duration) itinerary.push(day);

    return NextResponse.json({
      success: true,
      trip: {
        id: trip._id.toString(),
        source: trip.source,
        destination: trip.destination,
        duration,
        travelers: trip.travelers,
        transportOptions: {
          all: transportOptions,
          fastest,
          cheapest,
          recommended,
        },
        touristSpots,
        itinerary,
        costBreakdown: {
          transport: (fastest?.price || 0) * 2 * trip.travelers,
          accommodation:
            duration *
            (trip.preferences?.budgetType === 'budget'
              ? 1500
              : trip.preferences?.budgetType === 'luxury'
              ? 5000
              : 3000),
          food: duration * trip.travelers * 1000,
          attractions:
            touristSpots.reduce(
              (sum: number, s: any) => sum + (s.entryFee || 0),
              0
            ) * trip.travelers,
          total: trip.totalEstimatedCost,
        },
        status: trip.status,
        createdAt: trip.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Trip Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

/* ===================== UPDATE TRIP ===================== */
import type { ITrip } from '../../../../models/Trip';

/* ===================== UPDATE TRIP ===================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates = (await req.json()) as Partial<ITrip>;

    const allowedFields: (keyof ITrip)[] = [
      'status',
      'selectedTransport',
      'selectedSpots',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        trip.set(field, updates[field]);
      }
    }

    await trip.save();

    return NextResponse.json({ success: true, trip });
  } catch (error: any) {
    console.error('❌ PATCH Trip Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update trip' },
      { status: 500 }
    );
  }
}

/* ===================== DELETE TRIP ===================== */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await trip.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ DELETE Trip Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete trip' },
      { status: 500 }
    );
  }
}