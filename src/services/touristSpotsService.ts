import { getTouristSpots as fetchTouristSpots, TouristSpot } from './api/touristAPI';

export const getTouristSpots = async (
  destination: string,
  interests?: string[]
): Promise<TouristSpot[]> => {
  try {
    console.log(`\n🏖️ === TOURIST SPOTS SERVICE CALLED ===`);
    console.log(`Destination: ${destination}`);
    console.log(`Interests: ${interests?.join(', ') || 'None specified'}`);

    // Call the FREE API integration
    const spots = await fetchTouristSpots(destination, interests);

    console.log(`✅ Found ${spots.length} tourist spots`);

    // Filter by interests if provided
    if (interests && interests.length > 0) {
      const filtered = spots.filter(spot =>
        interests.some(interest =>
          spot.category.toLowerCase().includes(interest.toLowerCase()) ||
          spot.name.toLowerCase().includes(interest.toLowerCase()) ||
          spot.description.toLowerCase().includes(interest.toLowerCase())
        )
      );

      if (filtered.length > 0) {
        console.log(`🎯 Filtered to ${filtered.length} spots matching interests`);
        return filtered;
      }
    }

    return spots;

  } catch (error) {
    console.error('❌ Error in getTouristSpots:', error);
    return [];
  }
};

export const getRecommendedItinerary = (
  spots: TouristSpot[],
  days: number
): TouristSpot[][] => {
  console.log(`\n📅 === CREATING ITINERARY ===`);
  console.log(`Spots: ${spots.length} | Days: ${days}`);

  const hoursPerDay = 8; // 8 hours of sightseeing per day
  const itinerary: TouristSpot[][] = [];

  let currentDay: TouristSpot[] = [];
  let currentDayHours = 0;

  for (const spot of spots) {
    // If adding this spot exceeds daily limit, start new day
    if (currentDayHours + spot.estimatedTime <= hoursPerDay) {
      currentDay.push(spot);
      currentDayHours += spot.estimatedTime;
    } else {
      // Save current day and start new one
      if (currentDay.length > 0) {
        itinerary.push(currentDay);
      }
      currentDay = [spot];
      currentDayHours = spot.estimatedTime;
    }

    // Stop if we've filled all days
    if (itinerary.length >= days) {
      break;
    }
  }

  // Add last day if it has spots and we haven't reached day limit
  if (currentDay.length > 0 && itinerary.length < days) {
    itinerary.push(currentDay);
  }

  console.log(`✅ Created ${itinerary.length} days of itinerary`);
  itinerary.forEach((day, idx) => {
    const totalHours = day.reduce((sum, spot) => sum + spot.estimatedTime, 0);
    console.log(`  Day ${idx + 1}: ${day.length} spots (${totalHours}h)`);
  });

  return itinerary;
};

export type { TouristSpot };