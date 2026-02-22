import axios from 'axios';

export interface TransportOption {
  mode: 'flight' | 'train' | 'bus' | 'metro' | 'car' | 'bike';
  provider: string;
  price: number;
  duration: number; // in hours
  departureTime: string;
  arrivalTime: string;
  stops?: number;
  carbonFootprint?: number;
  amenities?: string[];
  distance?: number;
  route?: string;
  isRecommended?: boolean;
  score?: number;
  recommendationReason?: string;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get coordinates using Nominatim (100% FREE, no API key needed)
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

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.distance / 1000, // Convert to km
        duration: route.duration / 3600, // Convert to hours
        route: JSON.stringify(route.geometry)
      };
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
  ];

  trainTypes.forEach((train, idx) => {
    const trainDuration = distance / train.speed;
    const basePrice = distance * train.pricePerKm + 100;
    const departHour = 6 + (idx * 4);
    const arriveHour = (departHour + Math.ceil(trainDuration)) % 24;

    trains.push({
      mode: 'train',
      provider: `${train.name} (${stationCodes[sourceStation]} → ${stationCodes[destStation]})`,
      price: Math.round(basePrice),
      duration: parseFloat(trainDuration.toFixed(2)),
      departureTime: `${departHour.toString().padStart(2, '0')}:00`,
      arrivalTime: `${arriveHour.toString().padStart(2, '0')}:00`,
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.041),
      amenities: train.amenities,
      distance: Math.round(distance)
    });
  });

  console.log(`🚆 Found ${trains.length} heuristic train options`);
  return trains;
}

// Get flight options
export async function getFlightOptions(
  sourceCity: string,
  destCity: string,
  distance: number
): Promise<TransportOption[]> {
  // Only show flights for distances > 200km
  if (distance < 200) {
    console.log('⚠️ Distance too short for flights');
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

  // Calculate flight duration (avg speed: 800 km/h + 1 hour for boarding/taxi)
  const flightDuration = (distance / 800) + 1;
  const basePrice = 2500 + (distance * 3);

  airlines.slice(0, 3).forEach((airline, idx) => {
    const price = basePrice * airline.priceMultiplier;
    const departHour = 6 + (idx * 4);
    const arriveHour = (departHour + Math.ceil(flightDuration)) % 24;

    flights.push({
      mode: 'flight',
      provider: `${airline.name} (${airportCodes[sourceCode]} → ${airportCodes[destCode]})`,
      price: Math.round(price),
      duration: parseFloat(flightDuration.toFixed(2)),
      departureTime: `${departHour.toString().padStart(2, '0')}:00`,
      arrivalTime: `${arriveHour.toString().padStart(2, '0')}:00`,
      stops: 0,
      carbonFootprint: Math.round(distance * 0.158),
      amenities: ['Baggage allowance', 'In-flight service', 'Fast travel', 'Priority boarding'],
      distance: Math.round(distance)
    });
  });

  console.log(`✈️ Found ${flights.length} heuristic flight options`);
  return flights;
}

// Get bus options
export async function getBusOptions(
  sourceCity: string,
  destCity: string,
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  const buses: TransportOption[] = [];

  const busOperators = [
    { name: 'VRL Travels', type: 'AC Sleeper', pricePerKm: 1.5 },
    { name: 'Paulo Travels', type: 'Luxury Volvo', pricePerKm: 1.8 },
    { name: 'Neeta Travels', type: 'AC Seater', pricePerKm: 1.2 },
    { name: 'RedBus Partner', type: 'Semi-Sleeper', pricePerKm: 1.0 },
    { name: 'KPN Travels', type: 'Multi-Axle', pricePerKm: 1.4 }
  ];

  // Buses travel at ~50-60 km/h
  const busDuration = distance / 50;

  busOperators.slice(0, 3).forEach((bus, idx) => {
    const price = distance * bus.pricePerKm;
    const departHour = 19 + idx;
    const arriveHour = (departHour + Math.ceil(busDuration)) % 24;

    buses.push({
      mode: 'bus',
      provider: `${bus.name} - ${bus.type}`,
      price: Math.round(price),
      duration: parseFloat(busDuration.toFixed(2)),
      departureTime: `${departHour.toString().padStart(2, '0')}:00`,
      arrivalTime: `${arriveHour.toString().padStart(2, '0')}:00`,
      stops: Math.floor(distance / 100) + 1,
      carbonFootprint: Math.round(distance * 0.068),
      amenities: ['WiFi', 'Charging ports', 'Water', 'Rest stops', 'Clean washrooms'],
      distance: Math.round(distance)
    });
  });

  console.log(`🚌 Found ${buses.length} bus options`);
  return buses;
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

// Get car/taxi options
export async function getCarOptions(
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  const carOptions = [
    { name: 'Ola/Uber Sedan', pricePerKm: 12, speed: 60 },
    { name: 'Ola/Uber SUV', pricePerKm: 16, speed: 60 },
    { name: 'Self Drive (Zoomcar)', pricePerKm: 9, speed: 65 }
  ];

  const cars: TransportOption[] = carOptions.map(car => ({
    mode: 'car',
    provider: car.name,
    price: Math.round(distance * car.pricePerKm + 100), // Base fare
    duration: parseFloat((distance / car.speed).toFixed(2)),
    departureTime: 'Anytime (24/7)',
    arrivalTime: `${(distance / car.speed).toFixed(1)} hours`,
    carbonFootprint: Math.round(distance * 0.192),
    amenities: ['Door-to-door', 'Flexible stops', 'Comfortable', 'Luggage space'],
    distance: Math.round(distance)
  }));

  console.log(`🚗 Found ${cars.length} car options`);
  return cars;
}

// Get bike rental options
export async function getBikeOptions(
  distance: number
): Promise<TransportOption[]> {
  // Only show bikes for short distances (< 100km)
  if (distance > 100) return [];

  const bikeOptions = [
    { name: 'Royal Enfield (Rental)', pricePerDay: 1500, mode: 'bike' as const },
    { name: 'Activa/Scoota (Rental)', pricePerDay: 500, mode: 'bike' as const },
    { name: 'Electric Bike (Rental)', pricePerDay: 800, mode: 'bike' as const }
  ];

  return bikeOptions.map(bike => ({
    mode: 'bike', // Corrected mode
    provider: bike.name,
    price: bike.pricePerDay, // Per day base
    duration: parseFloat((distance / 45).toFixed(2)), // Avg 45km/h for rentals
    departureTime: 'Flexible Rental',
    arrivalTime: 'Self-picked',
    carbonFootprint: bike.name.includes('Electric') ? Math.round(distance * 0.01) : Math.round(distance * 0.05),
    amenities: ['Helmet included', 'Unlimited KMs', 'Flexible return', 'Roadside assistance'],
    distance: Math.round(distance)
  }));
}

// Seasonal Price Adjustment Intelligence
function getSeasonalMultiplier(date: string): { multiplier: number; reason: string } {
  const month = new Date(date).getMonth();
  // Summer (April-June) and Winter (Nov-Jan) are peak in India
  if (month >= 3 && month <= 5) return { multiplier: 1.25, reason: '📈 Summer Peak Pricing' };
  if (month >= 10 || month <= 0) return { multiplier: 1.35, reason: '🏔️ Winter Peak / Holiday Season' };
  if (month >= 6 && month <= 8) return { multiplier: 0.85, reason: '🌧️ Monsoon Discount' };
  return { multiplier: 1.0, reason: '✅ Standard Season Pricing' };
}

// MAIN FUNCTION: Get all transport options
export async function getAllTransportOptions(
  source: string,
  destination: string,
  date: string
): Promise<TransportOption[]> {
  try {
    console.log(`\n🚀 === FETCHING TRANSPORT OPTIONS ===`);
    console.log(`Route: ${source} → ${destination}`);
    console.log(`Date: ${date}`);

    const seasonal = getSeasonalMultiplier(date);

    // Step 1: Get coordinates
    const [sourceCoords, destCoords] = await Promise.all([
      getCityCoordinates(source),
      getCityCoordinates(destination)
    ]);

    if (!sourceCoords || !destCoords) {
      console.error('❌ Could not find city coordinates');
      return [];
    }

    // Step 2: Get actual route details using OSRM
    const routeDetails = await getRouteDetails(
      sourceCoords.lat,
      sourceCoords.lon,
      destCoords.lat,
      destCoords.lon,
      'car'
    );

    let distance: number;
    let carDuration: number;

    if (routeDetails) {
      distance = routeDetails.distance;
      carDuration = routeDetails.duration;
    } else {
      distance = calculateDistance(sourceCoords.lat, sourceCoords.lon, destCoords.lat, destCoords.lon);
      carDuration = distance / 60;
    }

    // Step 3: Fetch all transport options in parallel
    const [flights, trains, buses, metro, cars, bikes] = await Promise.all([
      getFlightOptions(source, destination, distance),
      getTrainOptions(source, destination, distance, carDuration),
      getBusOptions(source, destination, distance, carDuration),
      getMetroOptions(source, destination, distance),
      getCarOptions(distance, carDuration),
      getBikeOptions(distance)
    ]);

    // Apply Seasonal Logic to all prices
    const allOptions = [...flights, ...trains, ...buses, ...metro, ...cars, ...bikes].map(opt => ({
      ...opt,
      price: Math.round(opt.price * seasonal.multiplier),
      recommendationReason: opt.recommendationReason ? `${opt.recommendationReason} • ${seasonal.reason}` : seasonal.reason
    }));

    // Add recommendations
    const optionsWithRecommendations = addRecommendations(allOptions);

    console.log(`\n✅ === TOTAL: ${optionsWithRecommendations.length} transport options found ===\n`);

    return optionsWithRecommendations;

  } catch (error) {
    console.error('❌ Error fetching transport options:', error);
    return [];
  }
}

// Calculate recommendation score and add reasons
export function addRecommendations(options: TransportOption[]): TransportOption[] {
  if (options.length === 0) return options;

  // Calculate scores for each option
  const scoredOptions = options.map(option => {
    let score = 0;
    let reasons: string[] = [];

    // 1. Price factor (30% weight)
    const minPrice = Math.min(...options.map(o => o.price));
    const maxPrice = Math.max(...options.map(o => o.price));
    const priceScore = 1 - (option.price - minPrice) / (maxPrice - minPrice || 1);
    score += priceScore * 0.3;

    if (option.price <= minPrice * 1.2) reasons.push('💰 Best value');

    // 2. Duration factor (30% weight)
    const minDuration = Math.min(...options.map(o => o.duration));
    const maxDuration = Math.max(...options.map(o => o.duration));
    const durationScore = 1 - (option.duration - minDuration) / (maxDuration - minDuration || 1);
    score += durationScore * 0.3;

    if (option.duration <= minDuration * 1.2) reasons.push('⚡ Fast');

    // 3. Convenience Factor (20% weight)
    let convenience = 0.5;
    if (option.mode === 'car') convenience = 0.9; // Door to door
    if (option.mode === 'flight') convenience = 0.8; // High end
    if (option.mode === 'train') convenience = 0.7;
    if (option.mode === 'bike') convenience = 0.6; // High effort but flexible
    score += convenience * 0.2;

    if (convenience >= 0.8) reasons.push('🛋️ High Convenience');

    // 4. Eco-friendly (20% weight)
    if (option.carbonFootprint) {
      const minCarbon = Math.min(...options.filter(o => o.carbonFootprint).map(o => o.carbonFootprint!));
      const carbonScore = option.carbonFootprint === 0 ? 1 : Math.min(1, minCarbon / option.carbonFootprint);
      score += carbonScore * 0.2;
      if (carbonScore > 0.8) reasons.push('🌱 Low Carbon');
    }

    return {
      ...option,
      score,
      recommendationReason: [option.recommendationReason, ...reasons].filter(Boolean).join(' • '),
    };
  });

  // Sort and pick top
  scoredOptions.sort((a, b) => (b.score || 0) - (a.score || 0));
  scoredOptions[0].isRecommended = true;
  scoredOptions[0].recommendationReason = '🏆 RECOMMENDED: ' + scoredOptions[0].recommendationReason;

  if (scoredOptions[1]) {
    scoredOptions[1].isRecommended = true;
    scoredOptions[1].recommendationReason = '⭐ TOP ALTERNATIVE: ' + scoredOptions[1].recommendationReason;
  }

  return scoredOptions;
}