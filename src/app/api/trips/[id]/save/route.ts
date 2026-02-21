import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/mongodb';
import Trip from '../../../../../models/Trip';

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
    
    console.log('Saving trip:', id);

    const trip = await Trip.findById(id);

    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Update status to confirmed
    trip.status = 'confirmed';
    await trip.save();

    console.log('Trip saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Trip saved successfully',
      trip,
    });
  } catch (error: any) {
    console.error('Error saving trip:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}