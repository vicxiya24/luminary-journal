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
ROUTINE SLOTS: ${JSON.stringify(slots, null, 2)}

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
