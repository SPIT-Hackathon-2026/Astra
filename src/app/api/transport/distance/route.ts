import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origin and destination required' }, { status: 400 });
  }

  try {
    // Using OpenRouteService API (Free tier: 2000 requests/day)
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?start=${origin}&end=${destination}`,
      {
        headers: {
          'Authorization': process.env.OPENROUTE_API_KEY || '',
        },
      }
    );

    const data = await response.json();
    
    return NextResponse.json({
      distance: data.features[0].properties.segments[0].distance,
      duration: data.features[0].properties.segments[0].duration,
      steps: data.features[0].properties.segments[0].steps,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch distance' }, { status: 500 });
  }
}