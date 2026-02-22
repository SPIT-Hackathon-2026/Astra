// POST /api/driver/auth — login or register a driver
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Driver from '../../../../models/Driver';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { action, email, password, name, phone, vehicleType, vehicleNumber, vehicleModel } = body;

        if (action === 'login') {
            const driver = await Driver.findOne({ email }).select('+password');
            if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
            const valid = await bcrypt.compare(password, driver.password);
            if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

            const token = jwt.sign({ id: driver._id.toString(), role: 'driver' }, process.env.NEXTAUTH_SECRET!, { expiresIn: '7d' });
            return NextResponse.json({
                success: true,
                token,
                driver: { id: driver._id, name: driver.name, email: driver.email, vehicleType: driver.vehicleType, vehicleNumber: driver.vehicleNumber },
            });
        }

        if (action === 'register') {
            const exists = await Driver.findOne({ email });
            if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

            const hashed = await bcrypt.hash(password, 12);
            const driver = await Driver.create({
                name, email, phone, password: hashed,
                vehicleType: vehicleType || 'auto',
                vehicleNumber: vehicleNumber || 'MH-01-XX-0000',
                vehicleModel: vehicleModel || 'Standard',
            });

            const token = jwt.sign({ id: driver._id.toString(), role: 'driver' }, process.env.NEXTAUTH_SECRET!, { expiresIn: '7d' });
            return NextResponse.json({
                success: true,
                token,
                driver: { id: driver._id, name: driver.name, email: driver.email, vehicleType: driver.vehicleType },
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
