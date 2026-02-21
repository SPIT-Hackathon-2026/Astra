import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // Using Aviationstack API (Free tier: 100 requests/month)
    const response = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${process.env.AVIATIONSTACK_API_KEY}&dep_iata=${origin}&arr_iata=${destination}&flight_date=${date}`,
    );

    const data = await response.json();
    
    return NextResponse.json({
      flights: data.data?.map((flight: any) => ({
        flightNumber: flight.flight.iata,
        airline: flight.airline.name,
        departureTime: flight.departure.scheduled,
        arrivalTime: flight.arrival.scheduled,
        duration: calculateDuration(flight.departure.scheduled, flight.arrival.scheduled),
        aircraft: flight.aircraft?.model,
      })) || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flights' }, { status: 500 });
  }
}

function calculateDuration(departure: string, arrival: string): number {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  return (arr.getTime() - dep.getTime()) / 1000 / 60; // minutes
}