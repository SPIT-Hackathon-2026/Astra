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

// Get actual route and duration using OSRM (FREE) or OpenRouteService (if key available)
export async function getRouteDetails(
  sourceLat: number,
  sourceLon: number,
  destLat: number,
  destLon: number,
  profile: 'car' | 'bike' = 'car'
): Promise<{ distance: number; duration: number; route: string } | null> {
  // Try OpenRouteService if key is available
  if (process.env.OPENROUTE_API_KEY) {
    try {
      console.log(`🗺️ Getting route via OpenRouteService...`);
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car`,
        {
          params: {
            start: `${sourceLon},${sourceLat}`,
            end: `${destLon},${destLat}`
          },
          headers: {
            'Authorization': process.env.OPENROUTE_API_KEY
          }
        }
      );

      if (response.data && response.data.features && response.data.features.length > 0) {
        const route = response.data.features[0];
        return {
          distance: route.properties.segments[0].distance / 1000,
          duration: route.properties.segments[0].duration / 3600,
          route: JSON.stringify(route.geometry)
        };
      }
    } catch (err) {
      console.error('OpenRouteService error, falling back to OSRM:', err);
    }
  }

  try {
    console.log(`🗺️ Getting route via OSRM...`);

    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/${profile}/${sourceLon},${sourceLat};${destLon},${destLat}`,
      {
        params: {
          overview: 'simplified',
          geometries: 'geojson',
          steps: false
        }
      }
    );

    if (!sourceCode || !destCode) {
      console.log('⚠️ No airport codes found for this route');
      return [];
    }

    return null;
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
}

// Get train options using Indian Railway Data
export async function getTrainOptions(
  sourceCity: string,
  destCity: string,
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  const trains: TransportOption[] = [];

  // Major train stations mapping
  const stationCodes: { [key: string]: string } = {
    'mumbai': 'CSMT/BCT',
    'pune': 'PUNE',
    'delhi': 'NDLS',
    'bangalore': 'SBC',
    'chennai': 'MAS',
    'kolkata': 'HWH',
    'hyderabad': 'SC',
    'ahmedabad': 'ADI',
    'jaipur': 'JP',
    'lucknow': 'LKO',
    'goa': 'MAO',
    'kochi': 'ERS',
    'chandigarh': 'CDG',
    'bhopal': 'BPL',
    'indore': 'INDB',
    'patna': 'PNBE',
    'nagpur': 'NGP',
    'surat': 'ST',
    'vadodara': 'BRC',
    'agra': 'AGC'
  };

  const sourceStation = Object.keys(stationCodes).find(key =>
    sourceCity.toLowerCase().includes(key)
  );
  const destStation = Object.keys(stationCodes).find(key =>
    destCity.toLowerCase().includes(key)
  );

  if (!sourceStation || !destStation) {
    console.log('⚠️ Train not available for this route');
    return [];
  }

  // If RapidAPI key is available, try to get real trains
  if (process.env.RAPIDAPI_KEY) {
    console.log(`🚆 Querying RapidAPI for trains: ${stationCodes[sourceStation]} → ${stationCodes[destStation]}...`);
    try {
      const response = await axios.get(`https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations`, {
        params: {
          fromStationCode: stationCodes[sourceStation],
          toStationCode: stationCodes[destStation],
          dateOfJourney: new Date().toISOString().split('T')[0] // Default to today
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'irctc1.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`✅ Found ${response.data.data.length} real trains from RapidAPI`);
        return response.data.data.slice(0, 5).map((train: any) => {
          const basePrice = distance * 0.6; // Price often not in this specific API call
          return {
            mode: 'train',
            provider: `${train.train_name} (${train.train_number})`,
            price: Math.round(basePrice + 100),
            duration: parseFloat((parseInt(train.duration || '0') / 60).toFixed(1)) || (distance / 60),
            departureTime: train.from_std || '00:00',
            arrivalTime: train.to_std || '00:00',
            stops: train.halt_count || Math.floor(distance / 100),
            carbonFootprint: Math.round(distance * 0.041),
            amenities: ['AC Sleeper', 'Pantry', 'Charging points', 'Real-time schedule'],
            distance: Math.round(distance)
          };
        });
      }
    } catch (err) {
      console.error('RapidAPI train error, falling back to heuristic:', err);
    }
  }

  // Calculate realistic train timings based on distance
  const trainTypes = [
    {
      name: 'Shatabdi/Vande Bharat Express',
      speed: 85,
      pricePerKm: 0.8,
      amenities: ['AC Chair Car', 'Meals included', 'WiFi', 'Premium comfort']
    },
    {
      name: 'Rajdhani Express',
      speed: 75,
      pricePerKm: 1.2,
      amenities: ['AC Sleeper', 'Meals included', 'Bedding', 'Premium service']
    },
    {
      name: 'Duronto/Superfast Express',
      speed: 65,
      pricePerKm: 0.6,
      amenities: ['AC 3-Tier', 'Pantry service', 'Charging points', 'Fast travel']
    },
    {
      name: 'Mail/Express',
      speed: 55,
      pricePerKm: 0.4,
      amenities: ['Sleeper/AC', 'Food available', 'Multiple stops', 'Budget friendly']
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

  console.log(`🚆 Found ${trains.length} heuristic train options`);
  return trains;
}

    return [];
  }

  const flights: TransportOption[] = [];

  // Major airport codes
  const airportCodes: { [key: string]: string } = {
    'mumbai': 'BOM',
    'pune': 'PNQ',
    'delhi': 'DEL',
    'bangalore': 'BLR',
    'chennai': 'MAA',
    'kolkata': 'CCU',
    'hyderabad': 'HYD',
    'ahmedabad': 'AMD',
    'goa': 'GOI',
    'kochi': 'COK',
    'jaipur': 'JAI',
    'lucknow': 'LKO',
    'chandigarh': 'IXC',
    'bhopal': 'BHO',
    'indore': 'IDR'
  };

  const sourceCode = Object.keys(airportCodes).find(key =>
    sourceCity.toLowerCase().includes(key)
  );
  const destCode = Object.keys(airportCodes).find(key =>
    destCity.toLowerCase().includes(key)
  );

  if (!sourceCode || !destCode) {
    console.log('⚠️ No major airport found for this route');
    return [];
  }
}

  // If Aviationstack API key is available, try to get real flights
  if (process.env.AVIATIONSTACK_API_KEY) {
    console.log(`✈️ Querying Aviationstack for ${sourceCode} → ${destCode}...`);
    try {
      const response = await axios.get(`http://api.aviationstack.com/v1/flights`, {
        params: {
          access_key: process.env.AVIATIONSTACK_API_KEY,
          dep_iata: airportCodes[sourceCode],
          arr_iata: airportCodes[destCode],
          limit: 5
        },
        timeout: 10000
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        console.log(`✅ Found ${response.data.data.length} real flights from Aviationstack`);
        return response.data.data.map((flight: any) => {
          const depTime = new Date(flight.departure.scheduled);
          const arrTime = new Date(flight.arrival.scheduled);
          const durationHrs = (arrTime.getTime() - depTime.getTime()) / (1000 * 60 * 60);

          return {
            mode: 'flight',
            provider: `${flight.airline?.name || 'Unknown Airline'} - ${flight.flight?.iata || 'Flight'}`,
            price: Math.round(3500 + (distance * 2.5)), // Aviationstack doesn't provide price in free tier
            duration: parseFloat(durationHrs.toFixed(1)) || 2,
            departureTime: depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            arrivalTime: arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            stops: 0,
            carbonFootprint: Math.round(distance * 0.158),
            amenities: ['Real-time flight', 'Baggage allowance', 'In-flight service'],
            distance: Math.round(distance)
          };
        });
      }
    } catch (err) {
      console.error('Aviationstack error, falling back to heuristic flights:', err);
    }
  }

  const airlines = [
    { name: 'IndiGo', priceMultiplier: 1.0 },
    { name: 'Air India', priceMultiplier: 1.15 },
    { name: 'SpiceJet', priceMultiplier: 0.9 },
    { name: 'Vistara', priceMultiplier: 1.3 },
    { name: 'GoAir', priceMultiplier: 0.85 }
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

  console.log(`✈️ Found ${flights.length} heuristic flight options`);
  return flights;
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

// Get metro options (only intra-city)
export async function getMetroOptions(
  sourceCity: string,
  destCity: string,
  distance: number
): Promise<TransportOption[]> {
  const metroCities = [
    'delhi', 'mumbai', 'bangalore', 'kolkata', 'chennai',
    'hyderabad', 'pune', 'jaipur', 'kochi', 'lucknow',
    'noida', 'gurgaon', 'gurugram', 'nagpur', 'ahmedabad', 'kanpur'
  ];

  // Check if same city and has metro
  const sourceNorm = sourceCity.toLowerCase();
  const destNorm = destCity.toLowerCase();

  const isSameCity = sourceNorm === destNorm ||
    (sourceNorm.includes('noida') && destNorm.includes('delhi')) ||
    (sourceNorm.includes('delhi') && destNorm.includes('noida')) ||
    (sourceNorm.includes('gurgaon') && destNorm.includes('delhi')) ||
    (sourceNorm.includes('gurugram') && destNorm.includes('delhi'));

  const hasMetro = metroCities.some(city =>
    sourceNorm.includes(city) || destNorm.includes(city)
  );

  if (!isSameCity || !hasMetro || distance > 50) {
    return [];
  }

  const metroDuration = (distance / 35) + 0.5; // 35 km/h + stops
  const price = Math.min(10 + (distance * 2), 60); // Max ₹60

  console.log(`🚇 Found metro option`);

  return [{
    mode: 'metro',
    provider: `${sourceCity} Metro Rail`,
    price: Math.round(price),
    duration: parseFloat(metroDuration.toFixed(2)),
    departureTime: 'Every 5-10 mins (6 AM - 11 PM)',
    arrivalTime: `${Math.round(metroDuration * 60)} minutes`,
    stops: Math.floor(distance / 1.5),
    carbonFootprint: Math.round(distance * 0.02),
    amenities: ['AC coaches', 'Frequent service', 'Safe & clean', 'Disabled friendly'],
    distance: Math.round(distance)
  }];
}

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

    // Step 3: Fetch all transport options in parallel
    console.log(`\n📊 Fetching transport modes...`);

    const [flights, trains, buses, metro, cars] = await Promise.all([
      getFlightOptions(source, destination, distance),
      getTrainOptions(source, destination, distance, carDuration),
      getBusOptions(source, destination, distance, carDuration),
      getMetroOptions(source, destination, distance),
      getCarOptions(distance, carDuration)
    ]);

    // At the end of getAllTransportOptions, before return:
    const allOptions = [...flights, ...trains, ...buses, ...metro, ...cars];

    // Add recommendations
    const optionsWithRecommendations = addRecommendations(allOptions);

    console.log(`\n✅ === TOTAL: ${optionsWithRecommendations.length} transport options found ===\n`);

    return optionsWithRecommendations;

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

    // Add mode-specific reasons
    if (option.mode === 'train' && option.stops && option.stops < 3) {
      reasons.push('🚆 Direct route with fewer stops');
    }
    if (option.mode === 'flight' && option.stops === 0) {
      reasons.push('✈️ Non-stop flight');
    }
    if (option.mode === 'car') {
      reasons.push('🚗 Flexible departure time');
    }
    if (option.mode === 'metro') {
      reasons.push('🚇 No traffic delays');
    }

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