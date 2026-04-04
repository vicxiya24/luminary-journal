import React from 'react';
import type { Product } from '@/lib/data/products';

export interface ProductScoreData {
  irritationRisk: number;
  redundancy: number;
  barrierSupport: number;
  comedogenicity: number;
  phCompatibility: number;
}

interface ProductScoresProps {
  product: Product;
  scores: ProductScoreData;
}

export function ProductScores({ product, scores }: ProductScoresProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm shrink-0 w-full mb-3">
      <div className="font-semibold text-sm mb-1">{product.name}</div>
      <div className="text-xs text-neutral-500 mb-4">{product.brand}</div>
      
      <div className="space-y-3">
        <ScoreBar label="Irritation Risk" value={scores.irritationRisk} invertColors={true} />
        <ScoreBar label="Redundancy" value={scores.redundancy} invertColors={true} />
        <ScoreBar label="Barrier Support" value={scores.barrierSupport} invertColors={false} />
        <ScoreBar label="Comedogenicity" value={scores.comedogenicity} invertColors={true} />
        <ScoreBar label="pH Compatibility" value={scores.phCompatibility} invertColors={false} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, invertColors }: { label: string; value: number; invertColors: boolean }) {
  // invertColors = true means High value (10) is BAD (red).
  // invertColors = false means High value (10) is GOOD (green).
  
  let colorClass = 'bg-neutral-800';
  if (invertColors) {
    if (value >= 7) colorClass = 'bg-red-400';
    else if (value >= 4) colorClass = 'bg-orange-400';
    else colorClass = 'bg-emerald-400';
  } else {
    if (value >= 7) colorClass = 'bg-emerald-400';
    else if (value >= 4) colorClass = 'bg-orange-400';
    else colorClass = 'bg-red-400';
  }

  // Value is 1-10
  const percentage = Math.max(0, Math.min(100, (value / 10) * 100));

  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">
        <span>{label}</span>
        <span className="font-medium text-black">{value}/10</span>
      </div>
      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
