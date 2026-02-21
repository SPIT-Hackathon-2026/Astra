// Intercity routing: Trains, Flights, Buses across India

export interface CityNode {
    name: string;
    lat: number;
    lng: number;
    railwayStation?: { name: string; lat: number; lng: number };
    airport?: { name: string; code: string; lat: number; lng: number };
    busStand?: { name: string; lat: number; lng: number };
}

export interface IntercityConnection {
    from: string;
    to: string;
    mode: 'train' | 'flight' | 'bus';
    name: string;
    duration: number;
    fare: number;
    frequency: string;
    code?: string;
    comfort: number;
    safety: number;
}

export const CITIES: Record<string, CityNode> = {
    mumbai: {
        name: 'Mumbai', lat: 19.0760, lng: 72.8777,
        railwayStation: { name: 'Mumbai CSMT', lat: 18.9398, lng: 72.8355 },
        airport: { name: 'Chhatrapati Shivaji Airport', code: 'BOM', lat: 19.0896, lng: 72.8656 },
        busStand: { name: 'Mumbai Central Bus Depot', lat: 18.9690, lng: 72.8194 },
    },
    pune: {
        name: 'Pune', lat: 18.5204, lng: 73.8567,
        railwayStation: { name: 'Pune Junction', lat: 18.5285, lng: 73.8743 },
        airport: { name: 'Pune Airport', code: 'PNQ', lat: 18.5822, lng: 73.9197 },
        busStand: { name: 'Pune Station Bus Stand', lat: 18.5308, lng: 73.8744 },
    },
    delhi: {
        name: 'Delhi', lat: 28.7041, lng: 77.1025,
        railwayStation: { name: 'New Delhi Railway Station', lat: 28.6424, lng: 77.2197 },
        airport: { name: 'Indira Gandhi International', code: 'DEL', lat: 28.5562, lng: 77.1000 },
        busStand: { name: 'ISBT Kashmere Gate', lat: 28.6675, lng: 77.2284 },
    },
    bangalore: {
        name: 'Bangalore', lat: 12.9716, lng: 77.5946,
        railwayStation: { name: 'Bangalore City Junction', lat: 12.9778, lng: 77.5700 },
        airport: { name: 'Kempegowda International', code: 'BLR', lat: 13.1986, lng: 77.7066 },
        busStand: { name: 'Majestic Bus Stand', lat: 12.9770, lng: 77.5726 },
    },
    goa: {
        name: 'Goa', lat: 15.2993, lng: 74.1240,
        railwayStation: { name: 'Madgaon Junction', lat: 15.2765, lng: 73.9570 },
        airport: { name: 'Goa Airport', code: 'GOI', lat: 15.3808, lng: 73.8314 },
        busStand: { name: 'Kadamba Bus Stand', lat: 15.4004, lng: 73.8789 },
    },
    ahmedabad: {
        name: 'Ahmedabad', lat: 23.0225, lng: 72.5714,
        railwayStation: { name: 'Ahmedabad Junction', lat: 23.0266, lng: 72.6004 },
        airport: { name: 'Sardar Vallabhbhai Patel Airport', code: 'AMD', lat: 23.0772, lng: 72.6347 },
        busStand: { name: 'Geeta Mandir Bus Stand', lat: 23.0171, lng: 72.5897 },
    },
    jaipur: {
        name: 'Jaipur', lat: 26.9124, lng: 75.7873,
        railwayStation: { name: 'Jaipur Junction', lat: 26.9196, lng: 75.7878 },
        airport: { name: 'Jaipur Airport', code: 'JAI', lat: 26.8241, lng: 75.8122 },
        busStand: { name: 'Sindhi Camp Bus Stand', lat: 26.9190, lng: 75.7875 },
    },
    hyderabad: {
        name: 'Hyderabad', lat: 17.3850, lng: 78.4867,
        railwayStation: { name: 'Secunderabad Junction', lat: 17.4344, lng: 78.5013 },
        airport: { name: 'Rajiv Gandhi International', code: 'HYD', lat: 17.2403, lng: 78.4294 },
        busStand: { name: 'MGBS Bus Station', lat: 17.3784, lng: 78.4832 },
    },
    chennai: {
        name: 'Chennai', lat: 13.0827, lng: 80.2707,
        railwayStation: { name: 'Chennai Central', lat: 13.0826, lng: 80.2753 },
        airport: { name: 'Chennai Airport', code: 'MAA', lat: 12.9941, lng: 80.1709 },
        busStand: { name: 'CMBT Bus Stand', lat: 13.0479, lng: 80.2102 },
    },
    kolkata: {
        name: 'Kolkata', lat: 22.5726, lng: 88.3639,
        railwayStation: { name: 'Howrah Junction', lat: 22.5839, lng: 88.3420 },
        airport: { name: 'Netaji Subhas Chandra Bose Airport', code: 'CCU', lat: 22.6547, lng: 88.4467 },
        busStand: { name: 'Esplanade Bus Terminus', lat: 22.5614, lng: 88.3520 },
    },
    nagpur: {
        name: 'Nagpur', lat: 21.1458, lng: 79.0882,
        railwayStation: { name: 'Nagpur Junction', lat: 21.1486, lng: 79.0839 },
        airport: { name: 'Dr. Babasaheb Ambedkar Airport', code: 'NAG', lat: 21.0922, lng: 79.0473 },
        busStand: { name: 'Ganeshpeth Bus Stand', lat: 21.1507, lng: 79.0851 },
    },
    lucknow: {
        name: 'Lucknow', lat: 26.8467, lng: 80.9462,
        railwayStation: { name: 'Lucknow Charbagh', lat: 26.8339, lng: 80.9228 },
        airport: { name: 'Chaudhary Charan Singh Airport', code: 'LKO', lat: 26.7606, lng: 80.8893 },
        busStand: { name: 'Alambagh Bus Stand', lat: 26.8190, lng: 80.9178 },
    },
};

export const CONNECTIONS: IntercityConnection[] = [
    // MUMBAI ↔ PUNE
    { from: 'mumbai', to: 'pune', mode: 'train', name: 'Deccan Express', duration: 210, fare: 185, frequency: 'Daily', code: '11007', comfort: 6, safety: 8 },
    { from: 'mumbai', to: 'pune', mode: 'train', name: 'Shatabdi Express', duration: 180, fare: 640, frequency: 'Daily', code: '12027', comfort: 8, safety: 9 },
    { from: 'mumbai', to: 'pune', mode: 'train', name: 'Pragati Express', duration: 195, fare: 245, frequency: 'Daily', code: '12125', comfort: 7, safety: 8 },
    { from: 'mumbai', to: 'pune', mode: 'flight', name: 'IndiGo / Air India', duration: 55, fare: 3500, frequency: '6x daily', comfort: 9, safety: 10 },
    { from: 'mumbai', to: 'pune', mode: 'bus', name: 'MSRTC Shivneri', duration: 240, fare: 450, frequency: 'Every 30 min', comfort: 7, safety: 7 },
    { from: 'mumbai', to: 'pune', mode: 'bus', name: 'MSRTC Ordinary', duration: 300, fare: 250, frequency: 'Every 15 min', comfort: 4, safety: 6 },
    { from: 'pune', to: 'mumbai', mode: 'train', name: 'Deccan Express', duration: 210, fare: 185, frequency: 'Daily', code: '11008', comfort: 6, safety: 8 },
    { from: 'pune', to: 'mumbai', mode: 'train', name: 'Shatabdi Express', duration: 180, fare: 640, frequency: 'Daily', code: '12028', comfort: 8, safety: 9 },
    { from: 'pune', to: 'mumbai', mode: 'flight', name: 'IndiGo / Air India', duration: 55, fare: 3500, frequency: '6x daily', comfort: 9, safety: 10 },
    { from: 'pune', to: 'mumbai', mode: 'bus', name: 'MSRTC Shivneri', duration: 240, fare: 450, frequency: 'Every 30 min', comfort: 7, safety: 7 },
    // MUMBAI ↔ DELHI
    { from: 'mumbai', to: 'delhi', mode: 'train', name: 'Rajdhani Express', duration: 960, fare: 2120, frequency: 'Daily', code: '12951', comfort: 8, safety: 9 },
    { from: 'mumbai', to: 'delhi', mode: 'flight', name: 'Multiple Airlines', duration: 125, fare: 5500, frequency: '30+ daily', comfort: 9, safety: 10 },
    { from: 'delhi', to: 'mumbai', mode: 'train', name: 'Rajdhani Express', duration: 960, fare: 2120, frequency: 'Daily', code: '12952', comfort: 8, safety: 9 },
    { from: 'delhi', to: 'mumbai', mode: 'flight', name: 'Multiple Airlines', duration: 125, fare: 5500, frequency: '30+ daily', comfort: 9, safety: 10 },
    // MUMBAI ↔ GOA
    { from: 'mumbai', to: 'goa', mode: 'train', name: 'Konkan Kanya Express', duration: 720, fare: 560, frequency: 'Daily', code: '10111', comfort: 6, safety: 8 },
    { from: 'mumbai', to: 'goa', mode: 'flight', name: 'IndiGo / SpiceJet', duration: 70, fare: 4000, frequency: '8x daily', comfort: 9, safety: 10 },
    { from: 'mumbai', to: 'goa', mode: 'bus', name: 'Paulo/Neeta Travels', duration: 660, fare: 800, frequency: '10+ daily', comfort: 6, safety: 6 },
    { from: 'goa', to: 'mumbai', mode: 'train', name: 'Konkan Kanya Express', duration: 720, fare: 560, frequency: 'Daily', code: '10112', comfort: 6, safety: 8 },
    { from: 'goa', to: 'mumbai', mode: 'flight', name: 'IndiGo / SpiceJet', duration: 70, fare: 4000, frequency: '8x daily', comfort: 9, safety: 10 },
    // MUMBAI ↔ BANGALORE
    { from: 'mumbai', to: 'bangalore', mode: 'train', name: 'Udyan Express', duration: 1440, fare: 780, frequency: 'Daily', code: '11301', comfort: 6, safety: 8 },
    { from: 'mumbai', to: 'bangalore', mode: 'flight', name: 'Multiple Airlines', duration: 100, fare: 4500, frequency: '15+ daily', comfort: 9, safety: 10 },
    { from: 'bangalore', to: 'mumbai', mode: 'train', name: 'Udyan Express', duration: 1440, fare: 780, frequency: 'Daily', code: '11302', comfort: 6, safety: 8 },
    { from: 'bangalore', to: 'mumbai', mode: 'flight', name: 'Multiple Airlines', duration: 100, fare: 4500, frequency: '15+ daily', comfort: 9, safety: 10 },
    // MUMBAI ↔ AHMEDABAD
    { from: 'mumbai', to: 'ahmedabad', mode: 'train', name: 'Shatabdi Express', duration: 395, fare: 790, frequency: 'Daily', code: '12009', comfort: 8, safety: 9 },
    { from: 'mumbai', to: 'ahmedabad', mode: 'flight', name: 'IndiGo / GoAir', duration: 80, fare: 3800, frequency: '10+ daily', comfort: 9, safety: 10 },
    { from: 'ahmedabad', to: 'mumbai', mode: 'train', name: 'Shatabdi Express', duration: 395, fare: 790, frequency: 'Daily', code: '12010', comfort: 8, safety: 9 },
    { from: 'ahmedabad', to: 'mumbai', mode: 'flight', name: 'IndiGo / GoAir', duration: 80, fare: 3800, frequency: '10+ daily', comfort: 9, safety: 10 },
    // DELHI ↔ JAIPUR
    { from: 'delhi', to: 'jaipur', mode: 'train', name: 'Shatabdi Express', duration: 270, fare: 780, frequency: 'Daily', code: '12015', comfort: 8, safety: 9 },
    { from: 'delhi', to: 'jaipur', mode: 'bus', name: 'RSRTC Volvo', duration: 330, fare: 650, frequency: 'Every hour', comfort: 7, safety: 7 },
    { from: 'jaipur', to: 'delhi', mode: 'train', name: 'Shatabdi Express', duration: 270, fare: 780, frequency: 'Daily', code: '12016', comfort: 8, safety: 9 },
    // DELHI ↔ BANGALORE
    { from: 'delhi', to: 'bangalore', mode: 'train', name: 'Rajdhani Express', duration: 2040, fare: 2800, frequency: 'Weekly', code: '22691', comfort: 8, safety: 9 },
    { from: 'delhi', to: 'bangalore', mode: 'flight', name: 'Multiple Airlines', duration: 160, fare: 5000, frequency: '20+ daily', comfort: 9, safety: 10 },
    { from: 'bangalore', to: 'delhi', mode: 'flight', name: 'Multiple Airlines', duration: 160, fare: 5000, frequency: '20+ daily', comfort: 9, safety: 10 },
    // PUNE ↔ BANGALORE
    { from: 'pune', to: 'bangalore', mode: 'train', name: 'Bangalore Express', duration: 1200, fare: 650, frequency: 'Daily', code: '16529', comfort: 6, safety: 8 },
    { from: 'pune', to: 'bangalore', mode: 'flight', name: 'IndiGo / Air India', duration: 95, fare: 4000, frequency: '6x daily', comfort: 9, safety: 10 },
    // MUMBAI ↔ HYDERABAD
    { from: 'mumbai', to: 'hyderabad', mode: 'train', name: 'Hussainsagar Express', duration: 870, fare: 560, frequency: 'Daily', code: '12701', comfort: 6, safety: 8 },
    { from: 'mumbai', to: 'hyderabad', mode: 'flight', name: 'Multiple Airlines', duration: 90, fare: 4200, frequency: '12+ daily', comfort: 9, safety: 10 },
    // DELHI ↔ LUCKNOW
    { from: 'delhi', to: 'lucknow', mode: 'train', name: 'Shatabdi Express', duration: 375, fare: 1100, frequency: 'Daily', code: '12003', comfort: 8, safety: 9 },
    { from: 'delhi', to: 'lucknow', mode: 'flight', name: 'IndiGo / SpiceJet', duration: 70, fare: 3500, frequency: '8x daily', comfort: 9, safety: 10 },
    // MUMBAI ↔ CHENNAI
    { from: 'mumbai', to: 'chennai', mode: 'train', name: 'Chennai Express', duration: 1440, fare: 780, frequency: 'Daily', code: '12163', comfort: 6, safety: 8 },
    { from: 'mumbai', to: 'chennai', mode: 'flight', name: 'Multiple Airlines', duration: 115, fare: 4800, frequency: '10+ daily', comfort: 9, safety: 10 },
];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(lat: number, lng: number): { city: CityNode; key: string; distance: number } | null {
    let best: { city: CityNode; key: string; distance: number } | null = null;
    for (const [key, city] of Object.entries(CITIES)) {
        const d = haversine(lat, lng, city.lat, city.lng);
        if (!best || d < best.distance) best = { city, key, distance: d };
    }
    return best;
}

export interface IntercityLeg {
    type: 'walk' | 'auto' | 'cab' | 'train' | 'flight' | 'bus';
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    duration: number;
    distance: number;
    serviceName?: string;
    serviceCode?: string;
    frequency?: string;
    fare?: number;
    lineColor?: string;
    lineCode?: string;
}

export interface IntercityRoute {
    legs: IntercityLeg[];
    totalDuration: number;
    totalDistance: number;
    totalFare: number;
    departureTime: string;
    arrivalTime: string;
    summary: string;
    mainMode: 'train' | 'flight' | 'bus';
    comfort: number;
    safety: number;
}

const MODE_COLORS = { train: '#D93025', flight: '#1A73E8', bus: '#0D904F' };
const MODE_CODES = { train: 'RAIL', flight: 'FLY', bus: 'BUS' };

export function buildIntercityRoutes(fromLat: number, fromLng: number, toLat: number, toLng: number): IntercityRoute[] {
    const srcCity = findNearestCity(fromLat, fromLng);
    const dstCity = findNearestCity(toLat, toLng);
    if (!srcCity || !dstCity || srcCity.key === dstCity.key) return [];

    const connections = CONNECTIONS.filter(c => c.from === srcCity.key && c.to === dstCity.key);
    if (connections.length === 0) return [];

    const now = new Date();
    const routes: IntercityRoute[] = [];

    for (const conn of connections) {
        const legs: IntercityLeg[] = [];
        let totalFare = conn.fare;

        const hub = conn.mode === 'flight' ? srcCity.city.airport
            : conn.mode === 'train' ? srcCity.city.railwayStation : srcCity.city.busStand;
        const dstHub = conn.mode === 'flight' ? dstCity.city.airport
            : conn.mode === 'train' ? dstCity.city.railwayStation : dstCity.city.busStand;
        if (!hub || !dstHub) continue;

        // First mile cab
        const firstMileDist = haversine(fromLat, fromLng, hub.lat, hub.lng);
        if (firstMileDist > 200) {
            const dur = Math.max(5, Math.round(firstMileDist / 1000 / 20 * 60));
            const fare = Math.round(50 + (firstMileDist / 1000) * 6);
            totalFare += fare;
            legs.push({ type: 'cab', from: { name: 'Your location', lat: fromLat, lng: fromLng }, to: { name: hub.name, lat: hub.lat, lng: hub.lng }, duration: dur, distance: Math.round(firstMileDist), fare, lineColor: '#000', lineCode: 'CAB' });
        }

        // Check-in for flights
        if (conn.mode === 'flight') {
            legs.push({ type: 'walk', from: { name: hub.name, lat: hub.lat, lng: hub.lng }, to: { name: `${hub.name} Gate`, lat: hub.lat, lng: hub.lng }, duration: 90, distance: 500, lineCode: 'CHK' });
        }

        // Main leg
        legs.push({ type: conn.mode, from: { name: hub.name, lat: hub.lat, lng: hub.lng }, to: { name: dstHub.name, lat: dstHub.lat, lng: dstHub.lng }, duration: conn.duration, distance: haversine(hub.lat, hub.lng, dstHub.lat, dstHub.lng), serviceName: conn.name, serviceCode: conn.code, frequency: conn.frequency, fare: conn.fare, lineColor: MODE_COLORS[conn.mode], lineCode: MODE_CODES[conn.mode] });

        // Last mile cab
        const lastMileDist = haversine(dstHub.lat, dstHub.lng, toLat, toLng);
        if (lastMileDist > 200) {
            const dur = Math.max(5, Math.round(lastMileDist / 1000 / 20 * 60));
            const fare = Math.round(50 + (lastMileDist / 1000) * 6);
            totalFare += fare;
            legs.push({ type: 'cab', from: { name: dstHub.name, lat: dstHub.lat, lng: dstHub.lng }, to: { name: 'Destination', lat: toLat, lng: toLng }, duration: dur, distance: Math.round(lastMileDist), fare, lineColor: '#000', lineCode: 'CAB' });
        }

        const totalDuration = legs.reduce((s, l) => s + l.duration, 0);
        const arriveTime = new Date(now.getTime() + totalDuration * 60000);

        routes.push({
            legs, totalDuration, totalDistance: legs.reduce((s, l) => s + l.distance, 0), totalFare,
            departureTime: formatTime(now), arrivalTime: formatTime(arriveTime),
            summary: `${conn.name} (${conn.mode === 'train' ? conn.code : conn.mode === 'flight' ? 'Flight' : 'Bus'})`,
            mainMode: conn.mode, comfort: conn.comfort, safety: conn.safety,
        });
    }

    return routes.sort((a, b) => a.totalDuration - b.totalDuration);
}

function formatTime(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
