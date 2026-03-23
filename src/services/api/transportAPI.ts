import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateArrivalTime(departureTime: string, durationHours: number): string {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Math.round(durationHours * 60);
  const arrivalHours = Math.floor(totalMinutes / 60) % 24;
  const arrivalMinutes = totalMinutes % 60;
  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
}

// ─── City Coordinates (Nominatim) ─────────────────────────────────────────────

export async function getCityCoordinates(
  city: string
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: `${city}, India`, format: 'json', limit: 1, addressdetails: 1 },
      headers: { 'User-Agent': 'RadiatorRoutes-TripPlanner/1.0' },
    });
    if (response.data && response.data.length > 0) {
      const r = response.data[0];
      return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName: r.display_name };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Route Details (OSRM) ─────────────────────────────────────────────────────

export async function getRouteDetails(
  sourceLat: number,
  sourceLon: number,
  destLat: number,
  destLon: number,
  profile: 'car' | 'bike' = 'car'
): Promise<{ distance: number; duration: number; route: string } | null> {
  if (process.env.OPENROUTE_API_KEY) {
    try {
      const res = await axios.get(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          params: { start: `${sourceLon},${sourceLat}`, end: `${destLon},${destLat}` },
          headers: { Authorization: process.env.OPENROUTE_API_KEY },
          timeout: 8000,
        }
      );
      if (res.data?.features?.length > 0) {
        const seg = res.data.features[0].properties.segments[0];
        return {
          distance: seg.distance / 1000,
          duration: seg.duration / 3600,
          route: JSON.stringify(res.data.features[0].geometry),
        };
      }
    } catch { /* fall through to OSRM */ }
  }

  try {
    const res = await axios.get(
      `https://router.project-osrm.org/route/v1/${profile}/${sourceLon},${sourceLat};${destLon},${destLat}`,
      { params: { overview: 'simplified', geometries: 'geojson' }, timeout: 8000 }
    );
    if (res.data?.routes?.length > 0) {
      const route = res.data.routes[0];
      return {
        distance: route.distance / 1000,
        duration: route.duration / 3600,
        route: JSON.stringify(route.geometry),
      };
    }
  } catch { /* ignore */ }

  return null;
}

// ─── Train Options ─────────────────────────────────────────────────────────────

export async function getTrainOptions(
  sourceCity: string,
  destCity: string,
  distance: number,
  _duration: number
): Promise<TransportOption[]> {
  const stationCodes: Record<string, string> = {
    mumbai: 'CSMT', pune: 'PUNE', delhi: 'NDLS', bangalore: 'SBC',
    chennai: 'MAS', kolkata: 'HWH', hyderabad: 'SC', ahmedabad: 'ADI',
    jaipur: 'JP', lucknow: 'LKO', goa: 'MAO', kochi: 'ERS',
    chandigarh: 'CDG', bhopal: 'BPL', indore: 'INDB', patna: 'PNBE',
    nagpur: 'NGP', surat: 'ST', vadodara: 'BRC', agra: 'AGC',
  };

  const srcKey = Object.keys(stationCodes).find(k => sourceCity.toLowerCase().includes(k));
  const dstKey = Object.keys(stationCodes).find(k => destCity.toLowerCase().includes(k));
  if (!srcKey || !dstKey) return [];

  // Try RapidAPI IRCTC
  if (process.env.RAPIDAPI_KEY) {
    try {
      const res = await axios.get('https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations', {
        params: {
          fromStationCode: stationCodes[srcKey],
          toStationCode: stationCodes[dstKey],
          dateOfJourney: new Date().toISOString().split('T')[0],
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
        },
        timeout: 10000,
      });
      if (res.data?.data?.length > 0) {
        return res.data.data.slice(0, 5).map((train: any) => ({
          mode: 'train' as const,
          provider: `${train.train_name} (${train.train_number})`,
          price: Math.round(distance * 0.6 + 100),
          duration: parseFloat((parseInt(train.duration || '0') / 60).toFixed(1)) || distance / 60,
          departureTime: train.from_std || '06:00',
          arrivalTime: train.to_std || '10:00',
          stops: train.halt_count || Math.floor(distance / 100),
          carbonFootprint: Math.round(distance * 0.041),
          amenities: ['AC Sleeper', 'Pantry', 'Charging points'],
          distance: Math.round(distance),
        }));
      }
    } catch { /* fallback */ }
  }

  // Heuristic fallback
  const trainTypes = [
    { name: 'Shatabdi/Vande Bharat', speed: 85, priceKm: 0.8, amenities: ['AC Chair Car', 'Meals', 'WiFi'] },
    { name: 'Rajdhani Express', speed: 75, priceKm: 1.2, amenities: ['AC Sleeper', 'Meals', 'Bedding'] },
    { name: 'Duronto / Superfast', speed: 65, priceKm: 0.6, amenities: ['AC 3-Tier', 'Pantry', 'Charging'] },
    { name: 'Mail / Express', speed: 55, priceKm: 0.4, amenities: ['Sleeper/AC', 'Food available'] },
  ];

  return trainTypes.map((t, idx) => {
    const dur = distance / t.speed;
    const dep = `${String(6 + idx * 4).padStart(2, '0')}:00`;
    return {
      mode: 'train' as const,
      provider: t.name,
      price: Math.round(distance * t.priceKm + 100),
      duration: parseFloat(dur.toFixed(2)),
      departureTime: dep,
      arrivalTime: calculateArrivalTime(dep, dur),
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.041),
      amenities: t.amenities,
      distance: Math.round(distance),
    };
  });
}

// ─── Flight Options ─────────────────────────────────────────────────────────────

export async function getFlightOptions(
  sourceCity: string,
  destCity: string,
  distance: number
): Promise<TransportOption[]> {
  if (distance < 300) return [];

  const airportCodes: Record<string, string> = {
    mumbai: 'BOM', pune: 'PNQ', delhi: 'DEL', bangalore: 'BLR',
    chennai: 'MAA', kolkata: 'CCU', hyderabad: 'HYD', ahmedabad: 'AMD',
    goa: 'GOI', kochi: 'COK', jaipur: 'JAI', lucknow: 'LKO',
    chandigarh: 'IXC', bhopal: 'BHO', indore: 'IDR',
  };

  const srcKey = Object.keys(airportCodes).find(k => sourceCity.toLowerCase().includes(k));
  const dstKey = Object.keys(airportCodes).find(k => destCity.toLowerCase().includes(k));
  if (!srcKey || !dstKey) return [];

  if (process.env.AVIATIONSTACK_API_KEY) {
    try {
      const res = await axios.get('http://api.aviationstack.com/v1/flights', {
        params: {
          access_key: process.env.AVIATIONSTACK_API_KEY,
          dep_iata: airportCodes[srcKey],
          arr_iata: airportCodes[dstKey],
          limit: 5,
        },
        timeout: 10000,
      });
      if (res.data?.data?.length > 0) {
        return res.data.data.map((flight: any) => {
          const dep = new Date(flight.departure.scheduled);
          const arr = new Date(flight.arrival.scheduled);
          const durHrs = (arr.getTime() - dep.getTime()) / (1000 * 60 * 60);
          return {
            mode: 'flight' as const,
            provider: `${flight.airline?.name || 'Airline'} ${flight.flight?.iata || ''}`,
            price: Math.round(3500 + distance * 2.5),
            duration: parseFloat(durHrs.toFixed(1)) || 2,
            departureTime: dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            arrivalTime: arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            stops: 0,
            carbonFootprint: Math.round(distance * 0.158),
            amenities: ['In-flight service', 'Baggage allowance'],
            distance: Math.round(distance),
          };
        });
      }
    } catch { /* fallback */ }
  }

  const airlines = [
    { name: 'IndiGo', mult: 1.0 },
    { name: 'Air India', mult: 1.15 },
    { name: 'SpiceJet', mult: 0.9 },
    { name: 'Vistara', mult: 1.3 },
  ];

  return airlines.map((a, idx) => {
    const dur = distance / 800 + 1;
    const dep = `${String(6 + idx * 3).padStart(2, '0')}:00`;
    return {
      mode: 'flight' as const,
      provider: a.name,
      price: Math.round((2500 + distance * 3) * a.mult),
      duration: parseFloat(dur.toFixed(2)),
      departureTime: dep,
      arrivalTime: calculateArrivalTime(dep, dur),
      stops: 0,
      carbonFootprint: Math.round(distance * 0.158),
      amenities: ['In-flight Entertainment', 'Meal', 'Baggage'],
      distance: Math.round(distance),
    };
  });
}

// ─── Bus Options ───────────────────────────────────────────────────────────────

export async function getBusOptions(
  _sourceCity: string,
  _destCity: string,
  distance: number,
  _duration: number
): Promise<TransportOption[]> {
  if (distance < 50 || distance > 600) return [];

  const operators = [
    { name: 'VRL Travels', priceKm: 1.5 },
    { name: 'Paulo Travels', priceKm: 1.8 },
    { name: 'RedBus Partner', priceKm: 1.0 },
  ];

  return operators.map((b, idx) => {
    const dur = distance / 50;
    const dep = `${String(19 + idx).padStart(2, '0')}:00`;
    return {
      mode: 'bus' as const,
      provider: b.name,
      price: Math.round(distance * b.priceKm),
      duration: parseFloat(dur.toFixed(2)),
      departureTime: dep,
      arrivalTime: calculateArrivalTime(dep, dur),
      stops: Math.floor(distance / 100),
      carbonFootprint: Math.round(distance * 0.068),
      amenities: ['AC', 'WiFi', 'Charging'],
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
  if (distance > 50) return [];

  const metroCities = ['delhi', 'mumbai', 'bangalore', 'kolkata', 'chennai',
    'hyderabad', 'pune', 'jaipur', 'kochi', 'lucknow', 'noida', 'gurgaon', 'gurugram', 'nagpur', 'ahmedabad'];

  const srcN = sourceCity.toLowerCase();
  const dstN = destCity.toLowerCase();
  const hasMetro = metroCities.some(c => srcN.includes(c) || dstN.includes(c));
  const isSameCity = srcN === dstN
    || (srcN.includes('noida') && dstN.includes('delhi'))
    || (srcN.includes('gurgaon') && dstN.includes('delhi'))
    || (srcN.includes('gurugram') && dstN.includes('delhi'));

  if (!hasMetro || !isSameCity) return [];

  const dur = distance / 35 + 0.5;
  return [{
    mode: 'metro' as const,
    provider: `${sourceCity} Metro Rail`,
    price: Math.round(Math.min(10 + distance * 2, 60)),
    duration: parseFloat(dur.toFixed(2)),
    departureTime: 'Every 5-10 min (6AM–11PM)',
    arrivalTime: `~${Math.round(dur * 60)} min`,
    stops: Math.floor(distance / 1.5),
    carbonFootprint: Math.round(distance * 0.02),
    amenities: ['AC coaches', 'Frequent service', 'Safe & clean'],
    distance: Math.round(distance),
  }];
}

// ─── Car Options ───────────────────────────────────────────────────────────────

export async function getCarOptions(
  distance: number,
  duration: number
): Promise<TransportOption[]> {
  return [
    { name: 'Self Drive / Own Car', priceKm: 4, amenities: ['Flexible timing', 'Privacy', 'Door-to-door'] },
    { name: 'Outstation Cab (Ola/Uber)', priceKm: 12, amenities: ['Professional driver', 'AC', 'Comfortable'] },
    { name: 'Shared Cab', priceKm: 7, amenities: ['Budget friendly', 'AC', 'Fixed route'] },
  ].map(car => ({
    mode: 'car' as const,
    provider: car.name,
    price: Math.round(distance * car.priceKm),
    duration: parseFloat(duration.toFixed(2)),
    departureTime: 'Flexible',
    arrivalTime: `~${Math.round(duration * 60)} min`,
    stops: 0,
    carbonFootprint: Math.round(distance * 0.21),
    amenities: car.amenities,
    distance: Math.round(distance),
  }));
}

// ─── MAIN: Get All Transport Options ──────────────────────────────────────────

export async function getAllTransportOptions(
  source: string,
  destination: string,
  date: string
): Promise<TransportOption[]> {
  try {
    console.log(`\n🚗 Transport options: ${source} → ${destination}`);

    const [srcCoords, dstCoords] = await Promise.all([
      getCityCoordinates(source),
      getCityCoordinates(destination),
    ]);

    if (!srcCoords || !dstCoords) {
      console.log('❌ Could not resolve coordinates');
      return [];
    }

    const distance = calculateDistance(srcCoords.lat, srcCoords.lon, dstCoords.lat, dstCoords.lon);
    console.log(`📏 Distance: ${distance.toFixed(1)} km`);

    const routeDetails = await getRouteDetails(srcCoords.lat, srcCoords.lon, dstCoords.lat, dstCoords.lon);
    const carDuration = routeDetails?.duration ?? distance / 60;

    const [flights, trains, buses, metro, cars] = await Promise.all([
      getFlightOptions(source, destination, distance),
      getTrainOptions(source, destination, distance, carDuration),
      getBusOptions(source, destination, distance, carDuration),
      getMetroOptions(source, destination, distance),
      getCarOptions(distance, carDuration),
    ]);

    const all = [...flights, ...trains, ...buses, ...metro, ...cars];
    const result = addRecommendations(all);
    console.log(`✅ ${result.length} options found`);
    return result;
  } catch (err: any) {
    console.error('❌ getAllTransportOptions:', err.message);
    return [];
  }
}

// ─── Recommendations ───────────────────────────────────────────────────────────

export function addRecommendations(options: TransportOption[]): TransportOption[] {
  if (options.length === 0) return options;

  const minPrice = Math.min(...options.map(o => o.price));
  const maxPrice = Math.max(...options.map(o => o.price));
  const minDur = Math.min(...options.map(o => o.duration));
  const maxDur = Math.max(...options.map(o => o.duration));

  const scored = options.map(option => {
    let score = 0;
    const reasons: string[] = [];

    const priceScore = 1 - (option.price - minPrice) / (maxPrice - minPrice || 1);
    score += priceScore * 0.3;
    if (option.price <= minPrice * 1.2) reasons.push('💰 Best value');

    const durScore = 1 - (option.duration - minDur) / (maxDur - minDur || 1);
    score += durScore * 0.35;
    if (option.duration <= minDur * 1.1) reasons.push('⚡ Fastest');

    if (option.carbonFootprint) {
      const minC = Math.min(...options.filter(o => o.carbonFootprint).map(o => o.carbonFootprint!));
      if (option.carbonFootprint <= minC * 1.2) reasons.push('🌱 Eco-friendly');
    }

    const comfort: Record<string, number> = { flight: 0.9, train: 0.7, bus: 0.6, metro: 0.8, car: 0.75 };
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
