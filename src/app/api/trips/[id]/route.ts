import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Trip from '../../../../models/Trip';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // AWAIT params before accessing
    const { id } = await params;
    
    console.log('Fetching trip with ID:', id);
    console.log('User ID:', session.user.id);

    const trip = await Trip.findById(id);

    if (!trip) {
      console.log('Trip not found in database');
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    console.log('Trip found, userId:', trip.userId);

    if (trip.userId !== session.user.id) {
      console.log('User ID mismatch');
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trip,
    });
  } catch (error: any) {
    console.error('Error fetching trip:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}