import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/mongodb';
import Trip from '../../../../../models/Trip';

// GET all trips for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const trips = await Trip.find({ 
      userId: session.user.id || session.user.email 
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      trips,
    });
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params; // AWAIT here
    const { transportOption } = await req.json();
    
    const trip = await Trip.findById(id);

    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Update selected transport
    trip.selectedTransport = transportOption;

    // Update transport cost (round trip)
    trip.costs.transport = transportOption.price * 2 * trip.travelers;
    trip.costs.total = 
      trip.costs.transport +
      trip.costs.accommodation +
      trip.costs.food +
      trip.costs.attractions;

    await trip.save();

    console.log('Transport updated successfully');

    return NextResponse.json({
      success: true,
      costs: trip.costs,
    });
  } catch (error: any) {
    console.error('Error updating transport:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params; // AWAIT here
    const trip = await Trip.findById(id);

    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Remove selected transport
    trip.selectedTransport = undefined;
    trip.costs.transport = 0;
    trip.costs.total =
      trip.costs.accommodation +
      trip.costs.food +
      trip.costs.attractions;

    await trip.save();

    console.log('Transport deselected successfully');

    return NextResponse.json({
      success: true,
      costs: trip.costs,
    });
  } catch (error: any) {
    console.error('Error deselecting transport:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}