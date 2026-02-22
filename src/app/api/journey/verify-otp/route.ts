// POST /api/journey/verify-otp — driver verifies OTP to start the journey
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import ActiveJourney from '../../../../models/ActiveJourney';
import RideRequest from '../../../../models/RideRequest';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const { journeyId, legIndex, otp, driverId } = body;

        if (!journeyId || legIndex === undefined || !otp || !driverId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Always compare as trimmed strings to avoid type mismatch
        const inputOtp = String(otp).trim();

        // Find the ride request first (this is the source of truth for OTP)
        const rideRequest = await RideRequest.findOne({
            journeyId: journeyId.toString(),
            legIndex: Number(legIndex),
            driverId: driverId.toString(),
            status: 'accepted',
        });

        if (!rideRequest) {
            // Try without driverId filter (in case of race condition)
            const anyRide = await RideRequest.findOne({
                journeyId: journeyId.toString(),
                legIndex: Number(legIndex),
                status: 'accepted',
            });
            console.log('OTP Debug - RideRequest found (any driver):', anyRide ? `OTP=${anyRide.otp}` : 'NOT FOUND');
            return NextResponse.json({ error: 'Ride request not found or not yet accepted' }, { status: 404 });
        }

        const storedOtp = String(rideRequest.otp || '').trim();
        console.log(`OTP Verification - Input: "${inputOtp}", Stored in RideRequest: "${storedOtp}"`);

        // Primary: verify against RideRequest OTP
        if (storedOtp !== inputOtp) {
            // Fallback: also check ActiveJourney leg otp (for backward compat)
            const journey = await ActiveJourney.findById(journeyId);
            const legOtp = journey?.legs?.[Number(legIndex)]?.otp;
            const legOtpStr = String(legOtp || '').trim();
            console.log(`OTP Verification fallback - ActiveJourney leg OTP: "${legOtpStr}"`);

            if (legOtpStr !== inputOtp) {
                return NextResponse.json({
                    error: 'Invalid OTP. Please ask the customer again.',
                    success: false,
                }, { status: 400 });
            }
        }

        // OTP matched — update both records
        rideRequest.otpVerified = true;
        rideRequest.status = 'in_progress';
        rideRequest.journeyStartedAt = new Date();
        await rideRequest.save();

        // Update ActiveJourney
        const journey = await ActiveJourney.findById(journeyId);
        if (journey && journey.legs[Number(legIndex)]) {
            journey.legs[Number(legIndex)].otpVerified = true;
            journey.legs[Number(legIndex)].driverId = driverId;
            journey.legs[Number(legIndex)].startedAt = new Date();
            journey.status = 'in_progress';
            await journey.save();
        }

        return NextResponse.json({
            success: true,
            message: 'OTP verified! Journey started. Drop the customer at the destination.',
        });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
