import axios from 'axios';

export interface TransportOption {
  mode: 'flight' | 'train' | 'bus' | 'metro' | 'car';
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

// Get actual route and duration using OSRM (100% FREE routing engine)
export async function getRouteDetails(
  sourceLat: number,
  sourceLon: number,
  destLat: number,
  destLon: number,
  profile: 'car' | 'bike' = 'car'
): Promise<{ distance: number; duration: number; route: string } | null> {
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

  console.log(`🚆 Found ${trains.length} train options`);
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

  console.log(`✈️ Found ${flights.length} flight options`);
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
      console.log(`✅ Route found: ${distance.toFixed(0)} km, ${carDuration.toFixed(1)} hours by car`);
    } else {
      // Fallback to straight-line distance
      distance = calculateDistance(
        sourceCoords.lat,
        sourceCoords.lon,
        destCoords.lat,
        destCoords.lon
      );
      carDuration = distance / 60;
      console.log(`⚠️ Using straight-line distance: ${distance.toFixed(0)} km`);
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

    // Price factor (lower is better)
    const minPrice = Math.min(...options.map(o => o.price));
    const maxPrice = Math.max(...options.map(o => o.price));
    const priceScore = 1 - (option.price - minPrice) / (maxPrice - minPrice || 1);
    score += priceScore * 0.3; // 30% weight

    if (option.price <= minPrice * 1.2) {
      reasons.push('💰 Best value for money');
    }

    // Duration factor (shorter is better)
    const minDuration = Math.min(...options.map(o => o.duration));
    const maxDuration = Math.max(...options.map(o => o.duration));
    const durationScore = 1 - (option.duration - minDuration) / (maxDuration - minDuration || 1);
    score += durationScore * 0.35; // 35% weight

    if (option.duration <= minDuration * 1.1) {
      reasons.push('⚡ Fastest travel time');
    }

    // Carbon footprint (lower is better)
    if (option.carbonFootprint) {
      const minCarbon = Math.min(...options.filter(o => o.carbonFootprint).map(o => o.carbonFootprint!));
      const maxCarbon = Math.max(...options.filter(o => o.carbonFootprint).map(o => o.carbonFootprint!));
      const carbonScore = 1 - (option.carbonFootprint - minCarbon) / (maxCarbon - minCarbon || 1);
      score += carbonScore * 0.15; // 15% weight

      if (option.carbonFootprint <= minCarbon * 1.2) {
        reasons.push('🌱 Eco-friendly option');
      }
    }

    // Comfort factor (based on amenities and mode)
    let comfortScore = 0;
    if (option.mode === 'flight') comfortScore = 0.9;
    else if (option.mode === 'train') comfortScore = 0.7;
    else if (option.mode === 'car') comfortScore = 0.8;
    else if (option.mode === 'bus') comfortScore = 0.6;
    else if (option.mode === 'metro') comfortScore = 0.75;

    if (option.amenities && option.amenities.length > 3) {
      comfortScore += 0.1;
      reasons.push('✨ Premium amenities');
    }

    score += comfortScore * 0.2; // 20% weight

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

  // Sort by score
  scoredOptions.sort((a, b) => b.score - a.score);

  // Mark top 2 as recommended
  scoredOptions[0].isRecommended = true;
  if (scoredOptions.length > 1) {
    scoredOptions[1].isRecommended = true;
  }

  // Add ranking reasons
  if (scoredOptions[0]) {
    scoredOptions[0].recommendationReason = '🏆 Best Overall Choice - ' + scoredOptions[0].recommendationReason;
  }
  if (scoredOptions[1]) {
    scoredOptions[1].recommendationReason = '⭐ Great Alternative - ' + scoredOptions[1].recommendationReason;
  }

  return scoredOptions;
}