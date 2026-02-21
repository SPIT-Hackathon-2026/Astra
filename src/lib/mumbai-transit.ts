// Mumbai Local Train Station Data + Transit Routing Engine

export interface Station {
    name: string;
    lat: number;
    lng: number;
    line: 'western' | 'central' | 'harbour';
    index: number; // Position on line (for calculating stops between)
}

// Real Mumbai local train station coordinates
export const STATIONS: Station[] = [
    // ===== WESTERN LINE =====
    { name: 'Churchgate', lat: 18.9355, lng: 72.8278, line: 'western', index: 0 },
    { name: 'Marine Lines', lat: 18.9432, lng: 72.8234, line: 'western', index: 1 },
    { name: 'Charni Road', lat: 18.9515, lng: 72.8194, line: 'western', index: 2 },
    { name: 'Grant Road', lat: 18.9633, lng: 72.8152, line: 'western', index: 3 },
    { name: 'Mumbai Central', lat: 18.9693, lng: 72.8196, line: 'western', index: 4 },
    { name: 'Mahalaxmi', lat: 18.9825, lng: 72.8217, line: 'western', index: 5 },
    { name: 'Lower Parel', lat: 18.9930, lng: 72.8270, line: 'western', index: 6 },
    { name: 'Elphinstone', lat: 19.0005, lng: 72.8310, line: 'western', index: 7 },
    { name: 'Dadar', lat: 19.0180, lng: 72.8425, line: 'western', index: 8 },
    { name: 'Matunga Road', lat: 19.0271, lng: 72.8477, line: 'western', index: 9 },
    { name: 'Mahim', lat: 19.0426, lng: 72.8404, line: 'western', index: 10 },
    { name: 'Bandra', lat: 19.0544, lng: 72.8402, line: 'western', index: 11 },
    { name: 'Khar Road', lat: 19.0672, lng: 72.8367, line: 'western', index: 12 },
    { name: 'Santacruz', lat: 19.0804, lng: 72.8386, line: 'western', index: 13 },
    { name: 'Vile Parle', lat: 19.0980, lng: 72.8437, line: 'western', index: 14 },
    { name: 'Andheri', lat: 19.1197, lng: 72.8468, line: 'western', index: 15 },
    { name: 'Jogeshwari', lat: 19.1359, lng: 72.8492, line: 'western', index: 16 },
    { name: 'Ram Mandir', lat: 19.1470, lng: 72.8510, line: 'western', index: 17 },
    { name: 'Goregaon', lat: 19.1563, lng: 72.8494, line: 'western', index: 18 },
    { name: 'Malad', lat: 19.1726, lng: 72.8469, line: 'western', index: 19 },
    { name: 'Kandivali', lat: 19.1947, lng: 72.8468, line: 'western', index: 20 },
    { name: 'Borivali', lat: 19.2288, lng: 72.8564, line: 'western', index: 21 },
    { name: 'Dahisar', lat: 19.2437, lng: 72.8544, line: 'western', index: 22 },

    // ===== CENTRAL LINE =====
    { name: 'CSMT', lat: 18.9398, lng: 72.8355, line: 'central', index: 0 },
    { name: 'Masjid', lat: 18.9468, lng: 72.8393, line: 'central', index: 1 },
    { name: 'Sandhurst Road', lat: 18.9565, lng: 72.8415, line: 'central', index: 2 },
    { name: 'Byculla', lat: 18.9785, lng: 72.8332, line: 'central', index: 3 },
    { name: 'Chinchpokli', lat: 18.9860, lng: 72.8315, line: 'central', index: 4 },
    { name: 'Currey Road', lat: 18.9940, lng: 72.8340, line: 'central', index: 5 },
    { name: 'Parel', lat: 19.0060, lng: 72.8375, line: 'central', index: 6 },
    { name: 'Dadar Central', lat: 19.0183, lng: 72.8438, line: 'central', index: 7 },
    { name: 'Matunga', lat: 19.0271, lng: 72.8509, line: 'central', index: 8 },
    { name: 'Sion', lat: 19.0440, lng: 72.8622, line: 'central', index: 9 },
    { name: 'Kurla', lat: 19.0659, lng: 72.8792, line: 'central', index: 10 },
    { name: 'Vidyavihar', lat: 19.0789, lng: 72.8889, line: 'central', index: 11 },
    { name: 'Ghatkopar', lat: 19.0866, lng: 72.9081, line: 'central', index: 12 },
    { name: 'Vikhroli', lat: 19.1100, lng: 72.9265, line: 'central', index: 13 },
    { name: 'Kanjurmarg', lat: 19.1287, lng: 72.9340, line: 'central', index: 14 },
    { name: 'Bhandup', lat: 19.1486, lng: 72.9371, line: 'central', index: 15 },
    { name: 'Nahur', lat: 19.1564, lng: 72.9410, line: 'central', index: 16 },
    { name: 'Mulund', lat: 19.1727, lng: 72.9502, line: 'central', index: 17 },
    { name: 'Thane', lat: 19.1860, lng: 72.9756, line: 'central', index: 18 },

    // ===== HARBOUR LINE =====
    { name: 'CSMT Harbour', lat: 18.9398, lng: 72.8355, line: 'harbour', index: 0 },
    { name: 'Dockyard Road', lat: 18.9600, lng: 72.8450, line: 'harbour', index: 1 },
    { name: 'Reay Road', lat: 18.9685, lng: 72.8445, line: 'harbour', index: 2 },
    { name: 'Cotton Green', lat: 18.9778, lng: 72.8480, line: 'harbour', index: 3 },
    { name: 'Sewri', lat: 18.9914, lng: 72.8530, line: 'harbour', index: 4 },
    { name: 'Wadala', lat: 19.0180, lng: 72.8580, line: 'harbour', index: 5 },
    { name: 'GTB Nagar', lat: 19.0300, lng: 72.8628, line: 'harbour', index: 6 },
    { name: 'Chunabhatti', lat: 19.0439, lng: 72.8690, line: 'harbour', index: 7 },
    { name: 'Kurla Harbour', lat: 19.0650, lng: 72.8792, line: 'harbour', index: 8 },
    { name: 'Tilak Nagar', lat: 19.0643, lng: 72.8940, line: 'harbour', index: 9 },
    { name: 'Chembur', lat: 19.0622, lng: 72.8975, line: 'harbour', index: 10 },
    { name: 'Govandi', lat: 19.0570, lng: 72.9108, line: 'harbour', index: 11 },
    { name: 'Mankhurd', lat: 19.0490, lng: 72.9290, line: 'harbour', index: 12 },
    { name: 'Vashi', lat: 19.0670, lng: 72.9986, line: 'harbour', index: 13 },
    { name: 'Nerul', lat: 19.0301, lng: 73.0185, line: 'harbour', index: 14 },
    { name: 'Belapur', lat: 19.0225, lng: 73.0380, line: 'harbour', index: 15 },
];

// Transfer stations (stations where lines connect)
const TRANSFERS: Record<string, string[]> = {
    'Dadar': ['western', 'central'],
    'Dadar Central': ['central', 'western'],
    'Kurla': ['central', 'harbour'],
    'Kurla Harbour': ['harbour', 'central'],
    'CSMT': ['central', 'harbour'],
    'CSMT Harbour': ['harbour', 'central'],
};

// Line metadata
export const LINE_INFO: Record<string, { name: string; color: string; code: string }> = {
    western: { name: 'Western Railway', color: '#1a73e8', code: 'WR' },
    central: { name: 'Central Railway', color: '#d93025', code: 'CR' },
    harbour: { name: 'Harbour Line', color: '#0d904f', code: 'HL' },
};

// Haversine distance in meters
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find nearest stations to a point
export function findNearestStations(lat: number, lng: number, limit = 3): (Station & { distance: number })[] {
    return STATIONS
        .map(s => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
}

export interface TransitLeg {
    type: 'walk' | 'train' | 'auto';
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    duration: number; // minutes
    distance: number; // meters
    line?: string;
    lineColor?: string;
    lineCode?: string;
    stops?: number;
    serviceName?: string;
    frequency?: string;
    fare?: number;
}

export interface TransitRoute {
    legs: TransitLeg[];
    totalDuration: number;
    totalDistance: number;
    departureTime: string;
    arrivalTime: string;
    summary: string;
    linesBadges: { code: string; color: string }[];
}

// Build a transit route: walk → train → (transfer → train →) walk
export function buildTransitRoute(
    fromLat: number, fromLng: number,
    toLat: number, toLng: number,
): TransitRoute[] {
    const routes: TransitRoute[] = [];
    const now = new Date();

    // Find nearest stations to source and destination
    const nearSource = findNearestStations(fromLat, fromLng, 4);
    const nearDest = findNearestStations(toLat, toLng, 4);

    // Try direct routes on same line
    for (const src of nearSource) {
        for (const dst of nearDest) {
            if (src.line === dst.line && src.name !== dst.name) {
                const route = buildDirectRoute(fromLat, fromLng, toLat, toLng, src, dst, now);
                if (route) routes.push(route);
            }
        }
    }

    // Try routes with one transfer (e.g., Western → Central at Dadar)
    for (const src of nearSource) {
        for (const dst of nearDest) {
            if (src.line !== dst.line) {
                const transferRoutes = buildTransferRoute(fromLat, fromLng, toLat, toLng, src, dst, now);
                routes.push(...transferRoutes);
            }
        }
    }

    // Sort by total duration and deduplicate
    const seen = new Set<string>();
    return routes
        .sort((a, b) => a.totalDuration - b.totalDuration)
        .filter(r => {
            const key = r.legs.map(l => `${l.from.name}-${l.to.name}`).join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 4);
}

function buildDirectRoute(
    fromLat: number, fromLng: number, toLat: number, toLng: number,
    srcStation: Station & { distance: number },
    dstStation: Station & { distance: number },
    now: Date
): TransitRoute | null {
    const stops = Math.abs(srcStation.index - dstStation.index);
    if (stops === 0) return null;

    const walkToStation = Math.round(srcStation.distance); // meters
    const walkFromStation = Math.round(dstStation.distance); // meters
    const walkToTime = Math.round((walkToStation / 80)); // ~80m/min walking speed
    const walkFromTime = Math.round((walkFromStation / 80));
    const trainTime = stops * 2.5; // ~2.5 min per station avg for Mumbai locals
    const lineInfo = LINE_INFO[srcStation.line];

    const direction = srcStation.index < dstStation.index
        ? (srcStation.line === 'western' ? 'Churchgate to Virar' : srcStation.line === 'central' ? 'CSMT to Kalyan' : 'CSMT to Panvel')
        : (srcStation.line === 'western' ? 'Virar to Churchgate' : srcStation.line === 'central' ? 'Kalyan to CSMT' : 'Panvel to CSMT');

    const totalDuration = walkToTime + trainTime + walkFromTime;
    const departTime = new Date(now);
    const arriveTime = new Date(now.getTime() + totalDuration * 60000);

    const legs: TransitLeg[] = [];

    // Walk to station
    if (walkToStation > 50) {
        legs.push({
            type: 'walk',
            from: { name: 'Your location', lat: fromLat, lng: fromLng },
            to: { name: `${srcStation.name} Station`, lat: srcStation.lat, lng: srcStation.lng },
            duration: walkToTime,
            distance: walkToStation,
        });
    }

    // Train
    legs.push({
        type: 'train',
        from: { name: srcStation.name, lat: srcStation.lat, lng: srcStation.lng },
        to: { name: dstStation.name, lat: dstStation.lat, lng: dstStation.lng },
        duration: Math.round(trainTime),
        distance: haversine(srcStation.lat, srcStation.lng, dstStation.lat, dstStation.lng),
        line: srcStation.line,
        lineColor: lineInfo.color,
        lineCode: lineInfo.code,
        stops,
        serviceName: direction,
        frequency: 'every 3-5 min',
    });

    // Walk from station
    if (walkFromStation > 50) {
        legs.push({
            type: 'walk',
            from: { name: `${dstStation.name} Station`, lat: dstStation.lat, lng: dstStation.lng },
            to: { name: 'Destination', lat: toLat, lng: toLng },
            duration: walkFromTime,
            distance: walkFromStation,
        });
    }

    return {
        legs,
        totalDuration: Math.round(totalDuration),
        totalDistance: legs.reduce((s, l) => s + l.distance, 0),
        departureTime: formatTimeHM(departTime),
        arrivalTime: formatTimeHM(arriveTime),
        summary: `via ${srcStation.name} → ${dstStation.name} (${lineInfo.code})`,
        linesBadges: [{ code: `${lineInfo.code}`, color: lineInfo.color }],
    };
}

function buildTransferRoute(
    fromLat: number, fromLng: number, toLat: number, toLng: number,
    srcStation: Station & { distance: number },
    dstStation: Station & { distance: number },
    now: Date
): TransitRoute[] {
    const results: TransitRoute[] = [];

    // Find transfer points
    const transferStations = STATIONS.filter(s =>
        s.line === srcStation.line && TRANSFERS[s.name]?.includes(dstStation.line)
    );

    for (const transfer of transferStations) {
        // Find the corresponding station on the destination line
        const transferOnDstLine = STATIONS.find(s =>
            s.line === dstStation.line &&
            haversine(s.lat, s.lng, transfer.lat, transfer.lng) < 500
        );
        if (!transferOnDstLine) continue;

        const stops1 = Math.abs(srcStation.index - transfer.index);
        const stops2 = Math.abs(transferOnDstLine.index - dstStation.index);
        if (stops1 === 0 || stops2 === 0) continue;

        const walkToStation = Math.round(srcStation.distance);
        const walkFromStation = Math.round(dstStation.distance);
        const walkToTime = Math.round(walkToStation / 80);
        const walkFromTime = Math.round(walkFromStation / 80);
        const trainTime1 = stops1 * 2.5;
        const trainTime2 = stops2 * 2.5;
        const transferTime = 5; // 5 min transfer walk

        const lineInfo1 = LINE_INFO[srcStation.line];
        const lineInfo2 = LINE_INFO[dstStation.line];

        const totalDuration = walkToTime + trainTime1 + transferTime + trainTime2 + walkFromTime;
        const departTime = new Date(now);
        const arriveTime = new Date(now.getTime() + totalDuration * 60000);

        const legs: TransitLeg[] = [];

        if (walkToStation > 50) {
            legs.push({
                type: 'walk',
                from: { name: 'Your location', lat: fromLat, lng: fromLng },
                to: { name: `${srcStation.name} Station`, lat: srcStation.lat, lng: srcStation.lng },
                duration: walkToTime,
                distance: walkToStation,
            });
        }

        const dir1 = srcStation.index < transfer.index
            ? (srcStation.line === 'western' ? 'Churchgate to Virar' : 'CSMT to Kalyan')
            : (srcStation.line === 'western' ? 'Virar to Churchgate' : 'Kalyan to CSMT');

        legs.push({
            type: 'train',
            from: { name: srcStation.name, lat: srcStation.lat, lng: srcStation.lng },
            to: { name: transfer.name, lat: transfer.lat, lng: transfer.lng },
            duration: Math.round(trainTime1),
            distance: haversine(srcStation.lat, srcStation.lng, transfer.lat, transfer.lng),
            line: srcStation.line,
            lineColor: lineInfo1.color,
            lineCode: lineInfo1.code,
            stops: stops1,
            serviceName: dir1,
            frequency: 'every 3-5 min',
        });

        // Transfer walk
        legs.push({
            type: 'walk',
            from: { name: `${transfer.name} (${lineInfo1.code})`, lat: transfer.lat, lng: transfer.lng },
            to: { name: `${transferOnDstLine.name} (${lineInfo2.code})`, lat: transferOnDstLine.lat, lng: transferOnDstLine.lng },
            duration: transferTime,
            distance: 200,
        });

        const dir2 = transferOnDstLine.index < dstStation.index
            ? (dstStation.line === 'western' ? 'Churchgate to Virar' : dstStation.line === 'central' ? 'CSMT to Kalyan' : 'CSMT to Panvel')
            : (dstStation.line === 'western' ? 'Virar to Churchgate' : dstStation.line === 'central' ? 'Kalyan to CSMT' : 'Panvel to CSMT');

        legs.push({
            type: 'train',
            from: { name: transferOnDstLine.name, lat: transferOnDstLine.lat, lng: transferOnDstLine.lng },
            to: { name: dstStation.name, lat: dstStation.lat, lng: dstStation.lng },
            duration: Math.round(trainTime2),
            distance: haversine(transferOnDstLine.lat, transferOnDstLine.lng, dstStation.lat, dstStation.lng),
            line: dstStation.line,
            lineColor: lineInfo2.color,
            lineCode: lineInfo2.code,
            stops: stops2,
            serviceName: dir2,
            frequency: 'every 3-5 min',
        });

        if (walkFromStation > 50) {
            legs.push({
                type: 'walk',
                from: { name: `${dstStation.name} Station`, lat: dstStation.lat, lng: dstStation.lng },
                to: { name: 'Destination', lat: toLat, lng: toLng },
                duration: walkFromTime,
                distance: walkFromStation,
            });
        }

        results.push({
            legs,
            totalDuration: Math.round(totalDuration),
            totalDistance: legs.reduce((s, l) => s + l.distance, 0),
            departureTime: formatTimeHM(departTime),
            arrivalTime: formatTimeHM(arriveTime),
            summary: `via ${transfer.name} (${lineInfo1.code} → ${lineInfo2.code})`,
            linesBadges: [
                { code: lineInfo1.code, color: lineInfo1.color },
                { code: lineInfo2.code, color: lineInfo2.color },
            ],
        });
    }

    return results;
}

function formatTimeHM(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
