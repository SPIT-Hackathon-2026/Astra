import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/mongodb';
import Trip from '../../../../../models/Trip';
import { generateAIItinerary } from '../../../../../services/aiTripPlanner';

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
        const { id } = await params;

        const trip = await Trip.findById(id);
        if (!trip || trip.userId !== session.user.id) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        console.log(`\n🤖 Regenerating AI itinerary for trip ${id}...`);

        const spotData = (trip.allTouristSpots || []).map((s: any) => ({
            name: s.name,
            category: s.category,
            rating: s.rating || 4.0,
            estimatedTime: s.estimatedTime || 2,
            entryFee: s.entryFee || 0,
            bestTimeToVisit: s.bestTimeToVisit || 'Anytime',
            coordinates: s.coordinates,
        }));

        const result = await generateAIItinerary({
            source: trip.source,
            destination: trip.destination,
            startDate: trip.startDate.toISOString().split('T')[0],
            endDate: trip.endDate.toISOString().split('T')[0],
            days,
            travelers: trip.travelers || 1,
            interests: trip.preferences?.interests || [],
            budgetType: trip.preferences?.budgetType || 'moderate',
            travelStyle: trip.preferences?.travelStyle || 'explorer',
            pacePreference: trip.preferences?.pacePreference || 'moderate',
            accommodationType: trip.preferences?.accommodationType || 'hotel',
            specialRequirements: trip.preferences?.specialRequirements || [],
            travelCompanion: trip.preferences?.travelCompanion || 'solo',
            touristSpots: spotData,
        });

        if (result) {
            trip.aiItinerary = result.itinerary;
            trip.aiTips = result.tips;
            trip.aiSummary = result.summary;
            await trip.save();

            console.log('✅ AI itinerary regenerated successfully');

            return NextResponse.json({
                success: true,
                aiItinerary: result.itinerary,
                aiTips: result.tips,
                aiSummary: result.summary,
            });
        }

        return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
    } catch (error: any) {
        console.error('Error regenerating AI itinerary:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
