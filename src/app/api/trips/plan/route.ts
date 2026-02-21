import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Trip from '../../../../models/Trip';
import { getAllTransportOptions } from '../../../../services/api/transportAPI';
import { getTouristSpots } from '../../../../services/api/touristAPI';

export async function POST(req: NextRequest) {
  try {
    console.log('\n🎯 === NEW TRIP PLANNING REQUEST ===');

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('❌ Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`✅ User: ${session.user.email}`);

    await dbConnect();

    const body = await req.json();
    const {
      source,
      destination,
      startDate,
      endDate,
      travelers,
      interests,
      budgetType,
    } = body;

    console.log('Request body:', { source, destination, startDate, endDate, travelers, interests, budgetType });

    // Validation
    if (!source || !destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`\n📊 Route: ${source} → ${destination}`);
    console.log(`Dates: ${startDate} to ${endDate}`);
    console.log(`Travelers: ${travelers || 1}`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Duration: ${days} days`);

    // Fetch ALL transport options
    console.log('\n🚗 Fetching ALL transport options...');
    const transportOptions = await getAllTransportOptions(
      source,
      destination,
      start.toISOString().split('T')[0]
    );

    console.log(`✅ Found ${transportOptions.length} transport options`);

    // Fetch tourist spots
    console.log('\n🏖️ Fetching tourist spots...');
    const touristSpots = await getTouristSpots(destination, interests);

    console.log(`✅ Found ${touristSpots.length} tourist spots`);

    // Calculate initial costs
    const accommodationCostPerNight =
      budgetType === 'budget' ? 1500 : budgetType === 'luxury' ? 5000 : 3000;
    const accommodationCost = (days - 1) * accommodationCostPerNight;

    const foodCostPerDay = 1000;
    const foodCost = days * (travelers || 1) * foodCostPerDay;

    const initialCosts = {
      transport: 0,
      accommodation: accommodationCost,
      food: foodCost,
      attractions: 0,
      total: accommodationCost + foodCost,
    };

    console.log('\n💰 Initial Costs:', initialCosts);

    // Create trip in database
    console.log('\n💾 Saving trip to database...');
    const trip = new Trip({
      userId: session.user.id,
      source,
      destination,
      startDate: start,
      endDate: end,
      travelers: travelers || 1,
      transportOptions,
      allTouristSpots: touristSpots,
      selectedTouristSpots: [],
      itinerary: [],
      costs: initialCosts,
      preferences: {
        budgetType: budgetType || 'moderate',
        interests: interests || [],
        maxHoursPerDay: 12,
      },
      status: 'planning',
    });

    await trip.save();
    console.log(`✅ Trip saved with ID: ${trip._id}`);
    console.log('Trip data:', {
      id: trip._id,
      transportOptionsCount: trip.transportOptions.length,
      touristSpotsCount: trip.allTouristSpots.length,
    });

    console.log('\n🎉 === TRIP PLANNING COMPLETE ===\n');

    return NextResponse.json({
      success: true,
      tripId: trip._id.toString(),
      trip: {
        _id: trip._id,
        source,
        destination,
        startDate: start,
        endDate: end,
        duration: days,
        travelers: travelers || 1,
        transportOptions: trip.transportOptions,
        allTouristSpots: trip.allTouristSpots,
        costs: initialCosts,
      },
    });
  } catch (error: any) {
    console.error('\n❌ === TRIP PLANNING FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { error: error.message || 'Failed to plan trip' },
      { status: 500 }
    );
  }
}