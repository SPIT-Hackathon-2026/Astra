interface TouristSpot {
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
  }
  
  const touristSpotsDatabase: Record<string, TouristSpot[]> = {
    goa: [
      {
        name: 'Baga Beach',
        description: 'Famous beach known for water sports and nightlife',
        category: 'Beach',
        rating: 4.5,
        estimatedTime: 3,
        entryFee: 0,
        bestTimeToVisit: 'Evening',
        coordinates: { lat: 15.5551, lng: 73.7516 },
      },
      {
        name: 'Fort Aguada',
        description: 'Historic 17th-century Portuguese fort with lighthouse',
        category: 'Historical',
        rating: 4.3,
        estimatedTime: 2,
        entryFee: 25,
        bestTimeToVisit: 'Morning',
        coordinates: { lat: 15.4909, lng: 73.7732 },
      },
      {
        name: 'Basilica of Bom Jesus',
        description: 'UNESCO World Heritage Site housing St. Francis Xavier',
        category: 'Religious',
        rating: 4.7,
        estimatedTime: 1.5,
        entryFee: 0,
        bestTimeToVisit: 'Morning',
        coordinates: { lat: 15.5008, lng: 73.9114 },
      },
      {
        name: 'Dudhsagar Falls',
        description: 'Spectacular four-tiered waterfall in the jungle',
        category: 'Nature',
        rating: 4.8,
        estimatedTime: 5,
        entryFee: 400,
        bestTimeToVisit: 'Monsoon Season',
        coordinates: { lat: 15.3144, lng: 74.3144 },
      },
      {
        name: 'Anjuna Flea Market',
        description: 'Vibrant weekly market with handicrafts and jewelry',
        category: 'Shopping',
        rating: 4.2,
        estimatedTime: 3,
        entryFee: 0,
        bestTimeToVisit: 'Wednesday',
        coordinates: { lat: 15.5739, lng: 73.7395 },
      },
      {
        name: 'Calangute Beach',
        description: 'Largest beach in North Goa, perfect for swimming',
        category: 'Beach',
        rating: 4.4,
        estimatedTime: 2.5,
        entryFee: 0,
        bestTimeToVisit: 'Afternoon',
        coordinates: { lat: 15.5437, lng: 73.7543 },
      },
      {
        name: 'Chapora Fort',
        description: 'Scenic fort offering panoramic views of Vagator Beach',
        category: 'Historical',
        rating: 4.3,
        estimatedTime: 1.5,
        entryFee: 0,
        bestTimeToVisit: 'Sunset',
        coordinates: { lat: 15.6008, lng: 73.7364 },
      },
      {
        name: 'Spice Plantation Tour',
        description: 'Guided tour through aromatic spice gardens',
        category: 'Nature',
        rating: 4.5,
        estimatedTime: 3,
        entryFee: 600,
        bestTimeToVisit: 'Morning',
        coordinates: { lat: 15.3167, lng: 74.0833 },
      },
    ],
    mumbai: [
      {
        name: 'Gateway of India',
        description: 'Iconic arch monument overlooking the Arabian Sea',
        category: 'Historical',
        rating: 4.6,
        estimatedTime: 1,
        entryFee: 0,
        bestTimeToVisit: 'Evening',
        coordinates: { lat: 18.9220, lng: 72.8347 },
      },
      {
        name: 'Marine Drive',
        description: 'Beautiful 3km long boulevard along the coast',
        category: 'Scenic',
        rating: 4.7,
        estimatedTime: 2,
        entryFee: 0,
        bestTimeToVisit: 'Sunset',
        coordinates: { lat: 18.9432, lng: 72.8236 },
      },
    ],
  };
  
  export const getTouristSpots = async (
    destination: string,
    interests?: string[]
  ): Promise<TouristSpot[]> => {
    let spots = touristSpotsDatabase[destination.toLowerCase()] || [];
  
    // Filter by interests if provided
    if (interests && interests.length > 0) {
      spots = spots.filter((spot) =>
        interests.some((interest) =>
          spot.category.toLowerCase().includes(interest.toLowerCase())
        )
      );
    }
  
    // Sort by rating
    spots.sort((a, b) => b.rating - a.rating);
  
    return spots;
  };
  
  export const getRecommendedItinerary = (
    spots: TouristSpot[],
    days: number
  ): TouristSpot[][] => {
    const hoursPerDay = 8; // Assumed touring hours per day
    const itinerary: TouristSpot[][] = [];
  
    let currentDay: TouristSpot[] = [];
    let currentDayHours = 0;
  
    for (const spot of spots) {
      if (currentDayHours + spot.estimatedTime <= hoursPerDay) {
        currentDay.push(spot);
        currentDayHours += spot.estimatedTime;
      } else {
        if (currentDay.length > 0) {
          itinerary.push(currentDay);
        }
        currentDay = [spot];
        currentDayHours = spot.estimatedTime;
      }
  
      if (itinerary.length >= days) {
        break;
      }
    }
  
    if (currentDay.length > 0 && itinerary.length < days) {
      itinerary.push(currentDay);
    }
  
    return itinerary;
  };