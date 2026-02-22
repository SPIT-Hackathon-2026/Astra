// POST /api/journey/verify-payment — confirm Razorpay payment, activate journey, create ride requests
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import ActiveJourney from '../../../../models/ActiveJourney';
import RideRequest from '../../../../models/RideRequest';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { journeyId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

        // Verify Razorpay signature
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (expectedSig !== razorpaySignature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        const journey = await ActiveJourney.findById(journeyId);
        if (!journey) return NextResponse.json({ error: 'Journey not found' }, { status: 404 });

        journey.razorpayPaymentId = razorpayPaymentId;
        journey.amountPaid = journey.totalCost;
        journey.status = 'searching';
        await journey.save();

        console.log(`✅ Payment verified for journey ${journeyId}. Creating ride requests...`);
        console.log(`   Legs: ${journey.legs.map((l: any) => l.type + '(OTP:' + l.otp + ')').join(', ')}`);

        // ── Create RideRequest for every auto/taxi/cab leg immediately ──
        let created = 0;
        for (let legIndex = 0; legIndex < journey.legs.length; legIndex++) {
            const leg = journey.legs[legIndex];

            if (!['auto', 'taxi', 'cab'].includes(leg.type)) continue;

            // Avoid duplicates
            const existing = await RideRequest.findOne({
                journeyId: journeyId.toString(),
                legIndex,
            });
            if (existing) {
                console.log(`   Leg ${legIndex} (${leg.type}): ride request already exists`);
                continue;
            }

            // Build pickup/drop names with fallback
            const pickupName = leg.from?.name || `${leg.from?.lat?.toFixed(4)},${leg.from?.lng?.toFixed(4)}` || 'Pickup';
            const dropName = leg.to?.name || `${leg.to?.lat?.toFixed(4)},${leg.to?.lng?.toFixed(4)}` || 'Drop';
            const otp = String(leg.otp || '').trim();

            if (!otp) {
                console.warn(`   ⚠️ Leg ${legIndex} (${leg.type}) has no OTP — skipping`);
                continue;
            }

            const rr = await RideRequest.create({
                journeyId: journeyId.toString(),
                legIndex,
                userId: session.user.id,
                pickupLat: leg.from?.lat || 0,
                pickupLng: leg.from?.lng || 0,
                pickupName,
                dropLat: leg.to?.lat || 0,
                dropLng: leg.to?.lng || 0,
                dropName,
                vehicleType: leg.type,
                estimatedFare: leg.cost || 0,
                estimatedDuration: leg.estimatedDuration || 0,
                estimatedDistance: leg.estimatedDistance || 0,
                otp,
                status: 'pending',
            });

            console.log(`   ✅ Created RideRequest for leg ${legIndex} (${leg.type}): OTP=${otp}, pickup="${pickupName}", id=${rr._id}`);
            created++;
        }

        console.log(`✅ Payment verification complete. ${created} ride request(s) created.`);

        return NextResponse.json({
            success: true,
            journeyId,
            rideRequestsCreated: created,
        });
    } catch (error: any) {
        console.error('Verify payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
