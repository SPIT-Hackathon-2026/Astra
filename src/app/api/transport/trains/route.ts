import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date');

  if (!from || !to || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // Using RapidAPI Indian Railway API (Free tier available)
    const response = await fetch(
      `https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations?fromStationCode=${from}&toStationCode=${to}&dateOfJourney=${date}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
        },
      }
    );

    const data = await response.json();
    
    return NextResponse.json({
      trains: data.data.map((train: any) => ({
        trainNumber: train.train_number,
        trainName: train.train_name,
        departureTime: train.from_std,
        arrivalTime: train.to_std,
        duration: train.duration,
        classes: train.class_type,
        daysOfOperation: train.run_days,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trains' }, { status: 500 });
  }
}