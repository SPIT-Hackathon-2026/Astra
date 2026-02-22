import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'gemma:2b';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session && process.env.NODE_ENV !== 'development') {
            // Allowing guest for hackathon demo if no session, consistent with plan route
        }

        const { transcript } = await req.json();
        if (!transcript) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        console.log('🎙️ Parsing Voice Transcript:', transcript);

        let parsed: any = null;

        // Phase A: Try Ollama
        try {
            const ollamaRes = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: `Extract trip details into valid JSON only. 
Expected fields: source, destination, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), budget (number), travelers (number), budgetType (budget|moderate|luxury), interests (string[]).
Base year is 2026. Today is ${new Date().toISOString().split('T')[0]}.
If unsure, use null. Output ONLY JSON.`
                        },
                        { role: 'user', content: transcript }
                    ],
                    stream: false,
                }),
            });

            if (ollamaRes.ok) {
                const data = await ollamaRes.json();
                const content = data.message?.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                    console.log('✅ Ollama Parsing Success:', parsed);
                }
            }
        } catch (e) {
            console.log('⚠️ Ollama failed, falling back to regex');
        }

        // Phase B: Regex Fallback (Merged with Ollama results if incomplete)
        if (!parsed || !parsed.source || !parsed.destination) {
            const regexData = parseWithRegex(transcript);
            parsed = { ...regexData, ...(parsed || {}) };

            // Overwrite with regex if Ollama missed critical fields
            if (!parsed.source) parsed.source = regexData.source;
            if (!parsed.destination) parsed.destination = regexData.destination;
            if (!parsed.startDate) parsed.startDate = regexData.startDate;
            if (!parsed.endDate) parsed.endDate = regexData.endDate;
            if (!parsed.budget) parsed.budget = regexData.budget;
            if (!parsed.travelers) parsed.travelers = regexData.travelers;
            if (!parsed.budgetType) parsed.budgetType = regexData.budgetType;
            if (!parsed.interests || parsed.interests.length === 0) parsed.interests = regexData.interests;
        }

        if (!parsed.source || !parsed.destination) {
            return NextResponse.json({
                error: 'Could not identify source or destination. Please try saying "from [City] to [City]".',
                parsed
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, parsed, transcript });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function parseWithRegex(text: string) {
    const t = text.toLowerCase();

    // Source & Destination
    const sourceMatch = t.match(/from\s+([a-z\s]+?)(?=\s+to|\s+visiting|\s+for|\s+on|$)/i);
    const destMatch = t.match(/(?:to|visiting)\s+([a-z\s]+?)(?=\s+from|\s+for|\s+on|\s+with|$)/i);

    // Budget
    let budget: number | null = null;
    const budgetMatch = t.match(/(?:₹|rs|inr|budget)\s*(\d+(?:\s*k)?)/i);
    if (budgetMatch) {
        let val = budgetMatch[1].replace(/\s/g, '').toLowerCase();
        if (val.endsWith('k')) {
            budget = parseFloat(val) * 1000;
        } else {
            budget = parseFloat(val);
        }
    }

    // Travelers
    let travelers = 1;
    const travelersMatch = t.match(/(\d+)\s*(?:people|travelers|members|members)/i);
    if (travelersMatch) travelers = parseInt(travelersMatch[1]);

    // Duration
    let days = 1;
    const daysMatch = t.match(/(\d+)\s*days/i);
    if (daysMatch) days = parseInt(daysMatch[1]);

    // Dates
    let startDate = new Date();
    if (t.includes('tomorrow')) startDate.setDate(startDate.getDate() + 1);
    else if (t.includes('next week')) startDate.setDate(startDate.getDate() + 7);

    // Basic month detection (simplified)
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    months.forEach((m, idx) => {
        if (t.includes(m)) {
            const dayMatch = t.match(new RegExp(`${m}\\s+(\\d+)`, 'i'));
            if (dayMatch) {
                startDate = new Date(2026, idx, parseInt(dayMatch[1]));
            }
        }
    });

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (days - 1));

    // Budget Type
    let budgetType = 'moderate';
    if (budget && travelers) {
        const perDay = budget / (travelers * days);
        if (perDay < 2000) budgetType = 'budget';
        else if (perDay > 7000) budgetType = 'luxury';
    }

    // Interests
    const interestKeywords = ['beach', 'historical', 'religious', 'nature', 'adventure', 'shopping', 'nightlife', 'food', 'photography', 'wellness'];
    const interests = interestKeywords.filter(k => t.includes(k));

    return {
        source: sourceMatch ? sourceMatch[1].trim() : null,
        destination: destMatch ? destMatch[1].trim() : null,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        budget,
        travelers,
        budgetType,
        interests
    };
}
