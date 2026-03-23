import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Trip from '../../../../models/Trip';
import { getAllTransportOptions, getCityCoordinates } from '../../../../services/api/transportAPI';
import { getTouristSpots } from '../../../../services/api/touristAPI';
import { generateAIItinerary } from '../../../../services/aiTripPlanner';

export async function POST(req: NextRequest) {
  try {
    console.log('\n🎯 === NEW AI TRIP PLANNING REQUEST ===');

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
      travelStyle,
      accommodationType,
      pacePreference,
      specialRequirements,
      travelCompanion,
    } = body;

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
    console.log(`Style: ${travelStyle}, Pace: ${pacePreference}`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Duration: ${days} days`);

    // Geocode source & destination + fetch transport options & tourist spots in parallel
    console.log('\n📍 Geocoding cities & fetching data...');
    const [srcCoords, dstCoords, transportOptions, touristSpots] = await Promise.all([
      getCityCoordinates(source),
      getCityCoordinates(destination),
      getAllTransportOptions(source, destination, start.toISOString().split('T')[0]),
      getTouristSpots(destination, interests),
    ]);

    console.log(`📍 Source coords: ${srcCoords ? `${srcCoords.lat}, ${srcCoords.lon}` : 'NOT FOUND'}`);
    console.log(`📍 Destination coords: ${dstCoords ? `${dstCoords.lat}, ${dstCoords.lon}` : 'NOT FOUND'}`);
    console.log(`✅ Found ${transportOptions.length} transport options`);
    console.log(`✅ Found ${touristSpots.length} tourist spots`);

    // Generate AI-powered itinerary
    console.log('\n🤖 Generating AI itinerary...');
    let aiItinerary = null;
    let aiTips: string[] = [];
    let aiSummary = '';

    try {
      const aiResult = await generateAIItinerary({
        source,
        destination,
        startDate,
        endDate,
        days,
        travelers: travelers || 1,
        interests: interests || [],
        budgetType: budgetType || 'moderate',
        travelStyle: travelStyle || 'balanced',
        pacePreference: pacePreference || 'moderate',
        accommodationType: accommodationType || 'hotel',
        specialRequirements: specialRequirements || [],
        travelCompanion: travelCompanion || 'solo',
        touristSpots: touristSpots.map(s => ({
          name: s.name,
          category: s.category,
          rating: s.rating,
          estimatedTime: s.estimatedTime,
          entryFee: s.entryFee,
          bestTimeToVisit: s.bestTimeToVisit,
          coordinates: s.coordinates,
        })),
      });

      if (aiResult) {
        aiItinerary = aiResult.itinerary;
        aiTips = aiResult.tips || [];
        aiSummary = aiResult.summary || '';
        console.log('✅ AI itinerary generated successfully');
      }
    } catch (aiError: any) {
      console.error('⚠️ AI generation failed, using fallback:', aiError.message);
    }

    // Calculate costs based on budget type and preferences
    const accommodationRates: Record<string, Record<string, number>> = {
      budget: { hostel: 500, hotel: 1200, resort: 2500, homestay: 800, airbnb: 1000 },
      moderate: { hostel: 800, hotel: 2500, resort: 5000, homestay: 1500, airbnb: 2000 },
      luxury: { hostel: 1500, hotel: 5000, resort: 12000, homestay: 3000, airbnb: 5000 },
    };

    const foodRates: Record<string, number> = {
      budget: 600,
      moderate: 1200,
      luxury: 2500,
    };

    const accType = accommodationType || 'hotel';
    const budType = budgetType || 'moderate';
    const accommodationCostPerNight = accommodationRates[budType]?.[accType] || 2500;
    const accommodationCost = Math.max(0, days - 1) * accommodationCostPerNight;
    const foodCostPerDay = foodRates[budType] || 1200;
    const foodCost = days * (travelers || 1) * foodCostPerDay;

    const initialCosts = {
      transport: 0,
      accommodation: accommodationCost,
      food: foodCost,
      attractions: 0,
      total: accommodationCost + foodCost,
    };

    console.log('\n💰 Estimated Costs:');
    console.log(`  Accommodation: ₹${accommodationCost} (${days - 1} nights × ₹${accommodationCostPerNight})`);
    console.log(`  Food: ₹${foodCost} (${days} days)`);
    console.log(`  TOTAL: ₹${initialCosts.total}`);

    // Save trip to database
    console.log('\n💾 Saving trip to database...');
    const trip = new Trip({
      userId: session.user.id,
      source,
      destination,
      sourceCoords: srcCoords ? { lat: srcCoords.lat, lng: srcCoords.lon } : undefined,
      destCoords: dstCoords ? { lat: dstCoords.lat, lng: dstCoords.lon } : undefined,
      startDate: start,
      endDate: end,
      travelers: travelers || 1,
      transportOptions,
      allTouristSpots: touristSpots,
      selectedTouristSpots: [],
      itinerary: [],
      costs: initialCosts,
      preferences: {
        budgetType: budType,
        interests: interests || [],
        maxHoursPerDay: pacePreference === 'relaxed' ? 8 : pacePreference === 'packed' ? 14 : 11,
        travelStyle: travelStyle || 'balanced',
        accommodationType: accType,
        pacePreference: pacePreference || 'moderate',
        specialRequirements: specialRequirements || [],
        travelCompanion: travelCompanion || 'solo',
      },
      aiItinerary: aiItinerary,
      aiTips: aiTips,
      aiSummary: aiSummary,
      status: 'planning',
    });

    await trip.save();
    console.log(`✅ Trip saved with ID: ${trip._id}`);
    console.log('\n🎉 === TRIP PLANNING COMPLETE ===\n');

    return NextResponse.json({
      success: true,
      tripId: trip._id.toString(),
      trip: {
        id: trip._id,
        source,
        destination,
        startDate: start,
        endDate: end,
        duration: days,
        travelers: travelers || 1,
        transportOptions,
        touristSpots,
        costs: initialCosts,
        aiItinerary,
        aiTips,
        aiSummary,
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