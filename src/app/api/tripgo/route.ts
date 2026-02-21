import { NextRequest, NextResponse } from 'next/server';
import { buildTransitRoute } from '../../../lib/mumbai-transit';
import { buildIntercityRoutes } from '../../../lib/intercity-transit';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

function getTrafficMultiplier(hour: number, mode: string): number {
    if (mode === 'foot' || mode === 'cycling') return 1.0;
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) return mode === 'driving' ? 1.6 : 1.4;
    if (hour >= 11 && hour <= 16) return 1.15;
    if (hour >= 21 || hour <= 6) return 0.85;
    return 1.0;
}

function estimateFare(mode: string, distanceM: number, durationSec: number): number {
    const km = distanceM / 1000;
    switch (mode) {
        case 'drive': return Math.round(km * 8 + (km > 30 ? 150 : 0));
        case 'auto': return km <= 1.5 ? 23 : Math.round(23 + (km - 1.5) * 14.2);
        case 'cab': return Math.round(50 + km * 6 + (durationSec / 60) * 1.5);
        default: return 0;
    }
}

function getScores(mode: string) {
    switch (mode) {
        case 'drive': return { comfort: 9, safety: 7 };
        case 'auto': return { comfort: 5, safety: 5 };
        case 'cab': return { comfort: 8, safety: 8 };
        case 'bicycle': return { comfort: 4, safety: 4 };
        case 'walk': return { comfort: 3, safety: 6 };
        default: return { comfort: 6, safety: 7 };
    }
}

async function getOSRMRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, profile: string) {
    const url = `${OSRM_BASE}/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=false&steps=true&geometries=geojson`;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.[0]) return null;
        const route = data.routes[0];
        const leg = route.legs[0];
        const steps = (leg.steps || [])
            .filter((s: any) => s.distance > 20 || s.maneuver?.type === 'depart' || s.maneuver?.type === 'arrive')
            .map((s: any) => ({
                instruction: s.maneuver?.type === 'depart' ? 'Start'
                    : s.maneuver?.type === 'arrive' ? 'Arrive at destination'
                        : `${(s.maneuver?.modifier || s.maneuver?.type || '').replace(/^./, (c: string) => c.toUpperCase())} on ${s.name || 'road'}`,
                distance: Math.round(s.distance),
                duration: Math.round(s.duration),
            }));
        return { totalDistance: Math.round(route.distance), totalDuration: Math.round(route.duration), steps };
    } catch {
        return null;
    }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const dist = haversine(fromLat, fromLng, toLat, toLng) * 1.35;
    return {
        totalDistance: Math.round(dist), totalDuration: Math.round(dist / 11),
        steps: [
            { instruction: 'Start', distance: 0, duration: 0 },
            { instruction: 'Drive toward destination', distance: Math.round(dist), duration: Math.round(dist / 11) },
            { instruction: 'Arrive at destination', distance: 0, duration: 0 },
        ],
    };
}

export async function POST(req: NextRequest) {
    try {
        const { fromLat, fromLng, toLat, toLng } = await req.json();
        if (!fromLat || !fromLng || !toLat || !toLng) {
            return NextResponse.json({ error: 'Coordinates required' }, { status: 400 });
        }

        const straightDist = haversine(fromLat, fromLng, toLat, toLng);
        const isLongDistance = straightDist > 50000;
        const currentHour = new Date().getHours();
        const results: any[] = [];

        // 1. Local transit (within city)
        if (!isLongDistance) {
            const transitRoutes = buildTransitRoute(fromLat, fromLng, toLat, toLng);
            transitRoutes.forEach((tr, i) => {
                const trainLegs = tr.legs.filter(l => l.type === 'train');
                const totalStops = trainLegs.reduce((s, l) => s + (l.stops || 0), 0);
                const trainFare = totalStops <= 3 ? 5 : totalStops <= 8 ? 10 : 15;
                const autoFares = tr.legs.filter(l => l.type === 'auto').reduce((s, l) => s + (l.fare || 0), 0);
                results.push({
                    type: 'transit', mode: `transit-${i}`, modeName: 'Local Train',
                    modeColor: '#1a73e8', modeIcon: 'train',
                    totalDistance: Math.round(tr.totalDistance), totalDuration: tr.totalDuration * 60,
                    departureTime: tr.departureTime, arrivalTime: tr.arrivalTime,
                    summary: tr.summary, linesBadges: tr.linesBadges, legs: tr.legs,
                    fare: trainFare + autoFares, comfort: 6, safety: 7,
                });
            });
        }

        // 2. Intercity transit (long distance)
        if (isLongDistance) {
            const intercityRoutes = buildIntercityRoutes(fromLat, fromLng, toLat, toLng);
            intercityRoutes.forEach((ir, i) => {
                results.push({
                    type: 'transit', mode: `intercity-${ir.mainMode}-${i}`,
                    modeName: ir.mainMode === 'train' ? 'Train' : ir.mainMode === 'flight' ? 'Flight' : 'Bus',
                    modeColor: ir.mainMode === 'train' ? '#D93025' : ir.mainMode === 'flight' ? '#1A73E8' : '#0D904F',
                    modeIcon: ir.mainMode === 'train' ? 'train' : ir.mainMode === 'flight' ? 'plane' : 'bus',
                    totalDistance: Math.round(ir.totalDistance),
                    totalDuration: ir.totalDuration * 60,
                    departureTime: ir.departureTime, arrivalTime: ir.arrivalTime,
                    summary: ir.summary,
                    linesBadges: ir.legs.filter(l => l.lineCode).map(l => ({ code: l.lineCode!, color: l.lineColor || '#666' })),
                    legs: ir.legs, fare: ir.totalFare, comfort: ir.comfort, safety: ir.safety,
                });
            });
        }

        // 3. Drive
        const driveData = await getOSRMRoute(fromLat, fromLng, toLat, toLng, 'driving');
        const driveBase = driveData || estimateDriveRoute(fromLat, fromLng, toLat, toLng);
        const driveTraffic = getTrafficMultiplier(currentHour, 'driving');
        const driveDuration = Math.round(driveBase.totalDuration * driveTraffic);
        results.push({
            type: 'single', mode: 'drive', modeName: driveData ? 'Drive' : 'Drive (est.)',
            modeColor: '#3367D6', modeIcon: 'car',
            totalDistance: driveBase.totalDistance, totalDuration: driveDuration,
            steps: driveBase.steps, fare: estimateFare('drive', driveBase.totalDistance, driveDuration), ...getScores('drive'),
            trafficInfo: driveTraffic > 1.3 ? 'Heavy traffic' : driveTraffic > 1.1 ? 'Moderate traffic' : driveTraffic < 0.9 ? 'Light traffic' : 'Normal traffic',
        });

        // 4. Cab
        const cabDuration = Math.round(driveBase.totalDuration * driveTraffic * 1.05);
        results.push({
            type: 'single', mode: 'cab', modeName: 'Cab', modeColor: '#000000', modeIcon: 'cab',
            totalDistance: driveBase.totalDistance, totalDuration: cabDuration,
            steps: driveBase.steps, fare: estimateFare('cab', driveBase.totalDistance, cabDuration), ...getScores('cab'),
            trafficInfo: driveTraffic > 1.3 ? 'Heavy traffic' : 'Normal traffic',
        });

        // 5. Auto (short/medium only)
        if (!isLongDistance) {
            const autoDuration = Math.round(driveBase.totalDuration * driveTraffic * 1.2);
            results.push({
                type: 'single', mode: 'auto', modeName: 'Auto', modeColor: '#E8842A', modeIcon: 'auto',
                totalDistance: driveBase.totalDistance, totalDuration: autoDuration,
                steps: driveBase.steps, fare: estimateFare('auto', driveBase.totalDistance, autoDuration), ...getScores('auto'),
            });
        }

        // 6. Walk & Bicycle (short only)
        if (!isLongDistance) {
            const extras = await Promise.allSettled([
                straightDist < 10000 ? getOSRMRoute(fromLat, fromLng, toLat, toLng, 'foot') : Promise.resolve(null),
                straightDist < 30000 ? getOSRMRoute(fromLat, fromLng, toLat, toLng, 'cycling') : Promise.resolve(null),
            ]);
            const walkData = extras[0].status === 'fulfilled' ? extras[0].value : null;
            const bikeData = extras[1].status === 'fulfilled' ? extras[1].value : null;
            if (bikeData) results.push({ type: 'single', mode: 'bicycle', modeName: 'Bicycle', modeColor: '#0D904F', modeIcon: 'bike', ...bikeData, fare: 0, ...getScores('bicycle') });
            if (walkData) results.push({ type: 'single', mode: 'walk', modeName: 'Walk', modeColor: '#8B6D47', modeIcon: 'walk', ...walkData, fare: 0, ...getScores('walk') });
        }

        if (results.length === 0) {
            return NextResponse.json({ error: 'No routes found' }, { status: 404 });
        }
        return NextResponse.json({ routes: results });
    } catch (error: any) {
        console.error('Route error:', error.message);
        return NextResponse.json({ error: 'Failed to find routes. Please try again.' }, { status: 500 });
    }
}
