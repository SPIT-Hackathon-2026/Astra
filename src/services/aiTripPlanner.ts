interface TripPlanInput {
    source: string;
    destination: string;
    startDate: string;
    endDate: string;
    days: number;
    travelers: number;
    interests: string[];
    budgetType: string;
    travelStyle: string;
    pacePreference: string;
    accommodationType: string;
    specialRequirements: string[];
    travelCompanion: string;
    touristSpots: {
        name: string;
        category: string;
        rating: number;
        estimatedTime: number;
        entryFee: number;
        bestTimeToVisit: string;
        coordinates?: { lat: number; lng: number };
    }[];
}

interface AIItineraryDay {
    day: number;
    theme: string;
    activities: {
        time: string;
        title: string;
        description: string;
        type: 'visit' | 'food' | 'travel' | 'rest' | 'activity';
        duration: string;
        cost?: number;
        tip?: string;
    }[];
}

interface AITripResult {
    itinerary: AIItineraryDay[];
    tips: string[];
    summary: string;
}

export async function generateAIItinerary(input: TripPlanInput): Promise<AITripResult | null> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.log('⚠️ No GEMINI_API_KEY, using curated fallback');
        return generateFallbackItinerary(input);
    }

    try {
        const prompt = buildPrompt(input);
        console.log('🤖 Calling Gemini API for itinerary...');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.8,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', response.status, errText.substring(0, 200));
            return generateFallbackItinerary(input);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('No text in Gemini response');
            return generateFallbackItinerary(input);
        }

        console.log('✅ Gemini responded with itinerary');

        // Parse JSON - try direct parse first (since we asked for JSON mime type)
        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch {
            // Try extracting from code block
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('Could not parse JSON from AI response');
                return generateFallbackItinerary(input);
            }
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            parsed = JSON.parse(jsonStr);
        }

        // Validate the response has content
        if (!parsed.itinerary || parsed.itinerary.length === 0) {
            console.error('AI returned empty itinerary');
            return generateFallbackItinerary(input);
        }

        // Validate each day has activities
        const validItinerary = parsed.itinerary.filter(
            (d: any) => d.activities && d.activities.length > 0
        );

        if (validItinerary.length === 0) {
            console.error('AI returned days without activities');
            return generateFallbackItinerary(input);
        }

        console.log(`✅ AI generated ${validItinerary.length} days with activities`);

        return {
            itinerary: validItinerary,
            tips: parsed.tips || [],
            summary: parsed.summary || `A ${input.days}-day trip from ${input.source} to ${input.destination}`,
        };
    } catch (error: any) {
        console.error('AI itinerary generation failed:', error.message);
        return generateFallbackItinerary(input);
    }
}

function buildPrompt(input: TripPlanInput): string {
    const topSpots = input.touristSpots
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 15)
        .map(s => `- ${s.name} (${s.category}, Rating: ${s.rating}/5, ~${s.estimatedTime}h visit, Entry: ₹${s.entryFee}, Best time: ${s.bestTimeToVisit})`)
        .join('\n');

    return `You are an expert Indian travel planner. Create a detailed ${input.days}-day itinerary for a trip to ${input.destination}.

TRIP DETAILS:
- Route: ${input.source} → ${input.destination}
- Dates: ${input.startDate} to ${input.endDate} (${input.days} days)
- Travelers: ${input.travelers} (${input.travelCompanion})
- Budget: ${input.budgetType}
- Style: ${input.travelStyle}
- Pace: ${input.pacePreference} (${input.pacePreference === 'relaxed' ? '2-3 activities/day' : input.pacePreference === 'packed' ? '5-6 activities/day' : '3-4 activities/day'})
- Stay: ${input.accommodationType}
- Interests: ${input.interests.join(', ') || 'General sightseeing'}
- Special needs: ${input.specialRequirements.join(', ') || 'None'}

${topSpots ? `KNOWN ATTRACTIONS:\n${topSpots}\n` : ''}
CRITICAL REQUIREMENTS:
1. Use REAL, SPECIFIC place names in ${input.destination} — actual tourist spots, restaurants, landmarks, beaches, temples, markets, etc.
2. For meals, suggest REAL restaurant names or specific food streets/areas in ${input.destination} (e.g., "Breakfast at Café Mondegar, Colaba" or "Street food at Juhu Chowpatty")
3. Plan activities logically — sunrise spots early morning, indoor spots during midday heat, sunset viewpoints in evening
4. Each day MUST have 5-8 activities including: 1 breakfast, 2-3 sightseeing spots, 1 lunch, 1-2 afternoon activities, 1 dinner
5. Include travel time between locations
6. Day 1 should account for arrival; last day for departure
7. Include at least 1 hidden gem or local experience per day
8. Costs in INR (₹) appropriate for ${input.budgetType} budget
9. Each activity needs a practical "tip" field with insider advice

Generate this JSON:
{
  "summary": "Vivid 2-3 sentence trip overview mentioning key highlights",
  "itinerary": [
    {
      "day": 1,
      "theme": "Descriptive theme like 'Arrival & South Mumbai Heritage Walk'",
      "activities": [
        {
          "time": "06:30 AM",
          "title": "Specific Place Name",
          "description": "What to do there, what makes it special, what to see",
          "type": "visit",
          "duration": "1.5 hours",
          "cost": 0,
          "tip": "Useful insider tip for this specific place"
        }
      ]
    }
  ],
  "tips": ["8 specific travel tips for ${input.destination}"]
}

Activity types: "visit" (sightseeing), "food" (meals/cafes), "travel" (transit), "rest" (breaks), "activity" (experiences like boat rides, walks)

IMPORTANT: Every day must have real places and activities. Do NOT use generic text like "Local restaurant" or "Popular eatery". Use actual place names from ${input.destination}.`;
}

// ========= CURATED FALLBACK WITH REAL PLACES =========

const CITY_DATA: Record<string, {
    spots: { name: string; desc: string; type: 'visit' | 'activity'; time: string; cost: number; tip: string; bestTime: string }[];
    restaurants: Record<string, { name: string; desc: string; cost: number; tip: string }[]>;
    tips: string[];
}> = {
    mumbai: {
        spots: [
            { name: 'Gateway of India', desc: 'Iconic arch monument overlooking the Arabian Sea, built in 1924. Watch boats heading to Elephanta Caves.', type: 'visit', time: '1.5 hours', cost: 0, tip: 'Visit early morning for fewer crowds and great photos. Evening lighting is magical too.', bestTime: 'morning' },
            { name: 'Juhu Beach', desc: 'Famous beach with street food stalls, pav bhaji, and beautiful sunset views. Popular with locals and Bollywood stars.', type: 'visit', time: '2 hours', cost: 0, tip: 'Come for sunset and try the bhel puri from the stalls. Best from 4-7 PM.', bestTime: 'evening' },
            { name: 'Marine Drive (Queen\'s Necklace)', desc: 'Iconic 3km seafront promenade along the Arabian Sea. The crescent-shaped road lights up beautifully at night.', type: 'activity', time: '1.5 hours', cost: 0, tip: 'Walk from Nariman Point to Girgaon Chowpatty at sunset for the best experience.', bestTime: 'evening' },
            { name: 'Elephanta Caves', desc: 'UNESCO World Heritage Site with ancient rock-cut temples dedicated to Lord Shiva. Take a ferry from Gateway of India.', type: 'visit', time: '4 hours', cost: 500, tip: 'First ferry at 9 AM. Carry water. Boats don\'t run during monsoon.', bestTime: 'morning' },
            { name: 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya', desc: 'Grand museum with art, archaeology, and natural history collections in a beautiful Indo-Saracenic building.', type: 'visit', time: '2 hours', cost: 100, tip: 'Wednesday is half-price day. Audio guide available for ₹50.', bestTime: 'afternoon' },
            { name: 'Dhobi Ghat (Mahalaxmi Dhobi Ghat)', desc: 'World\'s largest open-air laundry. Over 700 workers wash clothes in concrete troughs. A unique Mumbai sight.', type: 'visit', time: '45 minutes', cost: 0, tip: 'View from the bridge near Mahalaxmi station. Best photos from the elevated walkway.', bestTime: 'morning' },
            { name: 'Colaba Causeway Market', desc: 'Bustling street market with antiques, clothes, jewelry, handicrafts, and street food. Great for bargain shopping.', type: 'activity', time: '2 hours', cost: 0, tip: 'Bargain hard — start at 30% of quoted price. Best visited after 10 AM.', bestTime: 'morning' },
            { name: 'Haji Ali Dargah', desc: 'Beautiful mosque and tomb situated on an islet in the Arabian Sea, connected by a narrow walkway. Stunning sunset views.', type: 'visit', time: '1 hour', cost: 0, tip: 'Accessible only during low tide. Check tide timings before visiting.', bestTime: 'afternoon' },
            { name: 'Bandra-Worli Sea Link', desc: 'Iconic cable-stayed bridge connecting Bandra and Worli. Drive across for spectacular views of the Mumbai skyline.', type: 'activity', time: '30 minutes', cost: 75, tip: 'Best experienced at dusk. Take a cab if you don\'t have your own vehicle.', bestTime: 'evening' },
            { name: 'Siddhivinayak Temple', desc: 'Famous Ganesh temple visited by millions. Beautiful architecture and spiritual atmosphere.', type: 'visit', time: '1 hour', cost: 0, tip: 'Visit on Tuesday for special darshan but expect huge crowds. Early morning on other days is peaceful.', bestTime: 'morning' },
            { name: 'Crawford Market (Mahatma Jyotiba Phule Mandai)', desc: 'Historic market built in 1869 with fruit, spice, and pet sections. Norman Gothic architecture.', type: 'visit', time: '1 hour', cost: 0, tip: 'Visit the fruit section for exotic varieties. Morning 7-10 AM is when it\'s freshest.', bestTime: 'morning' },
            { name: 'Bandstand Promenade & Bandra Fort', desc: 'Walk along the breezy Bandstand promenade, see Shah Rukh Khan\'s Mannat, and explore the old Portuguese fort ruins.', type: 'activity', time: '1.5 hours', cost: 0, tip: 'Great spot for sunset photos. The fort has unobstructed sea views.', bestTime: 'evening' },
        ],
        restaurants: {
            budget: [
                { name: 'Breakfast at Raju Vada Pav, FC Road', desc: 'Mumbai\'s iconic vada pav — soft bun with spiced potato fritter and chutneys. The best street breakfast.', cost: 80, tip: 'Try the cheese vada pav for extra indulgence.' },
                { name: 'Lunch at Shree Thaker Bhojanalay, Kalbadevi', desc: 'Unlimited Gujarati thali with 25+ items. A legendary Mumbai lunch experience since 1945.', cost: 350, tip: 'Opens at 11 AM. Queue forms early — worth the wait.' },
                { name: 'Street Food at Chowpatty Beach', desc: 'Try bhel puri, pav bhaji, and kulfi at the beach stalls. Iconic Mumbai food experience.', cost: 200, tip: 'Ashok Bhel is the most famous stall. Evening is best for atmosphere.' },
                { name: 'Dinner at Bademiya, Colaba', desc: 'Legendary late-night street food — seekh kebabs, chicken rolls, and naan wraps. Open till 2 AM.', cost: 400, tip: 'Go after 9 PM for the full experience when the outdoor seating fills up.' },
            ],
            moderate: [
                { name: 'Breakfast at Café Mondegar, Colaba', desc: 'Iconic café with Mario Miranda murals. Great continental breakfast with Mumbai vibes since 1932.', cost: 350, tip: 'Window seats for people-watching on Colaba Causeway.' },
                { name: 'Lunch at Britannia & Co., Ballard Estate', desc: 'Legendary Parsi restaurant famous for Berry Pulao and Salli Boti. Run by 97-year-old Mr. Kohinoor.', cost: 600, tip: 'Must try the Berry Pulao. Goes great with Raspberry soda.' },
                { name: 'Snacks at Kyani & Co., Marine Lines', desc: 'Heritage Irani café from 1904. Famous for bun maska, chai, and kheema pav.', cost: 250, tip: 'Order the mawa cake — it\'s their specialty since a century.' },
                { name: 'Dinner at Trishna, Fort', desc: 'Iconic seafood restaurant famous for butter garlic crab. A must-visit for seafood lovers.', cost: 1200, tip: 'Reserve ahead. The Koliwada prawns are incredible.' },
            ],
            luxury: [
                { name: 'Breakfast at Sea Lounge, Taj Mahal Palace', desc: 'Elegant breakfast at the iconic Taj with views of the Gateway of India. World-class buffet and service.', cost: 1800, tip: 'Book a window table for the best Gateway of India views.' },
                { name: 'Lunch at Wasabi by Morimoto, Taj Mahal Palace', desc: 'Award-winning Japanese restaurant by Iron Chef Morimoto. Fresh sushi and omakase experience.', cost: 3500, tip: 'Try the tasting menu for the full experience.' },
                { name: 'High Tea at Café Royal, Taj Mahal Palace', desc: 'Elegant afternoon tea with scones, pastries, and finger sandwiches in a heritage setting.', cost: 1500, tip: 'Reservations recommended. Smart casual dress code.' },
                { name: 'Dinner at Indian Accent, BKC', desc: 'India\'s top restaurant with innovative Indian cuisine. Michelin-level dining in Mumbai.', cost: 4000, tip: 'The tasting menu with wine pairing is exceptional.' },
            ],
        },
        tips: [
            'Use local trains to beat Mumbai traffic — Churchgate to Bandra takes just 30 min vs 2 hours by road',
            'Carry an umbrella if visiting between June-September (monsoon season)',
            'Try the iconic Mumbai vada pav from street vendors — the city\'s signature dish',
            'Book Uber/Ola for late-night travel — auto-rickshaws only operate in suburbs',
            'Colaba, Fort, and Churchgate areas are walkable — save on cab fares',
            'Visit Chor Bazaar on Saturday for antique finds and vintage items',
            'Download the m-Indicator app for local train schedules',
            'Carry a water bottle — Mumbai humidity can dehydrate you quickly',
        ],
    },
    pune: {
        spots: [
            { name: 'Shaniwar Wada', desc: 'Majestic 18th-century fortification and palace of the Peshwas. Sound and light show in the evening narrates Maratha history.', type: 'visit', time: '1.5 hours', cost: 25, tip: 'Evening sound & light show starts at 7:15 PM — highly recommended.', bestTime: 'evening' },
            { name: 'Aga Khan Palace', desc: 'Historic palace where Mahatma Gandhi was imprisoned. Beautiful Italian arches, lawns, and Gandhi memorial museum.', type: 'visit', time: '1.5 hours', cost: 15, tip: 'Peaceful early morning visit is best. The museum has original Gandhi artifacts.', bestTime: 'morning' },
            { name: 'Sinhagad Fort', desc: 'Historic hill fort 35km from Pune with spectacular views. Trek up or drive to the top. Famous for pitla-bhakri.', type: 'activity', time: '4 hours', cost: 0, tip: 'Start the trek before 7 AM to avoid heat. Try pitla-bhakri and kalvan at the top.', bestTime: 'morning' },
            { name: 'Dagdusheth Halwai Ganpati Temple', desc: 'Pune\'s most beloved Ganesh temple, established in 1893. Ornate gold-plated idol and vibrant atmosphere.', type: 'visit', time: '1 hour', cost: 0, tip: 'Visit early morning for darshan without crowds. During Ganesh Chaturthi, expect massive celebrations.', bestTime: 'morning' },
            { name: 'Koregaon Park (KP)', desc: 'Pune\'s trendiest neighborhood with boutique cafes, restaurants, the Osho Ashram, and vibrant nightlife.', type: 'activity', time: '2 hours', cost: 0, tip: 'Walk along North Main Road for café hopping. Try German Bakery for breakfast.', bestTime: 'afternoon' },
            { name: 'FC Road (Fergusson College Road)', desc: 'Iconic student hangout street with bookstores, street food, fashion stores, and famous food joints.', type: 'activity', time: '2 hours', cost: 0, tip: 'Must try Vaishali\'s dosa and Roopali\'s misal pav — iconic FC road eateries.', bestTime: 'afternoon' },
            { name: 'Pataleshwar Cave Temple', desc: 'Ancient rock-cut cave temple dedicated to Lord Shiva, dating back to 8th century. Right in the city center.', type: 'visit', time: '45 minutes', cost: 0, tip: 'Often overlooked by tourists — peaceful spot for morning meditation.', bestTime: 'morning' },
            { name: 'Raja Dinkar Kelkar Museum', desc: 'Fascinating collection of Indian artifacts — weapons, musical instruments, paintings, and Mastani\'s palace model.', type: 'visit', time: '1.5 hours', cost: 30, tip: 'The musical instrument collection is world-class. Photography allowed inside.', bestTime: 'afternoon' },
            { name: 'Parvati Hill', desc: 'Ancient hilltop temple complex with panoramic views of Pune. 103 steps lead to Parvati Museum.', type: 'visit', time: '1.5 hours', cost: 0, tip: 'Sunset from the top is stunning. Carry water for the climb.', bestTime: 'evening' },
            { name: 'Lal Mahal', desc: 'Reconstructed palace where young Shivaji Maharaj spent his childhood. Museum showcasing Maratha history.', type: 'visit', time: '1 hour', cost: 15, tip: 'Great for history enthusiasts. The Shivaji-Shaista Khan encounter is depicted inside.', bestTime: 'afternoon' },
        ],
        restaurants: {
            budget: [
                { name: 'Breakfast at Vaishali Restaurant, FC Road', desc: 'Legendary Pune eatery famous for South Indian breakfast — dosa, idli, and filter coffee since 1951.', cost: 150, tip: 'Mysore masala dosa is the signature. Go before 9 AM to avoid queues.' },
                { name: 'Lunch at Shreyas, JM Road', desc: 'Authentic Maharashtrian thali with unlimited servings. Home-style cooking at its best.', cost: 300, tip: 'Weekday lunch thali includes special sweets. Very popular with office-goers.' },
                { name: 'Street food at Mandai (Mahatma Phule Mandai)', desc: 'Pune\'s oldest market area with amazing misal pav and vada pav stalls all around.', cost: 120, tip: 'Bedekar Misal nearby is legendary — spicy and flavorful.' },
                { name: 'Dinner at Badshahi, KC Market', desc: 'Iconic non-veg eatery since 1905, famous for biryani, kebabs, and mutton thali.', cost: 350, tip: 'The mutton biryani and boti kebab are must-haves.' },
            ],
            moderate: [
                { name: 'Breakfast at German Bakery, Koregaon Park', desc: 'Iconic café serving continental breakfast, quiches, smoothies, and fresh breads in a garden setting.', cost: 400, tip: 'Window seats overlooking the garden. Try their banana walnut pancakes.' },
                { name: 'Lunch at Malaka Spice, Koregaon Park', desc: 'Popular Asian fusion restaurant with Southeast Asian cuisine and beautiful outdoor seating.', cost: 700, tip: 'The Pad Thai and Malaysian Laksa are outstanding. Reserve for weekends.' },
                { name: 'Snacks at Chitale Bandhu Mithaiwale', desc: 'Pune\'s most famous sweet shop since 1950. Known for bakarwadi, kaju katli, and fresh chivda.', cost: 200, tip: 'Buy packs of bakarwadi — Pune\'s signature snack to take home.' },
                { name: 'Dinner at The Creek, Aundh', desc: 'Beautiful ambiance restaurant specializing in Konkani seafood and North Indian cuisine.', cost: 1000, tip: 'The surmai fry and sol kadhi are fantastic.' },
            ],
            luxury: [
                { name: 'Breakfast at Café Columbia, Marriott', desc: 'Luxury breakfast buffet with global cuisine, live counters, and an impressive spread.', cost: 1500, tip: 'The live dosa counter and egg station are highlights.' },
                { name: 'Lunch at Paasha, JW Marriott', desc: 'Premium North-Western cuisine in a rooftop setting with stunning city views.', cost: 2500, tip: 'The dal Paasha and biryani are signature dishes. Dress smart casual.' },
                { name: 'Dinner at Rajasthani Room, Oakwood Premier', desc: 'Upscale Rajasthani dining with traditional thali, live music, and royal décor.', cost: 2000, tip: 'The laal maas and dal baati churma are exceptional.' },
                { name: 'High Tea at Conrad Pune', desc: 'Elegant afternoon tea service with patisserie, scones, and premium tea selection.', cost: 1200, tip: 'Beautiful Instagram-worthy presentation.' },
            ],
        },
        tips: [
            'Pune has excellent weather year-round — lightweight cotton clothes work best',
            'Use apps like Ola/Uber to book autorickshaws — meters can be unreliable',
            'FC Road and JM Road are best explored on foot — parking is a nightmare',
            'Try misal pav at Bedekar/Katakirr — Pune\'s signature breakfast dish',
            'Visit Sinhagad Fort early morning on weekdays to avoid weekend crowds',
            'Koregaon Park has Pune\'s best nightlife — many clubs and lounges',
            'If visiting in monsoon (Jul-Sep), carry rain gear — Pune gets heavy showers',
            'Buy Chitale Bakarwadi as a souvenir — everyone back home will love it',
        ],
    },
    goa: {
        spots: [
            { name: 'Calangute Beach', desc: 'Queen of Beaches — Goa\'s most popular beach with water sports, shacks, and vibrant atmosphere.', type: 'visit', time: '2 hours', cost: 0, tip: 'Morning is calm for swimming. Evening is buzzing with beach parties and shacks.', bestTime: 'morning' },
            { name: 'Basilica of Bom Jesus', desc: 'UNESCO World Heritage Site housing the remains of St. Francis Xavier. Stunning Portuguese Baroque architecture.', type: 'visit', time: '1 hour', cost: 0, tip: 'Visit in morning light for best photos. The adjacent Se Cathedral is also worth seeing.', bestTime: 'morning' },
            { name: 'Fort Aguada', desc: 'Well-preserved 17th-century Portuguese fort with a lighthouse offering panoramic views of the Arabian Sea.', type: 'visit', time: '1.5 hours', cost: 0, tip: 'Visit during golden hour for stunning photos. The lighthouse is a great viewpoint.', bestTime: 'evening' },
            { name: 'Dudhsagar Falls (Day Trip)', desc: 'One of India\'s tallest waterfalls at 310m, nestled in lush Western Ghats. An adventurous jeep ride through the jungle.', type: 'activity', time: '6 hours', cost: 1500, tip: 'Best visited July-November for full flow. Book jeep through official counters at Collem.', bestTime: 'morning' },
            { name: 'Anjuna Flea Market', desc: 'Iconic Wednesday flea market with hippie vibes, clothes, jewelry, spices, and live music.', type: 'activity', time: '2 hours', cost: 0, tip: 'Only on Wednesdays. Arrive by 10 AM for best selection. Bargain hard!', bestTime: 'morning' },
            { name: 'Old Goa Heritage Walk', desc: 'Explore Portuguese colonial architecture — Se Cathedral, Church of St. Francis, and archaeological museum.', type: 'activity', time: '3 hours', cost: 0, tip: 'Hire a local guide for ₹300 — the stories behind the churches are fascinating.', bestTime: 'morning' },
            { name: 'Palolem Beach', desc: 'Crescent-shaped beach in South Goa. Calmer and more beautiful than North Goa beaches. Great for silent parties.', type: 'visit', time: '3 hours', cost: 0, tip: 'Silent parties happen on Saturday nights. Kayaking to Butterfly Beach costs ₹400.', bestTime: 'afternoon' },
            { name: 'Spice Plantation Visit', desc: 'Tour a working spice plantation — cardamom, pepper, vanilla, cinnamon. Includes traditional Goan lunch.', type: 'activity', time: '3 hours', cost: 400, tip: 'Sahakari Spice Farm and Tropical Spice Plantation are the best ones.', bestTime: 'morning' },
            { name: 'Chapora Fort', desc: 'The famous "Dil Chahta Hai" fort with unbeatable views of Vagator Beach and the coastline.', type: 'visit', time: '1 hour', cost: 0, tip: 'Sunset from here is the best in Goa. Climb up the rocky path for the iconic photo spot.', bestTime: 'evening' },
            { name: 'Fontainhas Latin Quarter', desc: 'Colourful Portuguese heritage quarter in Panjim with narrow streets, art galleries, and heritage homes.', type: 'activity', time: '1.5 hours', cost: 0, tip: 'Walk through the streets to see the beautiful painted Portuguese houses. Visit 31 January Road for bookshops.', bestTime: 'afternoon' },
        ],
        restaurants: {
            budget: [
                { name: 'Breakfast at Ritz Classic, Panjim', desc: 'Local favourite for Goan breakfast — poi bread with chouriço, pork sausage pulao, and chai.', cost: 150, tip: 'Try the prawn rawa fry with poi — a classic Goan combo.' },
                { name: 'Lunch at beach shacks at Calangute/Baga', desc: 'Fresh seafood, Goan fish curry rice, and cold beer with your toes in the sand. Pure Goa vibes.', cost: 400, tip: 'St. Anthony\'s and Britto\'s are popular and reliable shacks.' },
                { name: 'Dinner at Vinayak Family Restaurant, Assagao', desc: 'Local Goan eatery with authentic xacuti, vindaloo at local prices. Favourite of taxi drivers (always a good sign!).', cost: 300, tip: 'The fish thali and chicken cafreal are outstanding.' },
            ],
            moderate: [
                { name: 'Breakfast at Artjuna Café, Anjuna', desc: 'Bohemian garden café with organic breakfast, smoothie bowls, and great coffee in a hippie setting.', cost: 400, tip: 'Try the açaí bowl. The garden seating with fairy lights is Instagram-worthy.' },
                { name: 'Lunch at Gunpowder, Assagao', desc: 'South Indian-Goan fusion in a beautiful heritage house with garden seating. Award-winning cuisine.', cost: 800, tip: 'The Malabar prawns and appams are a must. Reserve for Sunday brunch.' },
                { name: 'Dinner at Fisherman\'s Wharf, Cavelossim', desc: 'Scenic riverside restaurant with fresh Goan seafood, live music, and beautiful sunset views.', cost: 1200, tip: 'Get a riverside table at sunset. The Goan fish curry and prawn balchão are excellent.' },
            ],
            luxury: [
                { name: 'Breakfast at The Postcard Café, Moira', desc: 'Boutique hotel café with gourmet breakfast by the pool. Farm-fresh ingredients and beautiful plating.', cost: 1500, tip: 'One of the most beautiful breakfast settings in Goa.' },
                { name: 'Lunch at Sublime, Morjim', desc: 'Beach-chic fine dining with Asian-Goan fusion, craft cocktails, and stunning beachfront setting.', cost: 2500, tip: 'Try the tasting menu. Reservations essential on weekends.' },
                { name: 'Dinner at A Reverie, Calangute', desc: 'Goa\'s top fine dining restaurant with innovative European-Goan cuisine and impeccable service.', cost: 4000, tip: 'The 7-course tasting menu with wine pairing is unforgettable.' },
            ],
        },
        tips: [
            'Rent a scooter (₹300-500/day) — it\'s the best way to explore Goa freely',
            'North Goa for parties and buzz, South Goa for peace and luxury',
            'Carry cash — many beach shacks and small shops don\'t accept cards',
            'Best season is November to February — perfect weather, all shacks open',
            'Try Goan feni (local cashew liquor) — King\'s Beer is the local favorite',
            'Book water sports at Calangute/Baga — parasailing ₹500, jet ski ₹800',
            'Sunset at Chapora Fort and Ozran Beach are the most photogenic in Goa',
            'Wednesday Anjuna Flea Market and Saturday Night Market at Arpora are must-visits',
        ],
    },
    delhi: {
        spots: [
            { name: 'India Gate', desc: 'Iconic war memorial and popular evening hangout. Beautiful when illuminated at night. Surrounding lawns are perfect for a stroll.', type: 'visit', time: '1 hour', cost: 0, tip: 'Visit in early morning for jogging or post-sunset for illuminated views. Ice cream vendors around.', bestTime: 'evening' },
            { name: 'Red Fort (Lal Qila)', desc: 'UNESCO World Heritage Site and Mughal-era fort from 1638. Home to museums and the iconic Lahori Gate.', type: 'visit', time: '2 hours', cost: 35, tip: 'Avoid Mondays (closed). Evening Sound & Light show is wonderful.', bestTime: 'morning' },
            { name: 'Qutub Minar', desc: 'UNESCO site with a 73m-tall 12th-century minaret and ancient Iron Pillar. Stunning Indo-Islamic architecture.', type: 'visit', time: '1.5 hours', cost: 35, tip: 'Early morning is perfect for photos without crowds. The iron pillar is a metallurgical marvel.', bestTime: 'morning' },
            { name: 'Humayun\'s Tomb', desc: 'Stunning Mughal garden tomb that inspired the Taj Mahal. Beautifully maintained gardens and intricate architecture.', type: 'visit', time: '1.5 hours', cost: 35, tip: 'Late afternoon light is magical for photography. Explore the surrounding gardens.', bestTime: 'afternoon' },
            { name: 'Chandni Chowk', desc: 'One of the oldest and busiest markets in India. Narrow lanes, street food, spices, textiles, and Old Delhi charm.', type: 'activity', time: '2.5 hours', cost: 0, tip: 'Take a rickshaw ride through the lanes. Try paranthe wali gali for stuffed parathas.', bestTime: 'morning' },
            { name: 'Lotus Temple', desc: 'Stunning Bahá\'í House of Worship shaped like a lotus flower. Beautifully serene meditation space.', type: 'visit', time: '1 hour', cost: 0, tip: 'Closed on Mondays. Most beautiful at sunset when the marble glows golden.', bestTime: 'evening' },
            { name: 'Jama Masjid', desc: 'India\'s largest mosque built by Shah Jahan. Climb the minaret for 360° views of Old Delhi.', type: 'visit', time: '1 hour', cost: 0, tip: 'Minaret climb costs ₹100 but the view is worth it. Dress modestly.', bestTime: 'morning' },
            { name: 'Hauz Khas Village', desc: 'Trendy neighborhood with ruins, lake, art galleries, cafés, and boutiques. Delhi\'s hipster hub.', type: 'activity', time: '2 hours', cost: 0, tip: 'Visit the deer park and medieval ruins by the lake. Great for sunset.', bestTime: 'afternoon' },
        ],
        restaurants: {
            budget: [
                { name: 'Breakfast at Paranthe Wali Gali, Chandni Chowk', desc: 'Famous narrow lane in Old Delhi with shops serving stuffed parathas with curd since the 1870s.', cost: 150, tip: 'PT. Gaya Prasad is the oldest. Try the rabri parantha.' },
                { name: 'Lunch at Karim\'s, Jama Masjid', desc: 'Legendary Mughlai restaurant near Jama Masjid since 1913. Famous for mutton burra and nihari.', cost: 350, tip: 'The mutton korma and rumali roti are outstanding. Go at lunch to avoid the evening wait.' },
                { name: 'Street food at Connaught Place', desc: 'Delhi\'s heart with iconic eateries — chhole bhature, gol gappa, and daulat ki chaat (winter special).', cost: 200, tip: 'Kewenter\'s milkshakes and Wenger\'s pastries are CP classics.' },
                { name: 'Dinner at Moolchand Parantha, Defence Colony', desc: 'Famous late-night parantha stall operating since decades. The aloo and paneer parathas are legendary.', cost: 200, tip: 'Open late. Perfect post-midnight meal spot for locals.' },
            ],
            moderate: [
                { name: 'Breakfast at Café Lota, Pragati Maidan', desc: 'Modern Indian café in the Crafts Museum. Beautiful ambiance with innovative Indian breakfast dishes.', cost: 400, tip: 'The uttapam variations and chai are delightful. Museum is worth exploring too.' },
                { name: 'Lunch at SodaBottleOpenerWala, Khan Market', desc: 'Quirky Parsi café serving authentic Parsi cuisine — berry pulao, patra ni macchi, and Parsi omelette.', cost: 700, tip: 'The Keema Pav and raspberry soda are beloved classics.' },
                { name: 'Dinner at Bukhara, ITC Maurya', desc: 'World-famous restaurant — Obama, Clinton have dined here. Legendary dal Bukhara and sikandari raan.', cost: 3000, tip: 'Reserve weeks ahead. No cutlery — eat with your hands for the authentic experience.' },
            ],
            luxury: [
                { name: 'Breakfast at Imperial Delhi', desc: 'Grand colonial hotel breakfast with views of the beautiful Mughal gardens. Impeccable service.', cost: 2000, tip: 'The driveway itself is museum-worthy with priceless art.' },
                { name: 'Lunch at Indian Accent, The Lodhi', desc: 'Asia\'s #1 restaurant with innovative Indian cuisine. A gastronomic experience like no other.', cost: 4500, tip: 'The tasting menu is the way to go. Most awarded restaurant in India.' },
                { name: 'Dinner at Dum Pukht, ITC Maurya', desc: 'Slow-cooked Awadhi cuisine in a regal setting. The biryani sealed in dough is legendary.', cost: 4000, tip: 'The kakori kebab melts in your mouth. Smart casual required.' },
            ],
        },
        tips: [
            'Delhi Metro is the best way to get around — covers most tourist spots',
            'Download the Delhi Metro app for routes and timings',
            'Avoid visiting outdoor monuments in summer (Apr-Jun) — temperatures exceed 45°C',
            'Try the street food trail: Chandni Chowk → Connaught Place → Hauz Khas',
            'Bargain at Sarojini Nagar and Janpath markets — start at 30% of quoted price',
            'Dilli Haat in INA is great for handicrafts and authentic state cuisine',
            'Uber/Ola are much more reliable than auto-rickshaws for tourists',
            'October to March is the best time to visit Delhi — pleasant weather',
        ],
    },
};

function generateFallbackItinerary(input: TripPlanInput): AITripResult {
    const destKey = input.destination.toLowerCase().trim();
    const cityData = CITY_DATA[destKey];
    const hasLocalData = !!cityData;

    // Use tourist spots from API if available, otherwise use curated data
    const apiSpots = input.touristSpots.filter(s => s.name && s.name !== 'Unknown');
    const spots = hasLocalData ? cityData.spots : apiSpots.map(s => ({
        name: s.name,
        desc: `Explore ${s.name}, a popular ${s.category} attraction. Rating: ${s.rating}/5.`,
        type: 'visit' as const,
        time: `${s.estimatedTime} hours`,
        cost: s.entryFee,
        tip: `Best visited: ${s.bestTimeToVisit}. Estimated time: ${s.estimatedTime} hours.`,
        bestTime: s.bestTimeToVisit?.toLowerCase().includes('morning') ? 'morning' : 'afternoon',
    }));

    const restaurants = hasLocalData
        ? cityData.restaurants[input.budgetType] || cityData.restaurants.moderate
        : getGenericRestaurants(input.destination, input.budgetType);

    const tips = hasLocalData ? cityData.tips : getGenericTips(input.destination, input.accommodationType);

    const itinerary: AIItineraryDay[] = [];
    const maxSpotsPerDay = input.pacePreference === 'relaxed' ? 2 : input.pacePreference === 'packed' ? 4 : 3;

    // Separate spots by best time
    const morningSpots = spots.filter(s => s.bestTime === 'morning');
    const afternoonSpots = spots.filter(s => s.bestTime === 'afternoon');
    const eveningSpots = spots.filter(s => s.bestTime === 'evening');
    const allSpots = [...morningSpots, ...afternoonSpots, ...eveningSpots];
    let spotIdx = 0;

    for (let day = 1; day <= input.days; day++) {
        const activities: AIItineraryDay['activities'] = [];
        const isFirstDay = day === 1;
        const isLastDay = day === input.days;

        // Pick meals (cycle through available)
        const breakfastItem = restaurants[(day - 1) % restaurants.length];
        const lunchItem = restaurants[(day) % restaurants.length];
        const dinnerItem = restaurants[(day + 1) % restaurants.length];

        // === MORNING ===
        if (isFirstDay) {
            activities.push({
                time: '07:00 AM', title: `Arrive in ${input.destination}`,
                description: `Arrive and check into your ${input.accommodationType}. Freshen up, settle in, and get ready for your ${input.destination} adventure.`,
                type: 'travel', duration: '1.5 hours', cost: 0,
                tip: 'Keep hotel address saved offline. Download offline maps before your trip.'
            });
            activities.push({
                time: '09:00 AM', title: breakfastItem.name,
                description: breakfastItem.desc, type: 'food', duration: '45 minutes',
                cost: breakfastItem.cost, tip: breakfastItem.tip
            });
        } else {
            activities.push({
                time: '08:00 AM', title: breakfastItem.name,
                description: breakfastItem.desc, type: 'food', duration: '45 minutes',
                cost: breakfastItem.cost, tip: breakfastItem.tip
            });
        }

        // === MORNING SPOTS ===
        let spotsAdded = 0;
        let currentHour = isFirstDay ? 10 : 9;

        while (spotsAdded < Math.min(2, maxSpotsPerDay) && spotIdx < allSpots.length) {
            const spot = allSpots[spotIdx % allSpots.length];
            spotIdx++;
            const hour = currentHour;
            const period = hour >= 12 ? 'PM' : 'AM';
            const dispHour = hour > 12 ? hour - 12 : hour;

            activities.push({
                time: `${String(dispHour).padStart(2, '0')}:${spotsAdded === 0 ? '00' : '30'} ${period}`,
                title: spot.name, description: spot.desc, type: spot.type,
                duration: spot.time, cost: spot.cost, tip: spot.tip
            });
            spotsAdded++;
            const hrs = parseFloat(spot.time) || 1.5;
            currentHour += hrs + 0.5;
        }

        // === LUNCH ===
        activities.push({
            time: '01:00 PM', title: lunchItem.name,
            description: lunchItem.desc, type: 'food', duration: '1 hour',
            cost: lunchItem.cost, tip: lunchItem.tip
        });

        // === AFTERNOON SPOTS ===
        currentHour = 14.5;
        while (spotsAdded < maxSpotsPerDay && spotIdx < allSpots.length) {
            const spot = allSpots[spotIdx % allSpots.length];
            spotIdx++;
            const hour = Math.floor(currentHour);
            const dispHour = hour > 12 ? hour - 12 : hour;

            activities.push({
                time: `${String(dispHour).padStart(2, '0')}:${currentHour % 1 >= 0.5 ? '30' : '00'} PM`,
                title: spot.name, description: spot.desc, type: spot.type,
                duration: spot.time, cost: spot.cost, tip: spot.tip
            });
            spotsAdded++;
            const hrs = parseFloat(spot.time) || 1.5;
            currentHour += hrs + 0.5;
        }

        // === REST (relaxed pace) ===
        if (input.pacePreference === 'relaxed') {
            activities.push({
                time: '04:30 PM', title: 'Leisure & Rest Time',
                description: `Relax at your ${input.accommodationType}, freshen up, or explore the local neighborhood at your own pace.`,
                type: 'rest', duration: '1.5 hours',
                tip: 'Use this time to upload photos, journal, or simply recharge.'
            });
        }

        // === EVENING ACTIVITY ===
        if (!isLastDay && spots.length > 0) {
            const eveningSpot = eveningSpots.length > 0
                ? eveningSpots[(day - 1) % eveningSpots.length]
                : allSpots[spotIdx % allSpots.length];
            activities.push({
                time: '05:30 PM', title: eveningSpot.name,
                description: eveningSpot.desc + ' Perfect for the golden hour.',
                type: eveningSpot.type, duration: eveningSpot.time,
                cost: eveningSpot.cost, tip: eveningSpot.tip
            });
        }

        // === DINNER ===
        activities.push({
            time: '08:00 PM', title: dinnerItem.name,
            description: dinnerItem.desc, type: 'food', duration: '1.5 hours',
            cost: dinnerItem.cost, tip: dinnerItem.tip
        });

        // === DEPARTURE (last day) ===
        if (isLastDay) {
            activities.push({
                time: '09:30 PM', title: 'Pack & Prepare for Departure',
                description: 'Pack your bags, collect souvenirs, and prepare for the journey home. Check out from accommodation.',
                type: 'travel', duration: '1 hour',
                tip: `Buy local specialties of ${input.destination} as gifts before leaving.`
            });
        }

        // Day theme
        const themes: string[] = [
            `Arrival & First Taste of ${input.destination}`,
            `Heritage & Culture Walk`,
            `Hidden Gems & Local Experiences`,
            `Adventure & Exploration Day`,
            `Iconic Landmarks & Photography`,
            `Markets, Food & Nightlife`,
            `Final Explorations & Departure`,
        ];
        const theme = isFirstDay ? themes[0] : (isLastDay ? themes[6] : themes[Math.min(day - 1, themes.length - 1)]);

        itinerary.push({ day, theme, activities });
    }

    return {
        itinerary,
        tips,
        summary: `A curated ${input.days}-day ${input.travelStyle} trip from ${input.source} to ${input.destination} for ${input.travelers} traveler${input.travelers > 1 ? 's' : ''}. ${hasLocalData ? `This itinerary features the best of ${input.destination} — from iconic landmarks to hidden local gems and authentic food experiences, all tailored to your ${input.budgetType} budget.` : `Explore the best attractions and dining experiences in ${input.destination} with a ${input.pacePreference} pace and ${input.budgetType} budget.`}`,
    };
}

function getGenericRestaurants(destination: string, budgetType: string) {
    const base = [
        { name: `Traditional breakfast in ${destination}`, desc: `Start your morning with authentic local breakfast specialties unique to ${destination}. Ask your hotel for the nearest popular breakfast spot.`, cost: budgetType === 'budget' ? 150 : budgetType === 'luxury' ? 800 : 350, tip: 'Ask locals for their favorite breakfast spot — they always know best.' },
        { name: `Local restaurant lunch in ${destination}`, desc: `Enjoy a filling lunch at a well-reviewed local restaurant. Try the regional thali for a variety of flavors.`, cost: budgetType === 'budget' ? 250 : budgetType === 'luxury' ? 1200 : 600, tip: 'Google Maps reviews help find hidden gems with high ratings.' },
        { name: `Street food & snacks walk in ${destination}`, desc: `Explore the local food scene — try street snacks, chai stalls, and regional specialties.`, cost: budgetType === 'budget' ? 150 : budgetType === 'luxury' ? 500 : 300, tip: 'Look for stalls with long local queues — that\'s the freshest food.' },
        { name: `Dinner at popular ${destination} eatery`, desc: `End the day with a hearty dinner featuring regional cuisine. Try the local specialty dish.`, cost: budgetType === 'budget' ? 300 : budgetType === 'luxury' ? 1500 : 700, tip: 'Zomato or Google Maps can help find top-rated restaurants nearby.' },
    ];
    return base;
}

function getGenericTips(destination: string, accommodation: string) {
    return [
        `Download offline maps of ${destination} — internet may be patchy in some areas`,
        `Carry copies of ID and hotel booking confirmation`,
        `Try the local breakfast specialty of ${destination} on your first morning`,
        `Ask your ${accommodation} reception for personalized local recommendations`,
        `Use Google Maps to check real-time traffic before planning your day`,
        `Carry a reusable water bottle and sunscreen — essential for outdoor exploration`,
        `Start early at popular spots to avoid crowds and midday heat`,
        `Keep small denominations of cash for street food and auto rides`,
    ];
}
