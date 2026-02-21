import { getAllTransportOptions, TransportOption } from '../services/api/transportAPI';

export const getTransportOptions = async (
  source: string,
  destination: string,
  budget: number,
  date: Date
): Promise<TransportOption[]> => {
  try {
    console.log(`\n🚀 === TRANSPORT SERVICE CALLED ===`);
    console.log(`From: ${source} → To: ${destination}`);
    console.log(`Budget: ₹${budget} | Date: ${date.toISOString().split('T')[0]}`);

    // Call the FREE API integration
    const dateStr = date.toISOString().split('T')[0];
    const allOptions = await getAllTransportOptions(source, destination, dateStr);

    console.log(`✅ Found ${allOptions.length} transport options`);

    // Filter by budget
    const withinBudget = allOptions.filter(opt => opt.price <= budget);

    if (withinBudget.length === 0) {
      console.log(`⚠️ No options within budget ₹${budget}, showing all options`);
      return allOptions.slice(0, 10); // Show top 10
    }

    console.log(`✅ ${withinBudget.length} options within budget`);
    return withinBudget;

  } catch (error) {
    console.error('❌ Error in getTransportOptions:', error);
    return [];
  }
};

export const getBestOptions = (
  options: TransportOption[]
): { fastest: TransportOption | null; cheapest: TransportOption | null; recommended: TransportOption[] } => {
  if (options.length === 0) {
    return {
      fastest: null,
      cheapest: null,
      recommended: [],
    };
  }

  // Find fastest (by duration)
  const fastest = options.reduce((prev, curr) =>
    curr.duration < prev.duration ? curr : prev
  );

  // Find cheapest (by price)
  const cheapest = options.reduce((prev, curr) =>
    curr.price < prev.price ? curr : prev
  );

  // Recommended: Best balance of price, time, and carbon footprint
  const recommended = [...options]
    .sort((a, b) => {
      // Score = normalized (price/1000 + duration + carbonFootprint/100)
      const scoreA = (a.price / 1000) + a.duration + ((a.carbonFootprint || 0) / 100);
      const scoreB = (b.price / 1000) + b.duration + ((b.carbonFootprint || 0) / 100);
      return scoreA - scoreB;
    })
    .slice(0, 3); // Top 3 recommended

  console.log(`\n🏆 BEST OPTIONS:`);
  console.log(`⚡ Fastest: ${fastest.provider} (${fastest.mode}) - ${fastest.duration.toFixed(1)}h`);
  console.log(`💰 Cheapest: ${cheapest.provider} (${cheapest.mode}) - ₹${cheapest.price}`);
  console.log(`⭐ Recommended: ${recommended.length} options`);

  return { fastest, cheapest, recommended };
};

export type { TransportOption };