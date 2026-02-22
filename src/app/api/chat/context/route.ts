import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONTEXT_FILE = path.join(process.cwd(), 'data', 'trip_context.json');

export async function GET() {
    try {
        if (fs.existsSync(CONTEXT_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf-8'));
            return NextResponse.json(data);
        }
        return NextResponse.json({
            source: "",
            destination: "",
            startDate: "",
            endDate: "",
            budget: null,
            travelers: null,
            budgetType: null,
            tripType: null,
            travelerContacts: [],
            interests: []
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}
