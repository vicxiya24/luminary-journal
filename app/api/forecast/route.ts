import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { routineId, slots, weekStart } = await req.json();

    // 1. Ask Gemini to generate 4 weeks of projections
    const systemPrompt = `You are Luminary Journal's deeply analytical dermatological AI.
The user has just changed their skincare routine for the week of ${weekStart}.
ROUTINE SLOTS (WITH FULL INGREDIENT LISTS): ${JSON.stringify(slots, null, 2)}

CRITICAL INSTRUCTION: Analyze the ingredients meticulously. If you observe highly comedogenic ingredients (e.g. Coconut Oil, Cocoa Butter, Wheat Germ Oil, Isopropyl Myristate) or chemical clashes (e.g. Retinoids mixed with strong exfoliants in the exact same slot), you MUST severely penalize the routine. Breakouts, irritation, and dryness should spike high (4.0 - 5.0) and satisfaction should tank (1.0 - 2.0).
Even if a highly comedogenic product is only used 1 or 2 times a week, you MUST still project significant breakouts.
Crucially, if a routine contains harmful ingredients, the negative effects should compound or remain severely high through all 4 weeks. Do NOT simulate a miraculous recovery in Week 3 or 4 if the user continues to use the same routine. 
Conversely, if the routine is clean and safe, metrics should steadily improve towards 1.0.

Your task: Project how this routine will impact their skin over the exact next 4 weeks (1, 2, 3, and 4 weeks from the start date).
Provide the predictions as a strict JSON array of exactly 4 objects.
Do not wrap the JSON in Markdown formatting blocks like \`\`\`json. Just output the raw JSON array.
Each object must have these exactly mapped numeric properties (values from 1.0 to 5.0, where 1 is good/low and 5 is bad/high, EXCEPT satisfaction where 5 is happy):
[
  {
    "weekOffset": 1,
    "projected_oiliness": 2.5,
    "projected_dryness": 2.0,
    "projected_irritation": 1.5,
    "projected_breakouts": 2.0,
    "projected_satisfaction": 4.0,
    "narrative": "A short 1-sentence explanation of what is happening this week."
  },
  ... (for offsets 2, 3, and 4)
]
Evaluate typical ingredient conflicts (e.g. over-exfoliation) internally, but just return the numbers.`;

    const result = await generateText({
      model: google('gemini-flash-latest') as any,
      prompt: systemPrompt,
    });

    const cleanText = result.text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanText);

    if (!Array.isArray(parsedData) || parsedData.length !== 4) {
        throw new Error('Invalid AI response structure');
    }

    // 2. Clear old projections first
    await supabase
      .from('projections')
      .delete()
      .eq('user_id', user.id);

    // 3. Insert the new ones safely
    const baseDate = new Date(weekStart);
    baseDate.setUTCHours(0, 0, 0, 0);

    const inserts = parsedData.map((p: any) => {
      const targetDate = new Date(baseDate);
      targetDate.setUTCDate(baseDate.getUTCDate() + (p.weekOffset * 7));
      
      const isoDateStr = targetDate.toISOString().split('T')[0];

      return {
        user_id: user.id,
        triggered_by_routine_id: routineId,
        week_start: isoDateStr,
        projected_oiliness: Number(p.projected_oiliness),
        projected_dryness: Number(p.projected_dryness),
        projected_irritation: Number(p.projected_irritation),
        projected_breakouts: Number(p.projected_breakouts),
        projected_satisfaction: Number(p.projected_satisfaction),
        narrative: p.narrative || ''
      };
    });

    const { error } = await supabase.from('projections').insert(inserts);

    if (error) {
      console.error("Projections Database Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: inserts.length });

  } catch (err: any) {
    console.error("Forecasting Error:", err);
    return NextResponse.json({ error: err.message || 'Failed to generate forecasts' }, { status: 500 });
  }
}
