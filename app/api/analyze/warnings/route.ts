import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { routineSlots } = await req.json();

    // Pure deterministic engine - fast and 100% reliable
    const COMEDOGENIC_LIST = [
      "coconut oil", "cocoa butter", "wheat germ oil", "sesame oil", "flax seed oil",
      "isopropyl myristate", "isopropyl palmitate", "algae extract", "carrageenan",
      "myristyl myristate", "laureth-4", "lauric acid", "stearic acid", "oleic acid", "soybean oil"
    ];

    const CLASH_RULES = [
      {
        keywords: ['retinol', 'retinoid', 'tretinoin', 'adapalene'],
        clashesWith: ['glycolic acid', 'lactic acid', 'salicylic acid', 'aha', 'bha'],
        message: 'Combining Retinoids with strong acids increases risk of severe irritation and barrier damage.',
        recommendation: 'Use acids in the morning and retinoids at night, or alternate days.'
      },
      {
        keywords: ['vitamin c', 'ascorbic acid'],
        clashesWith: ['glycolic acid', 'lactic acid', 'salicylic acid', 'aha', 'bha'],
        message: 'Vitamin C paired with exfoliating acids can cause stinging and limit absorption.',
        recommendation: 'Separate these actives (e.g., Vitamin C in AM, Acids in PM).'
      }
    ];

    const hardcodedWarnings: any[] = [];
    const seenCloggers = new Set<string>();

    // 1. Detect Pore Cloggers
    for (const [slot, products] of Object.entries(routineSlots as Record<string, any[]>)) {
      for (const product of products) {
        if (!product) continue;
        
        let ingredientsArray: string[] = [];
        if (product.ingredients) {
            if (Array.isArray(product.ingredients)) {
                 ingredientsArray = product.ingredients;
            } else if (typeof product.ingredients === 'string') {
                 ingredientsArray = product.ingredients.split(',').map((s: string) => s.trim());
            }
        }

        const searchString = [
            product.name || '', 
            product.brand || '', 
            product.category || '', 
            ...ingredientsArray
        ].join(' ').toLowerCase();

        const matchingIngredients = COMEDOGENIC_LIST.filter(clogger => searchString.includes(clogger));

        if (matchingIngredients.length > 0 && !seenCloggers.has(product.id)) {
            seenCloggers.add(product.id);
            hardcodedWarnings.push({
               id: `clogger-${product.id}`,
               type: 'pore-clogger',
               productIds: [product.id],
               violatingIngredients: matchingIngredients,
               message: `${product.name} contains highly comedogenic ingredients.`,
               recommendation: `Consider swapping this out for a non-comedogenic alternative to prevent breakouts.`
            });
        }
      }

      // 2. Detect Common Actives Clashes within the same slot (e.g. AM or PM)
      if (!products || products.length < 2) continue;
      
      const slotText = products.map(p => {
        let arr = [];
        if (Array.isArray(p.ingredients)) arr = p.ingredients;
        else if (typeof p.ingredients === 'string') arr = p.ingredients.split(',');
        return [p.name || '', p.brand || '', ...arr].join(' ').toLowerCase();
      });

      for (const rule of CLASH_RULES) {
          // Are the keywords present in ANY of the products in this slot?
          const hasKeywordProduct = slotText.find(text => rule.keywords.some(kw => text.includes(kw)));
          const hasClashProduct = slotText.find(text => rule.clashesWith.some(cw => text.includes(cw)));
          
          // Ensure they are two DIFFERENT products clashing, not an all-in-one serum that is stabilized
          if (hasKeywordProduct && hasClashProduct && hasKeywordProduct !== hasClashProduct) {
              const ruleId = `clash-${slot}-${rule.keywords[0]}`;
              // Prevent duplicates if already flagged
              if (!hardcodedWarnings.find(w => w.id === ruleId)) {
                  hardcodedWarnings.push({
                     id: ruleId,
                     type: 'clash',
                     productIds: products.map(p => p.id),
                     message: rule.message,
                     recommendation: rule.recommendation
                  });
              }
          }
      }
    }

    return NextResponse.json({ warnings: hardcodedWarnings });

  } catch (err: any) {
    console.error("Warning Analysis Error:", err);
    return NextResponse.json({ error: err.message || 'Failed to generate warnings' }, { status: 500 });
  }
}
