import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCityCoordinates } from '@/services/api/transportAPI';

// Simple haversine if we don't want to call OSRM for every chat extraction
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'mistral';
const CONTEXT_FILE = path.join(process.cwd(), 'data', 'trip_context.json');

const getSystemPrompt = (currentData: any) => {
    const missing = [];
    if (!currentData.source || !currentData.destination) missing.push("location");
    else if (!currentData.startDate || !currentData.endDate) missing.push("dates");
    else if (!currentData.budget || !currentData.budgetType) missing.push("budget");
    else if (!currentData.travelers) missing.push("travelers count");
    else if (!currentData.tripType) missing.push("trip type");
    else if (!currentData.interests || currentData.interests.length === 0) missing.push("interests");
    else if (!currentData.travelerContacts || currentData.travelerContacts.length === 0) missing.push("contact numbers");

    let goal = "";
    if (missing.length === 0) {
        goal = "Everything is ready. Use REDIRECT_TO_PLAN at the end of a warm closing message.";
    } else {
        const next = missing[0];
        if (next === "location") goal = "Ask for source and destination elegantly.";
        else if (next === "dates") goal = "Ask for travel dates naturally.";
        else if (next === "budget") goal = "Ask for their budget preference: 💰 Budget, 💵 Moderate, or 💎 Luxury, and a total amount (₹).";
        else if (next === "travelers count") goal = "Ask how many are joining the journey.";
        else if (next === "trip type") goal = "Ask if this is a solo, family, or group trip.";
        else if (next === "interests") goal = "Ask for hobbies/interests to curate the experience.";
        else if (next === "contact numbers") goal = "Ask for mobile numbers for coordination.";
    }

    return `You are Astra, the world-class concierge for "Radiator Routes". 
Your goal is to build a high-end itinerary through a seamless, natural conversation.

### CURRENT GOAL:
${goal}

### CONTEXT:
${JSON.stringify(currentData, null, 2)}

### PERSONALITY & RULES:
- **Brevity**: NEVER exceed 25 words per response. Keep it snappy.
- **No JSON**: ABSOLUTELY NEVER output raw JSON, curly braces {}, or internal data structures to the user.
- **Currency**: Always use ₹ (Rupees) for any monetary values. NEVER use $.
- **No Robotic Markers**: DO NOT mention "Step 1", "Step 2", or "Markdown".
- **Interactivity**: Acknowledge their input briefly and ask the next logical question.
- **Trigger**: Use REDIRECT_TO_PLAN only when all data is present.

### KEYWORD:
REDIRECT_TO_PLAN (Internal marker)`;
};

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let currentData: any = {
            source: null,
            destination: null,
            budget: null,
            travelers: null,
            budgetType: null,
            tripType: null,
            travelerContacts: [],
            interests: []
        };

        try {
            if (fs.existsSync(CONTEXT_FILE)) {
                currentData = JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf-8'));
            }
        } catch (e) { }

        const ollamaMessages: { role: string; content: string }[] = [
            { role: 'system', content: getSystemPrompt(currentData) },
        ];

        if (Array.isArray(history)) {
            for (const msg of history) {
                ollamaMessages.push({
                    role: msg.role === 'bot' || msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                });
            }
        }
        ollamaMessages.push({ role: 'user', content: message });

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: ollamaMessages,
                stream: false,
                keep_alive: '24h',
                options: { num_ctx: 2048, num_predict: 500 },
            }),
        });

        const data = await response.json();
        let reply = data?.message?.content || "Hmm, try asking again!";

        let redirectTriggered = false;
        if (reply.includes('REDIRECT_TO_PLAN')) {
            redirectTriggered = true;
            reply = reply.replace('REDIRECT_TO_PLAN', '').trim();
        }

        // Background extraction
        setTimeout(() => {
            extractAndSaveTripContext(message, history, reply, currentData).catch(() => { });
        }, 300);

        let isShortTrip = false;
        if (currentData.distance && currentData.distance < 80) {
            isShortTrip = true;
        }

        return NextResponse.json({
            reply,
            response: reply,
            triggerPlan: redirectTriggered,
            tripData: currentData,
            isShortTrip
        });
    } catch (error) {
        return NextResponse.json({ reply: "Oops! Astra is momentarily offline. 🚗" }, { status: 200 });
    }
}

async function extractAndSaveTripContext(latestMessage: string, history: any[], botReply: string, existing: any) {
    const fullText = [...(history || []).map(m => `${m.role}: ${m.content}`), `user: ${latestMessage}`, `assistant: ${botReply}`].join('\n');

    const extractPrompt = `Analyze the conversation for trip data.
CRITICAL:
- Source/Destination: City names.
- Dates: YYYY-MM-DD (Base year 2026).
- Budget: Numeric string.
- budgetType: Convert user vibe/class to "budget", "moderate", or "luxury".
- travelers: Numeric string.
- tripType: One of "solo", "family", or "group".
- travelerContacts: Array of phone numbers.
- Interests: Array of strings.

Return ONLY this JSON structures:
{
  "source": "string or null",
  "destination": "string or null",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "budget": "number or null",
  "budgetType": "budget|moderate|luxury|null",
  "travelers": "number or null",
  "tripType": "solo|family|group|null",
  "travelerContacts": ["string"],
  "interests": ["string"]
}

Text:
${fullText}`;

    try {
        const res = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: extractPrompt }],
                stream: false,
                keep_alive: '24h',
                options: { num_ctx: 2048, num_predict: 400 },
            }),
        });

        const result = await res.json();
        const raw = result?.message?.content || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return;

        const extracted = JSON.parse(jsonMatch[0]);

        const getValue = (ext: any, exi: any) => {
            if (ext === 'null' || ext === null || ext === undefined || ext === '') return exi;
            return ext;
        };

        const merged = {
            source: getValue(extracted.source, existing.source),
            destination: getValue(extracted.destination, existing.destination),
            startDate: getValue(extracted.startDate, existing.startDate),
            endDate: getValue(extracted.endDate, existing.endDate),
            budget: getValue(extracted.budget, existing.budget),
            budgetType: getValue(extracted.budgetType, existing.budgetType),
            travelers: getValue(extracted.travelers, existing.travelers),
            tripType: getValue(extracted.tripType, existing.tripType),
            travelerContacts: (extracted.travelerContacts?.length > 0) ? extracted.travelerContacts : (existing.travelerContacts || []),
            interests: (extracted.interests?.length > 0) ? extracted.interests : (existing.interests || []),
            distance: existing.distance || null
        };

        // If source or destination changed, recalculate distance
        if (merged.source && merged.destination && (merged.source !== existing.source || merged.destination !== existing.destination)) {
            try {
                const [s, d] = await Promise.all([
                    getCityCoordinates(merged.source),
                    getCityCoordinates(merged.destination)
                ]);
                if (s && d) {
                    merged.distance = calculateDistance(s.lat, s.lon, d.lat, d.lon);
                }
            } catch (e) { }
        }

        if (!fs.existsSync(path.dirname(CONTEXT_FILE))) fs.mkdirSync(path.dirname(CONTEXT_FILE), { recursive: true });
        fs.writeFileSync(CONTEXT_FILE, JSON.stringify(merged, null, 2));
    } catch (e) { }
}
