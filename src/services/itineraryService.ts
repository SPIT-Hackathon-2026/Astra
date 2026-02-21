import { TouristSpot } from './api/touristAPI';

interface ItinerarySpot {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  travelTimeToNext?: number;
}

interface DayPlan {
  day: number;
  date: Date;
  spots: ItinerarySpot[];
  totalHours: number;
  warnings?: string[];
}

// Calculate travel time between two coordinates (in hours)
function calculateTravelTime(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Assume average speed of 30 km/h in city
  return distance / 30;
}

// Format time (e.g., 9:00 AM)
function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

// Build smart itinerary based on selected spots
export function buildSmartItinerary(
  selectedSpotNames: string[],
  allSpots: TouristSpot[],
  startDate: Date,
  endDate: Date,
  maxHoursPerDay: number = 12
): DayPlan[] {
  console.log('\n📅 === BUILDING SMART ITINERARY ===');
  console.log(`Selected spots: ${selectedSpotNames.length}`);
  console.log(`Max hours/day: ${maxHoursPerDay}`);

  // Get full spot details
  const selectedSpots = selectedSpotNames
    .map(name => allSpots.find(s => s.name === name))
    .filter(Boolean) as TouristSpot[];

  if (selectedSpots.length === 0) {
    console.log('⚠️ No spots selected');
    return [];
  }

  // Calculate number of days
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  console.log(`Trip duration: ${days} days`);

  const itinerary: DayPlan[] = [];
  const remainingSpots = [...selectedSpots];
  const startHour = 9; // Start day at 9 AM

  for (let day = 1; day <= days; day++) {
    if (remainingSpots.length === 0) break;

    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day - 1);

    const dayPlan: DayPlan = {
      day,
      date: currentDate,
      spots: [],
      totalHours: 0,
      warnings: [],
    };

    let currentHour = startHour;
    let lastSpot: TouristSpot | null = null;

    // Fill the day with spots
    while (remainingSpots.length > 0 && dayPlan.totalHours < maxHoursPerDay) {
      let nextSpot: TouristSpot;

      if (lastSpot && lastSpot.coordinates) {
        // Find closest spot
        const spotsWithDistance = remainingSpots
          .filter(s => s.coordinates)
          .map(spot => ({
            spot,
            distance: calculateTravelTime(
              lastSpot!.coordinates!.lat,
              lastSpot!.coordinates!.lng,
              spot.coordinates!.lat,
              spot.coordinates!.lng
            ),
          }))
          .sort((a, b) => a.distance - b.distance);

        nextSpot = spotsWithDistance[0]?.spot || remainingSpots[0];
      } else {
        // Take first spot
        nextSpot = remainingSpots[0];
      }

      // Calculate travel time from last spot
      let travelTime = 0;
      if (lastSpot && lastSpot.coordinates && nextSpot.coordinates) {
        travelTime = calculateTravelTime(
          lastSpot.coordinates.lat,
          lastSpot.coordinates.lng,
          nextSpot.coordinates.lat,
          nextSpot.coordinates.lng
        );
      }

      // Check if adding this spot exceeds day limit
      const totalTimeForSpot = nextSpot.estimatedTime + travelTime;

      if (dayPlan.totalHours + totalTimeForSpot > maxHoursPerDay) {
        // Check if it's reasonable to add (within 2 hours of limit)
        if (dayPlan.totalHours + totalTimeForSpot <= maxHoursPerDay + 2) {
          dayPlan.warnings = dayPlan.warnings || [];
          dayPlan.warnings.push(
            `⚠️ Day ${day} is packed (${(dayPlan.totalHours + totalTimeForSpot).toFixed(1)}h). Consider reducing spots.`
          );
        } else {
          // Too much, move to next day
          break;
        }
      }

      // Check if day is getting too long
      if (dayPlan.totalHours + totalTimeForSpot > 15) {
        dayPlan.warnings = dayPlan.warnings || [];
        dayPlan.warnings.push(
          `🚨 Day ${day} exceeds 15 hours! Strongly recommend reducing spots.`
        );
        break; // Don't add more spots
      }

      // Add spot to day
      const startTime = currentHour + travelTime;
      const endTime = startTime + nextSpot.estimatedTime;

      dayPlan.spots.push({
        name: nextSpot.name,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        duration: nextSpot.estimatedTime,
        travelTimeToNext: travelTime > 0.1 ? travelTime : undefined,
      });

      dayPlan.totalHours += totalTimeForSpot;
      currentHour = endTime;
      lastSpot = nextSpot;

      // Remove spot from remaining
      const index = remainingSpots.findIndex(s => s.name === nextSpot.name);
      remainingSpots.splice(index, 1);
    }

    // Add warnings if day is too light
    if (dayPlan.spots.length > 0 && dayPlan.totalHours < 4) {
      dayPlan.warnings = dayPlan.warnings || [];
      dayPlan.warnings.push(
        `💡 Day ${day} has light schedule (${dayPlan.totalHours.toFixed(1)}h). Consider adding more spots.`
      );
    }

    if (dayPlan.spots.length > 0) {
      itinerary.push(dayPlan);
      console.log(`Day ${day}: ${dayPlan.spots.length} spots (${dayPlan.totalHours.toFixed(1)}h)`);
    }
  }

  // Check if there are remaining spots
  if (remainingSpots.length > 0) {
    console.log(`\n⚠️ WARNING: ${remainingSpots.length} spots couldn't fit in ${days} days`);
    console.log('Remaining spots:', remainingSpots.map(s => s.name).join(', '));

    // Add warning to last day
    if (itinerary.length > 0) {
      itinerary[itinerary.length - 1].warnings =
        itinerary[itinerary.length - 1].warnings || [];
      itinerary[itinerary.length - 1].warnings!.push(
        `⚠️ ${remainingSpots.length} spots couldn't be scheduled. Consider extending trip or removing spots: ${remainingSpots.map(s => s.name).join(', ')}`
      );
    }
  }

  console.log(`✅ Created ${itinerary.length} days of itinerary\n`);

  return itinerary;
}

// Calculate total cost for selected spots
export function calculateAttractionCost(
  selectedSpotNames: string[],
  allSpots: TouristSpot[],
  travelers: number
): number {
  const selectedSpots = selectedSpotNames
    .map(name => allSpots.find(s => s.name === name))
    .filter(Boolean) as TouristSpot[];

  const totalFee = selectedSpots.reduce((sum, spot) => sum + (spot.entryFee || 0), 0);

  return totalFee * travelers;
}