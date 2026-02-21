interface TransportRoute {
    source: string;
    destination: string;
  }
  
  interface TransportData {
    mode: string;
    provider: string;
    price: number;
    duration: number;
    departureTime?: string;
    arrivalTime?: string;
    stops?: number;
    carbonFootprint?: number;
    amenities?: string[];
  }
  
  // Real-world transport data (you can later integrate with APIs)
  const transportDatabase: Record<string, TransportData[]> = {
    'pune-goa': [
      {
        mode: 'flight',
        provider: 'IndiGo',
        price: 4500,
        duration: 1.5,
        departureTime: '08:00',
        arrivalTime: '09:30',
        stops: 0,
        carbonFootprint: 120,
        amenities: ['In-flight meals', 'WiFi'],
      },
      {
        mode: 'flight',
        provider: 'Air India',
        price: 5200,
        duration: 1.5,
        departureTime: '14:30',
        arrivalTime: '16:00',
        stops: 0,
        carbonFootprint: 125,
        amenities: ['In-flight entertainment', 'Premium seats'],
      },
      {
        mode: 'train',
        provider: 'Konkan Railway',
        price: 800,
        duration: 12,
        departureTime: '22:00',
        arrivalTime: '10:00',
        stops: 15,
        carbonFootprint: 45,
        amenities: ['AC Sleeper', 'Meals available'],
      },
      {
        mode: 'train',
        provider: 'Mandovi Express',
        price: 600,
        duration: 11.5,
        departureTime: '07:10',
        arrivalTime: '18:40',
        stops: 12,
        carbonFootprint: 42,
        amenities: ['AC Coach', 'Pantry'],
      },
      {
        mode: 'bus',
        provider: 'VRL Travels',
        price: 1200,
        duration: 10,
        departureTime: '21:00',
        arrivalTime: '07:00',
        stops: 5,
        carbonFootprint: 65,
        amenities: ['AC Sleeper', 'Charging ports', 'Water'],
      },
      {
        mode: 'bus',
        provider: 'Paulo Travels',
        price: 1500,
        duration: 9.5,
        departureTime: '22:30',
        arrivalTime: '08:00',
        stops: 3,
        carbonFootprint: 68,
        amenities: ['Luxury Volvo', 'WiFi', 'Blankets'],
      },
      {
        mode: 'car',
        provider: 'Self Drive',
        price: 3500,
        duration: 10,
        carbonFootprint: 180,
        amenities: ['Flexible stops', 'Scenic route'],
      },
    ],
    'mumbai-goa': [
      {
        mode: 'flight',
        provider: 'IndiGo',
        price: 3800,
        duration: 1.2,
        departureTime: '09:15',
        arrivalTime: '10:30',
        stops: 0,
        carbonFootprint: 115,
        amenities: ['In-flight meals', 'Priority boarding'],
      },
      {
        mode: 'train',
        provider: 'Konkan Kanya Express',
        price: 900,
        duration: 12,
        departureTime: '23:00',
        arrivalTime: '11:00',
        stops: 18,
        carbonFootprint: 48,
        amenities: ['AC Sleeper', 'Meals'],
      },
      {
        mode: 'bus',
        provider: 'Neeta Volvo',
        price: 1400,
        duration: 11,
        departureTime: '20:00',
        arrivalTime: '07:00',
        stops: 4,
        carbonFootprint: 70,
        amenities: ['AC Sleeper', 'Entertainment', 'WiFi'],
      },
    ],
  };
  
  export const getTransportOptions = async (
    source: string,
    destination: string,
    budget: number,
    date: Date
  ): Promise<TransportData[]> => {
    // Normalize route key
    const routeKey = `${source.toLowerCase()}-${destination.toLowerCase()}`;
  
    // Get transport options from database
    let options = transportDatabase[routeKey] || [];
  
    // Filter by budget
    options = options.filter((opt) => opt.price <= budget);
  
    // Sort by best value (price vs time optimization)
    options.sort((a, b) => {
      const scoreA = a.price / a.duration;
      const scoreB = b.price / b.duration;
      return scoreA - scoreB;
    });
  
    return options;
  };
  
  export const getBestOptions = (
    options: TransportData[]
  ): { fastest: TransportData; cheapest: TransportData; recommended: TransportData[] } => {
    const fastest = options.reduce((prev, curr) =>
      curr.duration < prev.duration ? curr : prev
    );
  
    const cheapest = options.reduce((prev, curr) =>
      curr.price < prev.price ? curr : prev
    );
  
    // Recommended: Best balance of price and time
    const recommended = options.slice(0, 2);
  
    return { fastest, cheapest, recommended };
  };