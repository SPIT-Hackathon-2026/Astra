import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Trip from '@/models/Trip';
import { getAllTransportOptions } from '@/services/api/transportAPI';
import { getTouristSpots } from '@/services/api/touristAPI';
import { getAccommodationOptions } from '@/services/api/accommodationAPI';

export async function POST(req: NextRequest) {
  try {
    console.log('\n🎯 === NEW TRIP PLANNING REQUEST ===');

    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      console.log('⚠️ No session found, using guest-user for hackathon demo');
      userId = 'guest-user-id';
    }

    console.log(`✅ User: ${userId}`);

    let tripId = 'mock-trip-id-' + Date.now();

    if (process.env.MONGODB_URI) {
      await dbConnect();
    } else {
      console.log('⚠️ MONGODB_URI missing, bypassing DB and using mock-id');
    }

    const body = await req.json();
    const {
      source,
      destination,
      startDate,
      endDate,
      travelers,
      travelerContacts,
      interests,
      budgetType,
      tripType,
    } = body;

    console.log('Request body:', { source, destination, startDate, endDate, travelers, travelerContacts, interests, budgetType });

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

    // Fetch ALL Intelligent Data in Parallel
    console.log('\n🧠 Executing Multi-Source Research Tool...');
    const [transportOptions, touristSpots, accommodationOptions] = await Promise.all([
      getAllTransportOptions(source, destination, start.toISOString().split('T')[0]),
      getTouristSpots(destination, interests),
      getAccommodationOptions(destination, budgetType || 'moderate')
    ]);

    console.log(`✅ Research Complete: Found ${transportOptions.length} transport, ${touristSpots.length} spots, ${accommodationOptions.length} stays`);

    // Calculate initial costs
    const selectedStay = accommodationOptions.find(opt => opt.isRecommended) || accommodationOptions[0];
    const accommodationCost = (days - 1) * (selectedStay?.pricePerNight || 2500);

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
      userId: userId,
      source,
      destination,
      startDate: start,
      endDate: end,
      travelers: travelers || 1,
      tripType: tripType || 'group',
      travelerContacts: travelerContacts || [],
      transportOptions,
      allTouristSpots: touristSpots,
      accommodationOptions,
      selectedAccommodation: selectedStay ? {
        name: selectedStay.name,
        type: selectedStay.type,
        pricePerNight: selectedStay.pricePerNight
      } : undefined,
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

    if (process.env.MONGODB_URI) {
      await trip.save();
      tripId = trip._id.toString();
      console.log(`✅ Trip saved with ID: ${tripId}`);
    } else {
      console.log(`✅ Mode: Hackathon Demo - Using Trip ID: ${tripId}`);
    }

    console.log('\n🎉 === TRIP PLANNING COMPLETE ===\n');

    return NextResponse.json({
      success: true,
      tripId: tripId,
      trip: {
        _id: tripId,
        source,
        destination,
        startDate: start,
        endDate: end,
        duration: days,
        travelers: travelers || 1,
        transportOptions: trip.transportOptions,
        allTouristSpots: trip.allTouristSpots,
        accommodationOptions: trip.accommodationOptions,
        costs: initialCosts,
      },
    });
  } catch (error: any) {
    console.error('\n❌ === TRIP PLANNING FAILED ===');
    console.error('Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to plan trip' },
      { status: 500 }
    );
  }
}