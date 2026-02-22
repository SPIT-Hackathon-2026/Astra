// GET /api/reverse-geocode?lat=...&lng=... — server-side Nominatim proxy
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (!lat || !lng) {
            return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
        }

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'RadiatorRoutes/1.0 (contact@radiatorroutes.app)',
                    'Accept-Language': 'en',
                },
                next: { revalidate: 60 }, // cache for 60s
            }
        );

        if (!response.ok) {
            return NextResponse.json({ error: 'Geocoding failed' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Reverse geocode error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
