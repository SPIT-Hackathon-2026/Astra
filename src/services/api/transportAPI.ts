import axios from 'axios';

export interface TransportOption {
  mode: 'flight' | 'train' | 'bus' | 'metro' | 'car';
  provider: string;
  price: number;
  duration: number;
  departureTime: string;
  arrivalTime: string;
  stops?: number;
  carbonFootprint?: number;
  amenities?: string[];
  distance?: number;
  route?: string;
  isRecommended?: boolean;
  recommendationReason?: string;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateArrivalTime(departureTime: string, durationHours: number): string {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Math.round(durationHours * 60);
  const arrivalHours = Math.floor(totalMinutes / 60) % 24;
  const arrivalMinutes = totalMinutes % 60;
  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
}

// Get coordinates using Nominatim
export async function getCityCoordinates(city: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    console.log(`🔍 Getting coordinates for: ${city}`);
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: `${city}, India`,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'RadiatorRoutes-TripPlanner/1.0'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      console.log(`✅ Found: ${result.display_name}`);
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name
      };
    }
    
    console.log(`❌ City not found: ${city}`);
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

// Get REAL flight data from AviationStack API
async function getRealFlightData(
  source: string,
  destination: string,
  date: string
): Promise<TransportOption[]> {
  try {
    console.log(`✈️ Fetching real flight data from AviationStack...`);

    // Map cities to airport codes
    const airportCodes: { [key: string]: string } = {
      'mumbai': 'BOM', 'pune': 'PNQ', 'delhi': 'DEL', 'bangalore': 'BLR',
      'chennai': 'MAA', 'kolkata': 'CCU', 'hyderabad': 'HYD', 'ahmedabad': 'AMD',
      'goa': 'GOI', 'kochi': 'COK', 'jaipur': 'JAI', 'lucknow': 'LKO',
      'chandigarh': 'IXC', 'bhopal': 'BHO', 'indore': 'IDR'
    };

    const sourceCode = Object.keys(airportCodes).find(key => 
      source.toLowerCase().includes(key)
    );
    const destCode = Object.keys(airportCodes).find(key => 
      destination.toLowerCase().includes(key)
    );

    if (!sourceCode || !destCode) {
      console.log('⚠️ No airport codes found for this route');
      return [];
    }

    const response = await axios.get('http://api.aviationstack.com/v1/flights', {
      params: {
        access_key: process.env.AVIATIONSTACK_API_KEY,
        dep_iata: airportCodes[sourceCode],
        arr_iata: airportCodes[destCode],
        flight_date: date,
      },
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log(`✅ Found ${response.data.data.length} real flights`);
      
      return response.data.data.map((flight: any) => {
        const deptTime = new Date(flight.departure.scheduled);
        const arrTime = new Date(flight.arrival.scheduled);
        const duration = (arrTime.getTime() - deptTime.getTime()) / (1000 * 60 * 60);

        return {
          mode: 'flight' as const,
          provider: flight.airline.name || 'Unknown Airline',
          price: 3500, // Estimate - AviationStack doesn't provide prices
          duration: duration,
          departureTime: deptTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          arrivalTime: arrTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          stops: 0,
          carbonFootprint: Math.round(duration * 600 * 0.158),
          amenities: ['In-flight Entertainment', 'Meal', 'Baggage allowance'],
        };
      });
    }

    return [];
  } catch (error: any) {
    console.error('❌ AviationStack API Error:', error.message);
    return [];
  }
}

// Get REAL bus data from RapidAPI
async function getRealBusData(
  source: string,
  destination: string,
  date: string
): Promise<TransportOption[]> {
  try {
    console.log(`🚌 Fetching real bus data from RapidAPI...`);

    const response = await axios.get('https://bus-booking-api.p.rapidapi.com/search', {
      params: {
        source,
        destination,
        journey_date: date,
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'bus-booking-api.p.rapidapi.com',
      },
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`✅ Found ${response.data.length} real buses`);
      
      return response.data.map((bus: any) => ({
        mode: 'bus' as const,
        provider: bus.operator || bus.travels || 'Unknown',
        price: parseFloat(bus.fare || bus.price || '500'),
        duration: parseFloat(bus.duration || '8'),
        departureTime: bus.departure_time || bus.dept_time || '08:00',
        arrivalTime: bus.arrival_time || bus.arr_time || '16:00',
        stops: parseInt(bus.stops || '3'),
        carbonFootprint: Math.round((bus.distance || 300) * 0.068),
        amenities: bus.amenities || ['AC', 'Charging Points'],
      }));
    }

    return [];
  } catch (error: any) {
    console.error('❌ RapidAPI Bus Error:', error.message);
    return [];
  }
}

// Get mock train data (no free real-time train API available)
function getMockTrainData(distance: number): TransportOption[] {
  const trainTypes = [
    { name: 'Shat', speed: 85, pricePerKm: 0.8 },
    { name: 'Raj', speed: 75, pricePerKm: 1.2 },
    { name: 'Sup', speed: 65, pricePerKm: 0.6 },
    { name: 'Mail', speed: 55, pricePerKm: 0.4 },
  ];

  return trainTypes.map((train, idx) => {
    const duration = distance / train.speed;
    const price = distance * train.pricePerKm + 100;
    const departHour = 6 + (idx * 4);

    return {
      mode: 'train' as const,
      provider: train.name,
      price: Math.round(price),
      duration: parseFloat(duration.toFixed(2)),
      departureTime: `${departHour.toString().padStart(2, '0')}:00`,
      arrivalTime: calculateArrivalTime(`${departHour.toString().padStart(2, '0')}:00`, duration),
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.041),
      amenities: ['AC', 'Food Service', 'Charging Points'],
    };
  });
}

// Get mock bus data (fallback)
function getMockBusData(distance: number): TransportOption[] {
  const busOperators = [
    { name: 'VRL Travels', pricePerKm: 1.5 },
    { name: 'Paulo Travels', pricePerKm: 1.8 },
    { name: 'RedBus Partner', pricePerKm: 1.0 },
  ];

  return busOperators.map((bus, idx) => {
    const duration = distance / 50;
    const price = distance * bus.pricePerKm;
    const departHour = 19 + idx;

    return {
      mode: 'bus' as const,
      provider: bus.name,
      price: Math.round(price),
      duration: parseFloat(duration.toFixed(2)),
      departureTime: `${departHour.toString().padStart(2, '0')}:00`,
      arrivalTime: calculateArrivalTime(`${departHour.toString().padStart(2, '0')}:00`, duration),
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.068),
      amenities: ['AC', 'WiFi', 'Charging Points'],
    };
  });
}

// Get mock flight data (fallback)
function getMockFlightData(distance: number): TransportOption[] {
  if (distance < 200) return [];

  const airlines = [
    { name: 'IndiGo', multiplier: 1.0 },
    { name: 'Air India', multiplier: 1.15 },
    { name: 'SpiceJet', multiplier: 0.9 },
  ];

  return airlines.map((airline, idx) => {
    const duration = (distance / 800) + 1;
    const price = (2500 + (distance * 3)) * airline.multiplier;
    const departHour = 6 + (idx * 4);

    return {
      mode: 'flight' as const,
      provider: airline.name,
      price: Math.round(price),
      duration: parseFloat(duration.toFixed(2)),
      departureTime: `${departHour.toString().padStart(2, '0')}:00`,
      arrivalTime: calculateArrivalTime(`${departHour.toString().padStart(2, '0')}:00`, duration),
      stops: 0,
      carbonFootprint: Math.round(distance * 0.158),
      amenities: ['In-flight Entertainment', 'Meal'],
    };
  });
}

// MAIN FUNCTION: Get all transport options
export async function getAllTransportOptions(
  source: string,
  destination: string,
  date: string
): Promise<TransportOption[]> {
  try {
    console.log(`\n🚗 Fetching ALL transport options: ${source} → ${destination}`);

    // Get coordinates and distance
    const sourceCoords = await getCityCoordinates(source);
    const destCoords = await getCityCoordinates(destination);

    if (!sourceCoords || !destCoords) {
      console.log('❌ Could not get coordinates');
      return [];
    }

    const distance = calculateDistance(
      sourceCoords.lat,
      sourceCoords.lon,
      destCoords.lat,
      destCoords.lon
    );

    console.log(`📏 Distance: ${distance.toFixed(2)} km`);

    const allOptions: TransportOption[] = [];

    // 1. Try to get REAL flight data
    const realFlights = await getRealFlightData(source, destination, date);
    if (realFlights.length > 0) {
      console.log(`✅ Using ${realFlights.length} real flights`);
      allOptions.push(...realFlights);
    } else {
      console.log('⚠️ No real flights, using mock data');
      allOptions.push(...getMockFlightData(distance));
    }

    // 2. Try to get REAL bus data
    const realBuses = await getRealBusData(source, destination, date);
    if (realBuses.length > 0) {
      console.log(`✅ Using ${realBuses.length} real buses`);
      allOptions.push(...realBuses);
    } else {
      console.log('⚠️ No real buses, using mock data');
      allOptions.push(...getMockBusData(distance));
    }

    // 3. Always use mock trains (no free API available)
    console.log('🚆 Using mock train data');
    allOptions.push(...getMockTrainData(distance));

    console.log(`✅ Total transport options: ${allOptions.length}`);
    
    // Add recommendations
    return addRecommendations(allOptions);

  } catch (error: any) {
    console.error('❌ Error in getAllTransportOptions:', error.message);
    return [];
  }
}

// Calculate recommendations
export function addRecommendations(options: TransportOption[]): TransportOption[] {
  if (options.length === 0) return options;

  const scoredOptions = options.map(option => {
    let score = 0;
    let reasons: string[] = [];

    // Price scoring
    const minPrice = Math.min(...options.map(o => o.price));
    const maxPrice = Math.max(...options.map(o => o.price));
    const priceScore = 1 - (option.price - minPrice) / (maxPrice - minPrice || 1);
    score += priceScore * 0.3;

    if (option.price <= minPrice * 1.2) {
      reasons.push('💰 Best value');
    }

    // Duration scoring
    const minDuration = Math.min(...options.map(o => o.duration));
    const maxDuration = Math.max(...options.map(o => o.duration));
    const durationScore = 1 - (option.duration - minDuration) / (maxDuration - minDuration || 1);
    score += durationScore * 0.35;

    if (option.duration <= minDuration * 1.1) {
      reasons.push('⚡ Fastest');
    }

    // Carbon footprint scoring
    if (option.carbonFootprint) {
      const minCarbon = Math.min(...options.filter(o => o.carbonFootprint).map(o => o.carbonFootprint!));
      if (option.carbonFootprint <= minCarbon * 1.2) {
        reasons.push('🌱 Eco-friendly');
      }
    }

    // Comfort scoring
    let comfortScore = 0;
    if (option.mode === 'flight') comfortScore = 0.9;
    else if (option.mode === 'train') comfortScore = 0.7;
    else if (option.mode === 'bus') comfortScore = 0.6;
    score += comfortScore * 0.2;

    return {
      ...option,
      score,
      recommendationReason: reasons.join(' • '),
    };
  });

  scoredOptions.sort((a, b) => b.score - a.score);

  scoredOptions[0].isRecommended = true;
  scoredOptions[0].recommendationReason = '🏆 Best Choice - ' + scoredOptions[0].recommendationReason;

  if (scoredOptions[1]) {
    scoredOptions[1].isRecommended = true;
    scoredOptions[1].recommendationReason = '⭐ Great Alternative - ' + scoredOptions[1].recommendationReason;
  }

  return scoredOptions;
}