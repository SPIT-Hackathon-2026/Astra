import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/mongodb';
import Trip from '../../../../../models/Trip';
import { buildSmartItinerary, calculateAttractionCost } from '../../../../../services/itineraryService';

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
    const { selectedSpots } = await req.json();
    
    console.log('Updating spots for trip:', id);
    console.log('Selected spots:', selectedSpots);

    const trip = await Trip.findById(id);

    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Update selected spots
    trip.selectedTouristSpots = selectedSpots;

    // Calculate attraction cost
    const attractionCost = calculateAttractionCost(
      selectedSpots,
      trip.allTouristSpots,
      trip.travelers
    );

    trip.costs.attractions = attractionCost;
    trip.costs.total =
      trip.costs.transport +
      trip.costs.accommodation +
      trip.costs.food +
      trip.costs.attractions;

    // Build itinerary
    const itinerary = buildSmartItinerary(
      selectedSpots,
      trip.allTouristSpots,
      trip.startDate,
      trip.endDate,
      trip.preferences.maxHoursPerDay
    );

    trip.itinerary = itinerary;

    await trip.save();

    console.log('Spots and itinerary updated successfully');

    return NextResponse.json({
      success: true,
      itinerary,
      costs: trip.costs,
    });
  } catch (error: any) {
    console.error('Error updating spots:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}