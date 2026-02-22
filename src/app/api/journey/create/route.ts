// POST /api/journey/create — creates a journey + Razorpay order for single upfront payment
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import ActiveJourney from '../../../../models/ActiveJourney';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const body = await req.json();
        const { source, destination, legs, totalCost } = body;

        if (!source || !destination || !legs || !totalCost) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate OTPs for driver legs (auto/taxi/cab)
        const processedLegs = legs.map((leg: any) => {
            if (['auto', 'taxi', 'cab'].includes(leg.type)) {
                return { ...leg, otp: generateOTP(), otpVerified: false, paymentDeducted: false };
            }
            return { ...leg, otpVerified: false, paymentDeducted: false };
        });

        // Create Razorpay order (amount in paise)
        const order = await razorpay.orders.create({
            amount: Math.round(totalCost * 100),
            currency: 'INR',
            receipt: `journey_${Date.now()}`,
            notes: {
                userId: session.user.id,
                source: source.name,
                destination: destination.name,
            },
        });

        // Save journey to DB
        const journey = await ActiveJourney.create({
            userId: session.user.id,
            source,
            destination,
            legs: processedLegs,
            totalCost,
            amountPaid: 0,
            amountDeducted: 0,
            refundAmount: 0,
            razorpayOrderId: order.id,
            status: 'searching',
            currentLegIndex: 0,
        });

        return NextResponse.json({
            success: true,
            journeyId: journey._id.toString(),
            razorpayOrderId: order.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            legs: processedLegs.map((l: any, i: number) => ({
                index: i,
                type: l.type,
                from: l.from,
                to: l.to,
                cost: l.cost,
                otp: ['auto', 'taxi', 'cab'].includes(l.type) ? l.otp : undefined,
            })),
        });
    } catch (error: any) {
        console.error('Journey create error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
