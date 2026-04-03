import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, skinProfile, mergedProducts, routine } = await req.json();

  const systemPrompt = `You are Luminary Journal's expert dermatological AI.
Your job is to provide a 14-day projection of the user's skin based on their routine and skin profile.

SKIN PROFILE:
${JSON.stringify(skinProfile, null, 2)}

WEEKLY ROUTINE:
${JSON.stringify(routine, null, 2)}

PRODUCTS CONTEXT (Includes Ingredients):
${JSON.stringify(mergedProducts, null, 2)}

Analyze the routine for:
1. Ingredient conflicts (e.g. Retinol + AHAs without care).
2. Barrier damage risks.
3. Projected beneficial outcomes over 14 days.
Use beautiful markdown, an editorial tone, and keep formatting ultra clean. Emphasize dermatological expertise but be accessible.`;

  const result = await streamText({
    model: google('gemini-flash-latest') as any,
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
