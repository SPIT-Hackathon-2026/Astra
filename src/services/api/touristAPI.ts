import axios from 'axios';

export interface TouristSpot {
  name: string;
  description: string;
  category: string;
  rating: number;
  estimatedTime: number;
  entryFee: number;
  bestTimeToVisit: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  image?: string;
  address?: string;
  openingHours?: string;
  popularity?: number;
  isPopular?: boolean;
}

// Get tourist spots using Overpass API 
export async function getTouristSpots(
  destination: string,
  interests?: string[]
): Promise<TouristSpot[]> {
  try {
    console.log(`\n === FETCHING TOURIST SPOTS ===`);
    console.log(`Destination: ${destination}`);
    console.log(`Interests: ${interests?.join(', ') || 'None'}`);

    // Step 1: Get city coordinates using Nominatim
    const geoResponse = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: `${destination}, India`,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'RadiatorRoutes-TripPlanner/1.0'
        }
      }
    );

    if (!geoResponse.data || geoResponse.data.length === 0) {
      console.log('❌ Destination not found');
      return [];
    }

    const { lat, lon } = geoResponse.data[0];
    console.log(`📍 Coordinates: ${lat}, ${lon}`);

    // Step 2: Build Overpass query based on interests
    const radius = 15000; // 15km radius

    let query = `
      [out:json][timeout:30];
      (
        node["tourism"](around:${radius},${lat},${lon});
        node["historic"](around:${radius},${lat},${lon});
        node["leisure"="park"](around:${radius},${lat},${lon});
        node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
        node["natural"](around:${radius},${lat},${lon});
        way["tourism"](around:${radius},${lat},${lon});
        way["historic"](around:${radius},${lat},${lon});
        way["leisure"="park"](around:${radius},${lat},${lon});
    `;

    // Add interest-specific filters
    if (interests && interests.length > 0) {
      if (interests.includes('beaches') || interests.includes('beach')) {
        query += `node["natural"="beach"](around:${radius},${lat},${lon});`;
      }
      if (interests.includes('museums') || interests.includes('museum')) {
        query += `node["tourism"="museum"](around:${radius},${lat},${lon});`;
      }
      if (interests.includes('temples') || interests.includes('religious')) {
        query += `node["amenity"="place_of_worship"](around:${radius},${lat},${lon});`;
      }
      if (interests.includes('nature') || interests.includes('parks')) {
        query += `node["leisure"="park"](around:${radius},${lat},${lon});`;
        query += `node["natural"="peak"](around:${radius},${lat},${lon});`;
      }
      if (interests.includes('shopping')) {
        query += `node["shop"="mall"](around:${radius},${lat},${lon});`;
      }
    }

    query += `
      );
      out body 100;
      >;
      out skel qt;
    `;

    // Step 3: Query APIs
    let elements: any[] = [];

    if (process.env.OPENTRIPMAP_API_KEY) {
      console.log(`🔍 Querying OpenTripMap API...`);
      try {
        const otmResponse = await axios.get(
          `https://api.opentripmap.com/0.1/en/places/radius`,
          {
            params: {
              radius: 15000,
              lon: lon,
              lat: lat,
              kinds: interests?.length ? interests.join(',') : 'interesting_places',
              format: 'json',
              apikey: process.env.OPENTRIPMAP_API_KEY
            },
            timeout: 10000
          }
        );

        if (otmResponse.data && Array.isArray(otmResponse.data)) {
          // OpenTripMap returns detailed info in a separate call or we can use what's there
          // For now, let's map what we have and maybe fetch details for top ones
          elements = otmResponse.data.map(item => ({
            tags: {
              name: item.name,
              tourism: item.kinds,
              rating: item.rate
            },
            lat: item.point.lat,
            lon: item.point.lon,
            xid: item.xid
          }));
        }
      } catch (err) {
        console.error('OpenTripMap error, falling back to Overpass:', err);
      }
    }

    if (elements.length === 0) {
      console.log(`🔍 Querying Overpass API... (Fallback)`);
      const overpassResponse = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        {
          headers: {
            'Content-Type': 'text/plain'
          },
          timeout: 25000
        }
      );
      elements = overpassResponse.data.elements || [];
    }

    const spots: TouristSpot[] = [];
    console.log(`📦 Received ${elements.length} raw elements`);

    // Step 4: Process elements
    const seenNames = new Set<string>();

    for (const element of elements) {
      if (!element.tags || !element.tags.name) continue;

      // Skip duplicates
      if (seenNames.has(element.tags.name)) continue;
      seenNames.add(element.tags.name);

      const category =
        element.tags.tourism ||
        element.tags.historic ||
        element.tags.leisure ||
        element.tags.amenity ||
        element.tags.natural ||
        'attraction';

      // Skip non-tourist attractions
      if (category === 'hotel' || category === 'restaurant' || category === 'cafe') {
        continue;
      }

      // Estimate time based on category
      let estimatedTime = 2;
      const catLower = category.toLowerCase();
      if (catLower.includes('museum') || catLower.includes('gallery')) estimatedTime = 3;
      if (catLower.includes('park') || catLower.includes('garden')) estimatedTime = 2;
      if (catLower.includes('monument') || catLower.includes('memorial')) estimatedTime = 1.5;
      if (catLower.includes('beach')) estimatedTime = 3;
      if (catLower.includes('temple') || catLower.includes('church') || catLower.includes('mosque')) estimatedTime = 1;
      if (catLower.includes('viewpoint') || catLower.includes('attraction')) estimatedTime = 1;
      if (catLower.includes('fort') || catLower.includes('castle') || catLower.includes('palace')) estimatedTime = 2.5;

      // Generate description
      let description =
        element.tags.description ||
        element.tags['description:en'] ||
        element.tags.information ||
        element.tags.note ||
        `A popular ${category.replace(/_/g, ' ')} in ${destination}`;

      // Get opening hours
      const openingHours = element.tags.opening_hours ||
        element.tags['opening_hours:covid19'] ||
        (category.includes('park') ? '24/7' : 'Check timings');

      // Get entry fee
      let entryFee = 0;
      if (element.tags.fee === 'yes') {
        const feeText = element.tags['charge'] || element.tags['fee:amount'];
        if (feeText) {
          const match = feeText.match(/\d+/);
          if (match) entryFee = parseInt(match[0]);
        } else {
          // Default estimates
          if (catLower.includes('museum')) entryFee = 50;
          if (catLower.includes('fort') || catLower.includes('palace')) entryFee = 100;
          if (catLower.includes('zoo') || catLower.includes('aquarium')) entryFee = 150;
        }
      }

      // Get rating (default: 4.0)
      let rating = 4.0;
      if (element.tags.rating) {
        rating = parseFloat(element.tags.rating);
      } else if (element.tags['stars']) {
        rating = parseFloat(element.tags['stars']);
      }

      // Best time to visit
      let bestTimeToVisit = 'Anytime';
      if (catLower.includes('beach')) bestTimeToVisit = 'Evening (Sunset)';
      if (catLower.includes('temple') || catLower.includes('worship')) bestTimeToVisit = 'Morning';
      if (catLower.includes('market') || catLower.includes('shopping')) bestTimeToVisit = 'Evening';
      if (catLower.includes('viewpoint')) bestTimeToVisit = 'Sunrise/Sunset';
      if (catLower.includes('park')) bestTimeToVisit = 'Morning/Evening';

      spots.push({
        name: element.tags.name,
        description: description.substring(0, 250),
        category: category.replace(/_/g, ' '),
        rating,
        estimatedTime,
        entryFee,
        bestTimeToVisit,
        coordinates: {
          lat: element.lat || element.center?.lat || 0,
          lng: element.lon || element.center?.lon || 0
        },
        image: element.tags.image || element.tags.wikimedia_commons || undefined,
        address: [
          element.tags['addr:street'],
          element.tags['addr:city'],
          element.tags['addr:postcode']
        ].filter(Boolean).join(', ') || undefined,
        openingHours
      });
    }

    // Step 5: If we have too few spots, try Wikipedia API
    if (spots.length < 5) {
      console.log(`⚠️ Only ${spots.length} spots found, trying Wikipedia...`);
      const wikiSpots = await getWikipediaSpots(destination, lat, lon);
      spots.push(...wikiSpots);
    }

    // Remove duplicates by name
    const uniqueSpots = Array.from(
      new Map(spots.map(spot => [spot.name, spot])).values()
    );

    // After processing all spots, before returning:

    // Calculate popularity score
    spots.forEach(spot => {
      let popularity = 0;

      // Rating factor (40%)
      popularity += (spot.rating / 5) * 40;

      // Category factor (30%)
      const popularCategories = ['monument', 'museum', 'beach', 'temple', 'fort', 'palace', 'viewpoint'];
      const category = spot.category.toLowerCase();
      if (popularCategories.some(cat => category.includes(cat))) {
        popularity += 30;
      }

      // Description length (indication of importance) (20%)
      if (spot.description.length > 150) {
        popularity += 20;
      }

      // Has image (10%)
      if (spot.image) {
        popularity += 10;
      }

      spot.popularity = popularity;
      spot.isPopular = popularity >= 70; // Mark as popular if score >= 70
    });

    // Sort by popularity
    spots.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    console.log(`✅ Found ${spots.length} spots (${spots.filter(s => s.isPopular).length} popular)`);

    return spots.slice(0, 30);
  } catch (error) {
    console.error('❌ Error fetching tourist spots:', error);
    return [];
  }
}

// Fallback: Get spots from Wikipedia API
async function getWikipediaSpots(city: string, lat: number, lon: number): Promise<TouristSpot[]> {
  try {
    console.log(`📚 Fetching from Wikipedia...`);

    const response = await axios.get(
      `https://en.wikipedia.org/w/api.php`,
      {
        params: {
          action: 'query',
          list: 'geosearch',
          gsradius: 10000,
          gscoord: `${lat}|${lon}`,
          gslimit: 20,
          format: 'json',
          origin: '*'
        }
      }
    );

    const spots: TouristSpot[] = [];
    const pages = response.data.query?.geosearch || [];

    for (const page of pages) {
      // Get page details
      const detailResponse = await axios.get(
        `https://en.wikipedia.org/w/api.php`,
        {
          params: {
            action: 'query',
            prop: 'extracts|pageimages',
            exintro: true,
            explaintext: true,
            piprop: 'thumbnail',
            pithumbsize: 500,
            pageids: page.pageid,
            format: 'json',
            origin: '*'
          }
        }
      );

      const pageData = detailResponse.data.query?.pages?.[page.pageid];

      if (pageData && pageData.extract) {
        spots.push({
          name: page.title,
          description: pageData.extract.substring(0, 250),
          category: 'attraction',
          rating: 4.0,
          estimatedTime: 2,
          entryFee: 0,
          bestTimeToVisit: 'Anytime',
          coordinates: {
            lat: page.lat,
            lng: page.lon
          },
          image: pageData.thumbnail?.source
        });
      }
    }

    console.log(`✅ Found ${spots.length} spots from Wikipedia`);
    return spots;
  } catch (error) {
    console.error('Error fetching Wikipedia spots:', error);
    return [];
  }
}

// Get enriched description from Wikipedia
export async function enrichSpotWithWikipedia(spotName: string, city: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/w/api.php`,
      {
        params: {
          action: 'query',
          format: 'json',
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          titles: `${spotName}, ${city}`,
          redirects: 1,
          origin: '*'
        }
      }
    );

    const pages = response.data.query.pages;
    const page = Object.values(pages)[0] as any;

    return page.extract?.substring(0, 500) || '';
  } catch (error) {
    return '';
  }
}

// Get city coordinates (also exported for reuse)
export async function getCityCoordinates(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: `${city}, India`,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'RadiatorRoutes-TripPlanner/1.0'
        }
      }
    );

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}