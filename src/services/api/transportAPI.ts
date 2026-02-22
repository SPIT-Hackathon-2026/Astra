import axios from 'axios';

export interface TransportOption {
  mode: 'flight' | 'train' | 'bus' | 'metro' | 'car' | 'bike';
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
  score?: number;
  recommendationReason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateArrivalTime(departureTime: string, durationHours: number): string {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Math.round(durationHours * 60);
  const arrivalHours = Math.floor(totalMinutes / 60) % 24;
  const arrivalMinutes = totalMinutes % 60;
  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
}

// Seasonal Price Adjustment Intelligence
function getSeasonalMultiplier(date: string): { multiplier: number; reason: string } {
  const month = new Date(date).getMonth();
  if (month >= 3 && month <= 5) return { multiplier: 1.25, reason: '📈 Summer Peak Pricing' };
  if (month >= 10 || month <= 0) return { multiplier: 1.35, reason: '🏔️ Winter Peak / Holiday Season' };
  if (month >= 6 && month <= 8) return { multiplier: 0.85, reason: '🌧️ Monsoon Discount' };
  return { multiplier: 1.0, reason: '✅ Standard Season Pricing' };
}

// ─── Coordinates ──────────────────────────────────────────────────────────────

export async function getCityCoordinates(
  city: string
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    console.log(`🔍 Getting coordinates for: ${city}`);
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: `${city}, India`, format: 'json', limit: 1, addressdetails: 1 },
      headers: { 'User-Agent': 'RadiatorRoutes-TripPlanner/1.0' },
    });
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      console.log(`✅ Found: ${result.display_name}`);
      return { lat: parseFloat(result.lat), lon: parseFloat(result.lon), displayName: result.display_name };
    }
    console.log(`❌ City not found: ${city}`);
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

// ─── Route Details ─────────────────────────────────────────────────────────────

export async function getRouteDetails(
  sourceLat: number,
  sourceLon: number,
  destLat: number,
  destLon: number,
  profile: 'car' | 'bike' = 'car'
): Promise<{ distance: number; duration: number; route: string } | null> {
  // Try OpenRouteService first
  if (process.env.OPENROUTE_API_KEY) {
    try {
      console.log('🗺️ Getting route via OpenRouteService...');
      const response = await axios.get(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          params: { start: `${sourceLon},${sourceLat}`, end: `${destLon},${destLat}` },
          headers: { Authorization: process.env.OPENROUTE_API_KEY },
        }
      );
      if (response.data?.features?.length > 0) {
        const route = response.data.features[0];
        return {
          distance: route.properties.segments[0].distance / 1000,
          duration: route.properties.segments[0].duration / 3600,
          route: JSON.stringify(route.geometry),
        };
      }
    } catch (err) {
      console.error('OpenRouteService error, falling back to OSRM:', err);
    }
  }

  // Fallback: OSRM
  try {
    console.log('🗺️ Getting route via OSRM...');
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/${profile}/${sourceLon},${sourceLat};${destLon},${destLat}`,
      { params: { overview: 'simplified', geometries: 'geojson', steps: false } }
    );
    if (response.data?.routes?.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.distance / 1000,
        duration: route.duration / 3600,
        route: JSON.stringify(route.geometry),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
}

// ─── Train Options ─────────────────────────────────────────────────────────────

export async function getTrainOptions(
  sourceCity: string,
  destCity: string,
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  const stationCodes: Record<string, string> = {
    mumbai: 'CSMT', pune: 'PUNE', delhi: 'NDLS', bangalore: 'SBC',
    chennai: 'MAS', kolkata: 'HWH', hyderabad: 'SC', ahmedabad: 'ADI',
    jaipur: 'JP', lucknow: 'LKO', goa: 'MAO', kochi: 'ERS',
    chandigarh: 'CDG', bhopal: 'BPL', indore: 'INDB', patna: 'PNBE',
    nagpur: 'NGP', surat: 'ST', vadodara: 'BRC', agra: 'AGC',
  };

  const sourceKey = Object.keys(stationCodes).find(k => sourceCity.toLowerCase().includes(k));
  const destKey = Object.keys(stationCodes).find(k => destCity.toLowerCase().includes(k));

  if (!sourceKey || !destKey) {
    console.log('⚠️ Train not available for this route');
    return [];
  }

  // Try RapidAPI IRCTC
  if (process.env.RAPIDAPI_KEY) {
    try {
      console.log(`🚆 Querying RapidAPI trains: ${stationCodes[sourceKey]} → ${stationCodes[destKey]}...`);
      const response = await axios.get('https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations', {
        params: {
          fromStationCode: stationCodes[sourceKey],
          toStationCode: stationCodes[destKey],
          dateOfJourney: new Date().toISOString().split('T')[0],
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
        },
        timeout: 10000,
      });
      if (response.data?.data?.length > 0) {
        console.log(`✅ Found ${response.data.data.length} real trains`);
        return response.data.data.slice(0, 5).map((train: any) => ({
          mode: 'train' as const,
          provider: `${train.train_name} (${train.train_number})`,
          price: Math.round(distance * 0.6 + 100),
          duration: parseFloat((parseInt(train.duration || '0') / 60).toFixed(1)) || distance / 60,
          departureTime: train.from_std || '06:00',
          arrivalTime: train.to_std || '10:00',
          stops: train.halt_count || Math.floor(distance / 100),
          carbonFootprint: Math.round(distance * 0.041),
          amenities: ['AC Sleeper', 'Pantry', 'Charging points', 'Real-time schedule'],
          distance: Math.round(distance),
        }));
      }
    } catch (err) {
      console.error('RapidAPI train error, using heuristic fallback:', err);
    }
  }

  // Heuristic fallback
  const trainTypes = [
    {
      name: 'Shatabdi/Vande Bharat Express', speed: 85, pricePerKm: 0.8,
      amenities: ['AC Chair Car', 'Meals included', 'WiFi', 'Premium comfort']
    },
    {
      name: 'Rajdhani Express', speed: 75, pricePerKm: 1.2,
      amenities: ['AC Sleeper', 'Meals included', 'Bedding', 'Premium service']
    },
    {
      name: 'Duronto/Superfast Express', speed: 65, pricePerKm: 0.6,
      amenities: ['AC 3-Tier', 'Pantry service', 'Charging points', 'Fast travel']
    },
    {
      name: 'Mail/Express', speed: 55, pricePerKm: 0.4,
      amenities: ['Sleeper/AC', 'Food available', 'Multiple stops', 'Budget friendly']
    },
  ];

  return trainTypes.map((t, idx) => {
    const dur = distance / t.speed;
    const price = distance * t.pricePerKm + 100;
    const departHour = 6 + idx * 4;
    return {
      mode: 'train' as const,
      provider: t.name,
      price: Math.round(price),
      duration: parseFloat(dur.toFixed(2)),
      departureTime: `${String(departHour).padStart(2, '0')}:00`,
      arrivalTime: calculateArrivalTime(`${String(departHour).padStart(2, '0')}:00`, dur),
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.041),
      amenities: t.amenities,
      distance: Math.round(distance),
    };
  });
}

// ─── Flight Options ────────────────────────────────────────────────────────────

export async function getFlightOptions(
  sourceCity: string,
  destCity: string,
  distance: number
): Promise<TransportOption[]> {
  const airportCodes: Record<string, string> = {
    mumbai: 'BOM', pune: 'PNQ', delhi: 'DEL', bangalore: 'BLR',
    chennai: 'MAA', kolkata: 'CCU', hyderabad: 'HYD', ahmedabad: 'AMD',
    goa: 'GOI', kochi: 'COK', jaipur: 'JAI', lucknow: 'LKO',
    chandigarh: 'IXC', bhopal: 'BHO', indore: 'IDR',
  };

  const sourceKey = Object.keys(airportCodes).find(k => sourceCity.toLowerCase().includes(k));
  const destKey = Object.keys(airportCodes).find(k => destCity.toLowerCase().includes(k));

  if (!sourceKey || !destKey) {
    console.log('⚠️ No major airport found for this route');
    return [];
  }

  if (distance < 300) {
    console.log('⚠️ Distance too short for flights');
    return [];
  }

  // Try Aviationstack API
  if (process.env.AVIATIONSTACK_API_KEY) {
    try {
      console.log(`✈️ Querying Aviationstack for ${airportCodes[sourceKey]} → ${airportCodes[destKey]}...`);
      const response = await axios.get('http://api.aviationstack.com/v1/flights', {
        params: {
          access_key: process.env.AVIATIONSTACK_API_KEY,
          dep_iata: airportCodes[sourceKey],
          arr_iata: airportCodes[destKey],
          limit: 5,
        },
        timeout: 10000,
      });
      if (response.data?.data?.length > 0) {
        console.log(`✅ Found ${response.data.data.length} real flights from Aviationstack`);
        return response.data.data.map((flight: any) => {
          const depTime = new Date(flight.departure.scheduled);
          const arrTime = new Date(flight.arrival.scheduled);
          const durationHrs = (arrTime.getTime() - depTime.getTime()) / (1000 * 60 * 60);
          return {
            mode: 'flight' as const,
            provider: `${flight.airline?.name || 'Unknown Airline'} - ${flight.flight?.iata || 'Flight'}`,
            price: Math.round(3500 + distance * 2.5),
            duration: parseFloat(durationHrs.toFixed(1)) || 2,
            departureTime: depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            arrivalTime: arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            stops: 0,
            carbonFootprint: Math.round(distance * 0.158),
            amenities: ['Real-time flight', 'Baggage allowance', 'In-flight service'],
            distance: Math.round(distance),
          };
        });
      }
    } catch (err) {
      console.error('Aviationstack error, using heuristic flights:', err);
    }
  }

  // Heuristic fallback
  const airlines = [
    { name: 'IndiGo', multiplier: 1.0 },
    { name: 'Air India', multiplier: 1.15 },
    { name: 'SpiceJet', multiplier: 0.9 },
    { name: 'Vistara', multiplier: 1.3 },
  ];

  return airlines.map((airline, idx) => {
    const dur = distance / 800 + 1;
    const price = (2500 + distance * 3) * airline.multiplier;
    const departHour = 6 + idx * 3;
    return {
      mode: 'flight' as const,
      provider: airline.name,
      price: Math.round(price),
      duration: parseFloat(dur.toFixed(2)),
      departureTime: `${String(departHour).padStart(2, '0')}:00`,
      arrivalTime: calculateArrivalTime(`${String(departHour).padStart(2, '0')}:00`, dur),
      stops: 0,
      carbonFootprint: Math.round(distance * 0.158),
      amenities: ['In-flight Entertainment', 'Meal', 'Baggage allowance'],
      distance: Math.round(distance),
    };
  });
}

// ─── Bus Options ───────────────────────────────────────────────────────────────

export async function getBusOptions(
  sourceCity: string,
  destCity: string,
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  if (distance < 50 || distance > 600) return [];

  const busOperators = [
    { name: 'VRL Travels', pricePerKm: 1.5 },
    { name: 'Paulo Travels', pricePerKm: 1.8 },
    { name: 'RedBus Partner', pricePerKm: 1.0 },
  ];

  return busOperators.map((bus, idx) => {
    const dur = distance / 50;
    const price = distance * bus.pricePerKm;
    const departHour = 19 + idx;
    return {
      mode: 'bus' as const,
      provider: bus.name,
      price: Math.round(price),
      duration: parseFloat(dur.toFixed(2)),
      departureTime: `${String(departHour).padStart(2, '0')}:00`,
      arrivalTime: calculateArrivalTime(`${String(departHour).padStart(2, '0')}:00`, dur),
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.068),
      amenities: ['AC', 'WiFi', 'Charging Points'],
      distance: Math.round(distance),
    };
  });
}

// ─── Metro Options ─────────────────────────────────────────────────────────────

export async function getMetroOptions(
  sourceCity: string,
  destCity: string,
  distance: number
): Promise<TransportOption[]> {
  const metroCities = [
    'delhi', 'mumbai', 'bangalore', 'kolkata', 'chennai',
    'hyderabad', 'pune', 'jaipur', 'kochi', 'lucknow',
    'noida', 'gurgaon', 'gurugram', 'nagpur', 'ahmedabad',
  ];

  const srcN = sourceCity.toLowerCase();
  const dstN = destCity.toLowerCase();
  const isSameCity =
    srcN === dstN ||
    (srcN.includes('noida') && dstN.includes('delhi')) ||
    (srcN.includes('delhi') && dstN.includes('noida')) ||
    (srcN.includes('gurgaon') && dstN.includes('delhi')) ||
    (srcN.includes('gurugram') && dstN.includes('delhi'));

  const hasMetro = metroCities.some(c => srcN.includes(c) || dstN.includes(c));

  if (!isSameCity || !hasMetro || distance > 50) return [];

  const metroDuration = distance / 35 + 0.5;
  const price = Math.min(10 + distance * 2, 60);

  console.log('🚇 Found metro option');
  return [{
    mode: 'metro' as const,
    provider: `${sourceCity} Metro Rail`,
    price: Math.round(price),
    duration: parseFloat(metroDuration.toFixed(2)),
    departureTime: 'Every 5-10 mins (6AM–11PM)',
    arrivalTime: `${Math.round(metroDuration * 60)} minutes`,
    stops: Math.floor(distance / 1.5),
    carbonFootprint: Math.round(distance * 0.02),
    amenities: ['AC coaches', 'Frequent service', 'Safe & clean', 'Disabled friendly'],
    distance: Math.round(distance),
  }];
}

// ─── Car Options ───────────────────────────────────────────────────────────────

export async function getCarOptions(
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  const carTypes = [
    { name: 'Self Drive / Own Car', pricePerKm: 4, amenities: ['Flexible timing', 'Privacy', 'Door-to-door'] },
    { name: 'Outstation Cab (Ola/Uber)', pricePerKm: 12, amenities: ['Professional driver', 'AC', 'Comfortable'] },
    { name: 'Shared Cab', pricePerKm: 7, amenities: ['Budget friendly', 'AC', 'Fixed route'] },
  ];

  return carTypes.map((car) => ({
    mode: 'car' as const,
    provider: car.name,
    price: Math.round(distance * car.pricePerKm),
    duration: parseFloat(duration.toFixed(2)),
    departureTime: 'Flexible',
    arrivalTime: `~${Math.round(duration * 60)} min`,
    stops: 0,
    carbonFootprint: Math.round(distance * 0.21),
    amenities: car.amenities,
    distance: Math.round(distance),
  }));
}

// ─── Bike Options ──────────────────────────────────────────────────────────────

export async function getBikeOptions(
  distance: number
): Promise<TransportOption[]> {
  if (distance > 100) return [];

  const bikeOptions = [
    { name: 'Royal Enfield (Rental)', pricePerDay: 1500 },
    { name: 'Activa/Scooty (Rental)', pricePerDay: 500 },
    { name: 'Electric Bike (Rental)', pricePerDay: 800 },
  ];

  return bikeOptions.map(bike => ({
    mode: 'bike' as const,
    provider: bike.name,
    price: bike.pricePerDay,
    duration: parseFloat((distance / 45).toFixed(2)),
    departureTime: 'Flexible Rental',
    arrivalTime: 'Self-picked',
    carbonFootprint: bike.name.includes('Electric') ? Math.round(distance * 0.01) : Math.round(distance * 0.05),
    amenities: ['Helmet included', 'Unlimited KMs', 'Flexible return', 'Roadside assistance'],
    distance: Math.round(distance),
  }));
}

// ─── Recommendations ───────────────────────────────────────────────────────────

export function addRecommendations(options: TransportOption[]): TransportOption[] {
  if (options.length === 0) return options;

  const minPrice = Math.min(...options.map(o => o.price));
  const maxPrice = Math.max(...options.map(o => o.price));
  const minDuration = Math.min(...options.map(o => o.duration));
  const maxDuration = Math.max(...options.map(o => o.duration));

  const scored = options.map(option => {
    let score = 0;
    const reasons: string[] = [];

    // Price (30%)
    const priceScore = 1 - (option.price - minPrice) / (maxPrice - minPrice || 1);
    score += priceScore * 0.3;
    if (option.price <= minPrice * 1.2) reasons.push('💰 Best value');

    // Speed (35%)
    const durationScore = 1 - (option.duration - minDuration) / (maxDuration - minDuration || 1);
    score += durationScore * 0.35;
    if (option.duration <= minDuration * 1.1) reasons.push('⚡ Fastest');

    // Eco (15%)
    if (option.carbonFootprint) {
      const minCarbon = Math.min(...options.filter(o => o.carbonFootprint).map(o => o.carbonFootprint!));
      if (option.carbonFootprint <= minCarbon * 1.2) reasons.push('🌱 Eco-friendly');
    }

    // Comfort (20%)
    const comfort: Record<string, number> = { flight: 0.9, train: 0.7, bus: 0.6, metro: 0.8, car: 0.75, bike: 0.5 };
    score += (comfort[option.mode] || 0.5) * 0.2;

    if (option.mode === 'train' && (option.stops || 0) < 3) reasons.push('🚆 Few stops');
    if (option.mode === 'flight' && option.stops === 0) reasons.push('✈️ Non-stop');
    if (option.mode === 'car') reasons.push('🚗 Flexible timing');
    if (option.mode === 'metro') reasons.push('🚇 No traffic');

    return { ...option, score, recommendationReason: reasons.join(' • ') };
  });

  scored.sort((a: any, b: any) => b.score - a.score);
  scored[0].isRecommended = true;
  scored[0].recommendationReason = '🏆 Best Choice — ' + scored[0].recommendationReason;
  if (scored[1]) {
    scored[1].isRecommended = true;
    scored[1].recommendationReason = '⭐ Great Alternative — ' + scored[1].recommendationReason;
  }

  return scored;
}

// ─── MAIN: Get All Transport Options ──────────────────────────────────────────

export async function getAllTransportOptions(
  source: string,
  destination: string,
  date: string
): Promise<TransportOption[]> {
  try {
    console.log(`\n🚗 Fetching ALL transport options: ${source} → ${destination}`);

    const seasonal = getSeasonalMultiplier(date);

    // Step 1: Get coordinates in parallel
    const [sourceCoords, destCoords] = await Promise.all([
      getCityCoordinates(source),
      getCityCoordinates(destination),
    ]);

    if (!sourceCoords || !destCoords) {
      console.log('❌ Could not get coordinates');
      return [];
    }

    // Step 2: Get route details for accurate distance & car duration
    const routeDetails = await getRouteDetails(
      sourceCoords.lat, sourceCoords.lon,
      destCoords.lat, destCoords.lon
    );

    const distance = routeDetails?.distance ||
      calculateDistance(sourceCoords.lat, sourceCoords.lon, destCoords.lat, destCoords.lon);
    const carDuration = routeDetails?.duration || distance / 60;

    console.log(`📏 Distance: ${distance.toFixed(2)} km`);

    // Step 3: Fetch all transport options in parallel
    console.log('\n📊 Fetching transport modes...');
    const [flights, trains, buses, metro, cars, bikes] = await Promise.all([
      getFlightOptions(source, destination, distance),
      getTrainOptions(source, destination, distance, carDuration),
      getBusOptions(source, destination, distance, carDuration),
      getMetroOptions(source, destination, distance),
      getCarOptions(distance, carDuration),
      getBikeOptions(distance),
    ]);

    // Step 4: Apply seasonal pricing
    const allOptions = [...flights, ...trains, ...buses, ...metro, ...cars, ...bikes].map(opt => ({
      ...opt,
      price: Math.round(opt.price * seasonal.multiplier),
      recommendationReason: opt.recommendationReason
        ? `${opt.recommendationReason} • ${seasonal.reason}`
        : seasonal.reason,
    }));

    // Step 5: Add recommendations
    const optionsWithRecommendations = addRecommendations(allOptions);

    console.log(`\n✅ TOTAL: ${optionsWithRecommendations.length} transport options found\n`);
    return optionsWithRecommendations;
  } catch (error: any) {
    console.error('❌ Error in getAllTransportOptions:', error.message);
    return [];
  }
}