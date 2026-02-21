import { NextRequest, NextResponse } from 'next/server';

// OSRM — free, no API key, worldwide coverage including India
const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

const PROFILES = ['driving', 'foot', 'bicycle'] as const;
type Profile = typeof PROFILES[number];

const PROFILE_NAMES: Record<Profile, string> = {
    driving: 'Drive',
    foot: 'Walk',
    bicycle: 'Bicycle',
};

const PROFILE_ICONS: Record<Profile, string> = {
    driving: 'car',
    foot: 'walk',
    bicycle: 'bike',
};

const PROFILE_COLORS: Record<Profile, string> = {
    driving: '#C75B39',
    foot: '#8B6D47',
    bicycle: '#40C9B0',
};

async function getOSRMRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, profile: Profile) {
    const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
    const url = `${OSRM_BASE}/${profile}/${coords}?overview=full&steps=true&geometries=geojson&annotations=true`;

    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`OSRM ${profile} error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.[0]) {
        return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Parse steps into a cleaner format
    const steps = (leg.steps || []).map((step: any) => ({
        instruction: step.maneuver?.type === 'depart' ? 'Start'
            : step.maneuver?.type === 'arrive' ? 'Arrive at destination'
                : `${capitalize(step.maneuver?.modifier || step.maneuver?.type || '')} on ${step.name || 'road'}`,
        name: step.name || '',
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
        maneuverType: step.maneuver?.type || '',
        maneuverModifier: step.maneuver?.modifier || '',
    })).filter((s: any) => s.distance > 10 || s.maneuverType === 'depart' || s.maneuverType === 'arrive');

    return {
        mode: profile,
        modeName: PROFILE_NAMES[profile],
        modeIcon: PROFILE_ICONS[profile],
        modeColor: PROFILE_COLORS[profile],
        totalDistance: Math.round(route.distance),
        totalDuration: Math.round(route.duration),
        steps,
        geometry: route.geometry,
        waypoints: data.waypoints?.map((wp: any) => ({
            name: wp.name || '',
            location: wp.location,
        })),
    };
}

function capitalize(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fromLat, fromLng, toLat, toLng, modes } = body;

        if (!fromLat || !fromLng || !toLat || !toLng) {
            return NextResponse.json({ error: 'Source and destination coordinates are required' }, { status: 400 });
        }

        const requestedModes: Profile[] = modes && modes.length > 0
            ? modes.filter((m: string) => PROFILES.includes(m as Profile))
            : ['driving', 'foot', 'bicycle'];

        console.log('🗺️ Route request:', { from: `${fromLat},${fromLng}`, to: `${toLat},${toLng}`, modes: requestedModes });

        // Fetch all modes in parallel
        const results = await Promise.allSettled(
            requestedModes.map(mode => getOSRMRoute(fromLat, fromLng, toLat, toLng, mode))
        );

        const routes = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value);

        if (routes.length === 0) {
            return NextResponse.json({ error: 'No routes found. The locations may not be reachable.' }, { status: 404 });
        }

        console.log(`✅ Found ${routes.length} routes`);
        return NextResponse.json({ routes });
    } catch (error: any) {
        console.error('❌ Route error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch routes' },
            { status: 500 }
        );
    }
}
