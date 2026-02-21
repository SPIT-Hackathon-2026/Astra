import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!city || !lat || !lon) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // Using OpenTripMap API (Free, no limit for basic usage)
    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${lon}&lat=${lat}&rate=3&format=json&apikey=${process.env.OPENTRIPMAP_API_KEY}`,
    );

    const data = await response.json();
    
    const spots = await Promise.all(
      data.slice(0, 10).map(async (place: any) => {
        const details = await fetch(
          `https://api.opentripmap.com/0.1/en/places/xid/${place.xid}?apikey=${process.env.OPENTRIPMAP_API_KEY}`,
        );
        const detailData = await details.json();
        
        return {
          name: place.name || 'Unnamed Place',
          description: detailData.wikipedia_extracts?.text || detailData.info?.descr || 'No description available',
          category: place.kinds?.split(',')[0] || 'attraction',
          location: {
            lat: place.point.lat,
            lon: place.point.lon,
          },
          rating: detailData.rate || 0,
          image: detailData.preview?.source || detailData.image || null,
        };
      })
    );
    
    return NextResponse.json({ spots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tourist spots' }, { status: 500 });
  }
}