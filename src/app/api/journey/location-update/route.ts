// POST /api/journey/location-update — triggered when user's geolocation updates
// Handles: OTP notification, driver notification, payment deduction at destination
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import ActiveJourney from '../../../../models/ActiveJourney';
import RideRequest from '../../../../models/RideRequest';

const R = 6371000; // Earth radius in meters

function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { journeyId, lat, lng } = await req.json();

        const journey = await ActiveJourney.findById(journeyId);
        if (!journey || journey.userId !== session.user.id) {
            return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
        }

        if (journey.status === 'completed' || journey.status === 'cancelled') {
            return NextResponse.json({ status: journey.status, journey });
        }

        const currentLeg = journey.legs[journey.currentLegIndex];
        if (!currentLeg) {
            journey.status = 'completed';
            await journey.save();
            return NextResponse.json({ status: 'completed', journey });
        }

        const events: string[] = [];

        const distToFrom = distanceBetween(lat, lng, currentLeg.from.lat, currentLeg.from.lng);
        const distToTo = distanceBetween(lat, lng, currentLeg.to.lat, currentLeg.to.lng);

        // ── Auto / Taxi / Cab legs ──
        if (['auto', 'taxi', 'cab'].includes(currentLeg.type)) {
            // Check if user is within 500m of pickup → notify driver
            if (distToFrom <= 500 && !currentLeg.otpVerified) {
                // Find or create a ride request for this leg
                let rideReq = await RideRequest.findOne({
                    journeyId: journeyId.toString(),
                    legIndex: journey.currentLegIndex,
                });

                if (!rideReq) {
                    rideReq = await RideRequest.create({
                        journeyId: journeyId.toString(),
                        legIndex: journey.currentLegIndex,
                        userId: session.user.id,
                        pickupLat: currentLeg.from.lat,
                        pickupLng: currentLeg.from.lng,
                        pickupName: currentLeg.from.name,
                        dropLat: currentLeg.to.lat,
                        dropLng: currentLeg.to.lng,
                        dropName: currentLeg.to.name,
                        vehicleType: currentLeg.type,
                        estimatedFare: currentLeg.cost,
                        estimatedDuration: currentLeg.estimatedDuration,
                        estimatedDistance: currentLeg.estimatedDistance,
                        otp: currentLeg.otp,
                        status: 'pending',
                    });
                    events.push('driver_notified');
                }

                journey.status = 'searching';
            }

            // Check if user is within 500m of drop → payment deducted for this leg
            if (distToTo <= 500 && currentLeg.otpVerified && !currentLeg.paymentDeducted) {
                currentLeg.paymentDeducted = true;
                currentLeg.completedAt = new Date();
                journey.amountDeducted += currentLeg.cost;
                journey.currentLegIndex += 1;
                events.push('leg_completed', 'payment_deducted');

                // Update ride request
                await RideRequest.findOneAndUpdate(
                    { journeyId: journeyId.toString(), legIndex: journey.currentLegIndex - 1 },
                    { status: 'completed', journeyCompletedAt: new Date() }
                );

                // If all legs done
                if (journey.currentLegIndex >= journey.legs.length) {
                    journey.status = 'completed';
                    events.push('journey_completed');
                }
            }
        }

        // ── Train / Bus legs ──
        if (['train', 'bus'].includes(currentLeg.type)) {
            // Payment deducted when user enters 500m of station (from)
            if (distToFrom <= 500 && !currentLeg.paymentDeducted) {
                currentLeg.paymentDeducted = true;
                currentLeg.startedAt = new Date();
                journey.amountDeducted += currentLeg.cost;
                events.push('transit_payment_deducted');
            }

            // Leg complete when within 500m of destination
            if (distToTo <= 500 && currentLeg.paymentDeducted && !currentLeg.completedAt) {
                currentLeg.completedAt = new Date();
                journey.currentLegIndex += 1;
                events.push('leg_completed');

                if (journey.currentLegIndex >= journey.legs.length) {
                    journey.status = 'completed';
                    events.push('journey_completed');
                }
            }
        }

        // ── Walk legs — auto advance ──
        if (currentLeg.type === 'walk') {
            if (distToTo <= 100) {
                currentLeg.completedAt = new Date();
                journey.currentLegIndex += 1;
                events.push('walk_completed');

                if (journey.currentLegIndex >= journey.legs.length) {
                    journey.status = 'completed';
                }
            }
        }

        await journey.save();

        // Compute OTP for current (new) leg if it's driver-type
        const newCurrentLeg = journey.legs[journey.currentLegIndex];
        const currentOtp = newCurrentLeg && ['auto', 'taxi', 'cab'].includes(newCurrentLeg.type)
            ? newCurrentLeg.otp
            : null;

        const rideRequest = await RideRequest.findOne({
            journeyId: journeyId.toString(),
            legIndex: journey.currentLegIndex,
        });

        return NextResponse.json({
            success: true,
            events,
            status: journey.status,
            currentLegIndex: journey.currentLegIndex,
            amountDeducted: journey.amountDeducted,
            refundAmount: journey.totalCost - journey.amountDeducted,
            currentOtp,
            rideRequest,
            distToFrom: Math.round(distToFrom),
            distToTo: Math.round(distToTo),
        });
    } catch (error: any) {
        console.error('Location update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
