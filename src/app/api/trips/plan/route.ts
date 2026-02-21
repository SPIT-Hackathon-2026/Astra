import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Trip from '../../../../models/Trip';
import { getTransportOptions, getBestOptions } from '../../../../services/transportService';
import { getTouristSpots, getRecommendedItinerary } from '../../../../services/touristSpotsService'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const {
      source,
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      interests,
      budgetType,
    } = body;

    // Validation
    if (!source || !destination || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate trip duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Get transport options
    const transportOptions = await getTransportOptions(
      source,
      destination,
      budget * 0.4, // 40% of budget for transport
      start
    );

    const { fastest, cheapest, recommended } = getBestOptions(transportOptions);

    // Get tourist spots
    const touristSpots = await getTouristSpots(destination, interests);

    // Get recommended itinerary
    const itinerary = getRecommendedItinerary(touristSpots, days);

    // Calculate estimated costs
    const transportCost = recommended[0]?.price || 0;
    const accommodationCost = days * (budgetType === 'budget' ? 1500 : budgetType === 'luxury' ? 5000 : 3000);
    const foodCost = days * travelers * 1000;
    const attractionsCost = touristSpots.slice(0, days * 3).reduce((sum, spot) => sum + spot.entryFee, 0);
    const totalEstimatedCost = (transportCost + accommodationCost + foodCost + attractionsCost) * travelers;

    // Create trip
    const trip = new Trip({
      userId: session.user.id,
      source,
      destination,
      startDate: start,
      endDate: end,
      budget,
      travelers: travelers || 1,
      transportOptions,
      touristSpots,
      totalEstimatedCost,
      preferences: {
        budgetType: budgetType || 'moderate',
        pace: 'moderate',
        interests: interests || [],
      },
      status: 'planning',
    });

    await trip.save();

    return NextResponse.json({
      success: true,
      trip: {
        id: trip._id,
        source,
        destination,
        duration: days,
        transportOptions: {
          all: transportOptions,
          fastest,
          cheapest,
          recommended,
        },
        touristSpots,
        itinerary,
        costBreakdown: {
          transport: transportCost * travelers,
          accommodation: accommodationCost,
          food: foodCost,
          attractions: attractionsCost * travelers,
          total: totalEstimatedCost,
        },
      },
    });
  } catch (error: any) {
    console.error('Trip planning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to plan trip' },
      { status: 500 }
    );
  }
}