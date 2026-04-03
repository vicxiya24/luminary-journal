'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoutineCalendar, type RoutineSlots } from '@/components/routine/RoutineCalendar'

const METRICS = [
  { key: 'oiliness', label: 'Oiliness', icon: '💧', descLow: 'Matte', descHigh: 'Very shiny' },
  { key: 'dryness', label: 'Dryness', icon: '🌵', descLow: 'Hydrated', descHigh: 'Peeling/Tight' },
  { key: 'irritation', label: 'Irritation', icon: '🔥', descLow: 'Calm', descHigh: 'Red/Stinging' },
  { key: 'breakouts', label: 'Breakouts', icon: '🔴', descLow: 'Clear', descHigh: 'Active acne' },
  { key: 'satisfaction', label: 'Satisfaction', icon: '💖', descLow: 'Frustrated', descHigh: 'Very happy' },
] as const

const DIET_TAGS = [
  'High sugar',
  'Dairy',
  'Alcohol',
  'Lots of water',
  'Low water',
  'Processed food',
  'Mostly whole foods',
  'High stress',
  'Poor sleep',
  'Travel / environment change',
  'Hormonal week',
]

interface CheckInFlowProps {
  userId: string
  weekStart: string
  onComplete: () => void
  onCancel: () => void
}

export function CheckInFlow({ userId, weekStart, onComplete, onCancel }: CheckInFlowProps) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 2 State
  const [metrics, setMetrics] = useState({
    oiliness: 3,
    dryness: 3,
    irritation: 1,
    breakouts: 1,
    satisfaction: 3,
  })

  // Step 3 State
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSaveForNextWeek = async (slots: RoutineSlots) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + 7)
    const nextWeekStart = date.toISOString().slice(0, 10)

    const slotIdsOnly = Object.fromEntries(
      Object.entries(slots).map(([key, products]) => [
        key,
        products.map((product) => product.id),
      ])
    )

    const { data: existing } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', nextWeekStart)
      .maybeSingle()

    if (existing) {
      await supabase.from('routines').update({ slots: slotIdsOnly }).eq('id', existing.id)
    } else {
      await supabase.from('routines').insert({
        user_id: userId,
        week_start: nextWeekStart,
        slots: slotIdsOnly,
      })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')

    // First fetch the routine_id for this week to link it
    const { data: routineData } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle()

    const { error: insertError } = await supabase.from('journal_entries').upsert({
      user_id: userId,
      week_start: weekStart,
      oiliness: metrics.oiliness,
      dryness: metrics.dryness,
      irritation: metrics.irritation,
      breakouts: metrics.breakouts,
      satisfaction: metrics.satisfaction,
      diet_tags: selectedTags,
      routine_id: routineData?.id || null,
    }, { onConflict: 'user_id,week_start' })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onComplete()
  }

  return (
    <div className={`mx-auto rounded-3xl bg-white p-8 shadow-sm ${step === 1 ? 'w-full' : 'max-w-4xl'}`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Step {step} of 3</p>
          <h2 className="text-2xl font-semibold">
            {step === 1 && 'Routine Review'}
            {step === 2 && 'Skin Metrics'}
            {step === 3 && 'Lifestyle Overview'}
          </h2>
        </div>
        <button onClick={onCancel} className="text-sm font-medium text-neutral-500 hover:text-black">
          Cancel check-in
        </button>
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="mb-6 text-neutral-600">
            Confirm your routine for the week of <span className="font-semibold">{weekStart}</span>. We&apos;ve pre-loaded your most recent setup. Drag and drop any changes, then confirm.
          </p>
          <RoutineCalendar
            userId={userId}
            weekStart={weekStart}
            hideHeader={true}
            journalMode={true}
            saveLabel="Looks correct →"
            onSaveRoutine={async (slots) => {
              await handleSaveForNextWeek(slots)
              setStep(2)
            }}
          />
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="mb-8 text-neutral-600">
            How has your skin been feeling over the past 7 days? Be honest—this helps the AI adjust its future projections!
          </p>

          <div className="space-y-10">
            {METRICS.map((metric) => (
              <div key={metric.key}>
                <label className="flex items-center gap-3 text-lg font-medium">
                  <span className="text-2xl">{metric.icon}</span> {metric.label}
                  <span className="ml-auto rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
                    {metrics[metric.key as keyof typeof metrics]} / 5
                  </span>
                </label>
                <div className="mt-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={metrics[metric.key as keyof typeof metrics]}
                    onChange={(e) =>
                      setMetrics({
                        ...metrics,
                        [metric.key]: parseInt(e.target.value),
                      })
                    }
                    className="h-2 w-full appearance-none rounded-full bg-neutral-200 accent-black outline-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                  />
                  <div className="mt-2 flex justify-between text-xs font-medium text-neutral-500">
                    <span>1 — {metric.descLow}</span>
                    <span>5 — {metric.descHigh}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-xl font-medium text-neutral-500 hover:text-black"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-xl bg-black px-6 py-3 text-white"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="mb-8 text-neutral-600">
            Did any of these lifestyle factors apply to you this week? Diet and stress play a massive role in skin barrier health.
          </p>

          <div className="flex flex-wrap gap-3">
            {DIET_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-md'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>

          {error && (
            <div className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Error saving journal: {error}
            </div>
          )}

          <div className="mt-10 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="rounded-xl font-medium text-neutral-500 hover:text-black"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-black px-8 py-3 font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Completing Check-In...' : 'Finish Weekly Check-In'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
