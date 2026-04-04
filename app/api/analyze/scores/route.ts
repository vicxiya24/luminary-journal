import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // We only need the unique products for scoring
    const { uniqueProducts } = await req.json();

    if (!uniqueProducts || uniqueProducts.length === 0) {
      return NextResponse.json({ scores: {} });
    }

    // Fetch user skin profile so the AI knows who it is grading for
    const { data: profile } = await supabase
      .from('users')
      .select('skin_type, skin_concerns, sensitivity_level, medications')
      .eq('id', user.id)
      .single();

    const systemPrompt = `You are Luminary Journal's expert dermatological scoring AI.
You must analyze the provided list of skincare products and grade each one exactly on a 1.0 to 10.0 scale across 5 metrics. 
Grade them relative to the user's skin profile.
1 = Very low / Excellent (for negative metrics) or Terrible (for positive metrics)
10 = Extremely high / Terrible (for negative metrics) or Excellent (for positive metrics)

THE 5 METRICS:
- irritationRisk: 1 = gentle, 10 = extreme irritation
- redundancy: 1 = highly unique necessity, 10 = totally redundant with most other products
- barrierSupport: 1 = damages barrier, 10 = perfectly restores barrier
- comedogenicity: 1 = non-comedogenic, 10 = guaranteed to clog pores
- phCompatibility: 1 = horribly clashes, 10 = perfect pH balance

CRITICAL INSTRUCTION: Output an array of score objects. Each object MUST contain the exact literal UUID 'id' property of the product in the 'productId' field.

USER SKIN PROFILE:
${JSON.stringify(profile, null, 2)}

PRODUCTS TO ANALYZE:
${JSON.stringify(uniqueProducts, null, 2)}`;

    const { object } = await generateObject({
      model: google('gemini-flash-latest') as any,
      prompt: systemPrompt,
      system: "Output ONLY a valid JSON object.",
      schema: z.object({
        scores: z.array(
          z.object({
            productId: z.string().describe("The exact UUID 'id' property of the product being scored"),
            irritationRisk: z.number().min(1).max(10),
            redundancy: z.number().min(1).max(10),
            barrierSupport: z.number().min(1).max(10),
            comedogenicity: z.number().min(1).max(10),
            phCompatibility: z.number().min(1).max(10),
          })
        )
      }),
    });

    return NextResponse.json({ scores: object.scores });

  } catch (err: any) {
    console.error("Scoring Error:", err);
    return NextResponse.json({ error: err.message || 'Failed to generate scores' }, { status: 500 });
  }
}
