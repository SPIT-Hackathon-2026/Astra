// GET /api/journey/status?journeyId=xxx — customer polls this to get journey + driver info
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import ActiveJourney from '../../../../models/ActiveJourney';
import RideRequest from '../../../../models/RideRequest';
import Driver from '../../../../models/Driver';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const journeyId = searchParams.get('journeyId');
        if (!journeyId) return NextResponse.json({ error: 'journeyId required' }, { status: 400 });

        const journey = await ActiveJourney.findById(journeyId);
        if (!journey || journey.userId !== session.user.id) {
            return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
        }

        // Find the ride request for the current leg
        const currentLegIndex = journey.currentLegIndex;
        const rideRequest = await RideRequest.findOne({
            journeyId: journeyId.toString(),
            legIndex: currentLegIndex,
        });

        // If there's an accepted driver, fetch their public info
        let driverInfo = null;
        if (rideRequest?.driverId && ['accepted', 'in_progress'].includes(rideRequest.status)) {
            const driver = await Driver.findById(rideRequest.driverId).select(
                'name phone vehicleType vehicleNumber vehicleModel rating'
            );
            if (driver) {
                driverInfo = {
                    name: driver.name,
                    phone: driver.phone,
                    vehicleType: driver.vehicleType,
                    vehicleNumber: driver.vehicleNumber,
                    vehicleModel: driver.vehicleModel,
                    rating: driver.rating,
                };
            }
        }

        return NextResponse.json({
            success: true,
            status: journey.status,
            currentLegIndex: journey.currentLegIndex,
            amountDeducted: journey.amountDeducted,
            totalCost: journey.totalCost,
            rideStatus: rideRequest?.status || null,
            driver: driverInfo,
            otp: rideRequest?.otp || null,
        });
    } catch (error: any) {
        console.error('Journey status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
