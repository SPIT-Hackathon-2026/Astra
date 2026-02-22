// POST /api/journey/cancel — customer cancels the journey with partial refund
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import ActiveJourney from '../../../../models/ActiveJourney';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const { journeyId, reason } = await req.json();

        const journey = await ActiveJourney.findById(journeyId);
        if (!journey || journey.userId !== session.user.id) {
            return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
        }

        if (journey.status === 'completed' || journey.status === 'cancelled') {
            return NextResponse.json({ error: 'Journey already ended' }, { status: 400 });
        }

        const refundAmount = journey.totalCost - journey.amountDeducted;

        // Issue Razorpay refund if payment was made
        if (journey.razorpayPaymentId && refundAmount > 0) {
            try {
                await razorpay.payments.refund(journey.razorpayPaymentId, {
                    amount: Math.round(refundAmount * 100), // paise
                    notes: { reason: reason || 'Customer cancelled', journeyId: journeyId.toString() },
                });
            } catch (refundErr: any) {
                console.error('Refund error:', refundErr.message);
                // We still cancel but log refund failure
            }
        }

        journey.status = 'cancelled';
        journey.cancelledAt = new Date();
        journey.cancelReason = reason || 'Customer cancelled';
        journey.refundAmount = refundAmount;
        await journey.save();

        return NextResponse.json({
            success: true,
            refundAmount,
            message: `Journey cancelled. ₹${refundAmount.toFixed(0)} will be refunded to your account within 5-7 working days.`,
        });
    } catch (error: any) {
        console.error('Cancel journey error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
