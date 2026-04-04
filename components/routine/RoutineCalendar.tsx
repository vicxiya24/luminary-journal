'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PRODUCTS, type Product } from '@/lib/data/products'
import { ProductScores, type ProductScoreData } from '@/components/routine/ProductScores'

export const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const

export const TIMES = [
  { key: 'am', label: 'AM' },
  { key: 'pm', label: 'PM' },
] as const

export type SlotKey =
  | 'mon_am' | 'mon_pm'
  | 'tue_am' | 'tue_pm'
  | 'wed_am' | 'wed_pm'
  | 'thu_am' | 'thu_pm'
  | 'fri_am' | 'fri_pm'
  | 'sat_am' | 'sat_pm'
  | 'sun_am' | 'sun_pm'

export type RoutineSlots = Record<SlotKey, Product[]>

export const createEmptySlots = (): RoutineSlots => ({
  mon_am: [], mon_pm: [],
  tue_am: [], tue_pm: [],
  wed_am: [], wed_pm: [],
  thu_am: [], thu_pm: [],
  fri_am: [], fri_pm: [],
  sat_am: [], sat_pm: [],
  sun_am: [], sun_pm: [],
})

interface RoutineCalendarProps {
  userId: string
  weekStart: string
  onSaveRoutine?: (slots: RoutineSlots) => void
  saveLabel?: string
  title?: string
  description?: string
  hideHeader?: boolean
  journalMode?: boolean
}

export function RoutineCalendar({
  userId,
  weekStart,
  onSaveRoutine,
  saveLabel = "Save routine",
  title = "Build your weekly routine",
  description = "Click a slot to add products for that day and time.",
  hideHeader = false,
  journalMode = false
}: RoutineCalendarProps) {
  const supabase = createClient()
  const [slots, setSlots] = useState<RoutineSlots>(createEmptySlots())
  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{ slotKey: SlotKey; index: number } | null>(null)

  const [warnings, setWarnings] = useState<any[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set())
  const [scanCompleted, setScanCompleted] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'picker' | 'analysis'>('picker')
  const [productScores, setProductScores] = useState<Record<string, ProductScoreData>>({})

  const [customProducts, setCustomProducts] = useState<Product[]>([])
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [customIngredients, setCustomIngredients] = useState('')
  const [isSavingCustom, setIsSavingCustom] = useState(false)
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    const loadRoutine = async () => {
      setLoading(true)
      const { data: customData } = await supabase
        .from('custom_products')
        .select('*')
        .eq('user_id', userId)

      if (customData) {
        setCustomProducts(customData)
      }

      const allProducts = [...PRODUCTS, ...(customData || [])]

      // Fetch routine for the given weekStart
      const { data: routine, error } = await supabase
        .from('routines')
        .select('slots')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (error) {
        console.error(error.message)
        setLoading(false)
        return
      }

      // Pre-fill last week logic if we wanted, but caller can handle passing weekStart.
      if (routine?.slots) {
        const rebuilt = createEmptySlots()
        const routineSlots = routine.slots as Partial<Record<SlotKey, string[]>>

        for (const key in routineSlots) {
          const slotKey = key as SlotKey
          const rawValue = routineSlots[slotKey]
          const productIds = Array.isArray(rawValue) ? rawValue : []

          rebuilt[slotKey] = productIds
            .map((id) => allProducts.find((product) => product.id === String(id)))
            .filter(Boolean) as Product[]
        }
        setSlots(rebuilt)
      }

      setLoading(false)
    }

    loadRoutine()
  }, [userId, weekStart, supabase])

  const allProducts = useMemo(() => [...PRODUCTS, ...customProducts], [customProducts])

  const uniqueActiveProducts = useMemo(() => {
    const map = new Map<string, Product>()
    Object.values(slots).forEach(arr => arr.forEach(p => map.set(p.id, p)))
    return Array.from(map.values())
  }, [slots])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allProducts

    return allProducts.filter((product) =>
      `${product.brand} ${product.name} ${product.category}`
        .toLowerCase()
        .includes(q)
    )
  }, [search, allProducts])

  const activeOffendingIds = useMemo(() => {
    return new Set(
      warnings
        .filter(w => !dismissedWarnings.has(w.id))
        .flatMap(w => w.productIds)
    )
  }, [warnings, dismissedWarnings])

  const handleSaveCustomProduct = async () => {
    if (!userId || !customBrand || !customName || !customCategory) return
    setIsSavingCustom(true)
    setCustomError('')

    const ingredientsArray = customIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean)

    const newProduct = {
      user_id: userId,
      brand: customBrand,
      name: customName,
      category: customCategory,
      ingredients: ingredientsArray,
    }

    const { data, error } = await supabase
      .from('custom_products')
      .insert(newProduct)
      .select()
      .single()

    if (!error && data) {
      setCustomProducts((prev) => [...prev, data])
      setIsCreatingCustom(false)
      setCustomBrand('')
      setCustomName('')
      setCustomCategory('')
      setCustomIngredients('')
      setCustomError('')
    } else if (error) {
      setCustomError(error.message)
    }
    setIsSavingCustom(false)
  }

  const handleDeleteCustomProduct = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    const { error } = await supabase.from('custom_products').delete().eq('id', productId)
    if (!error) {
      setCustomProducts((prev) => prev.filter((p) => p.id !== productId))
      setSlots((prev) => {
        const next = { ...prev }
        for (const key in next) {
          next[key as SlotKey] = next[key as SlotKey].filter((p) => p.id !== productId)
        }
        return next
      })
    }
  }

  const addProductToSlot = (product: Product) => {
    if (!selectedSlot) return
    setSlots((prev) => {
      const alreadyExists = prev[selectedSlot].some((p) => p.id === product.id)
      if (alreadyExists) return prev
      return { ...prev, [selectedSlot]: [...prev[selectedSlot], product] }
    })
  }

  const removeProductFromSlot = (slotKey: SlotKey, productId: string) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: prev[slotKey].filter((product) => product.id !== productId),
    }))
  }

  const handleDragStart = (e: React.DragEvent, slotKey: SlotKey, index: number) => {
    setDraggedItem({ slotKey, index })
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({ slotKey, index }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetSlotKey: SlotKey, targetIndex?: number) => {
    e.preventDefault()
    e.stopPropagation()

    let sourceSlotKey: SlotKey
    let sourceIndex: number

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      sourceSlotKey = data.slotKey
      sourceIndex = data.index
    } catch {
      if (!draggedItem) return
      sourceSlotKey = draggedItem.slotKey
      sourceIndex = draggedItem.index
    }

    if (sourceSlotKey !== targetSlotKey) {
      setDraggedItem(null)
      return
    }

    if (targetIndex !== undefined && sourceIndex === targetIndex) {
      setDraggedItem(null)
      return
    }

    setSlots((prev) => {
      const next = { ...prev }
      const slotProducts = [...next[sourceSlotKey]]
      const [movedItem] = slotProducts.splice(sourceIndex, 1)

      if (targetIndex !== undefined) {
        slotProducts.splice(targetIndex, 0, movedItem)
      } else {
        slotProducts.push(movedItem)
      }
      next[sourceSlotKey] = slotProducts
      return next
    })
    setDraggedItem(null)
  }

  const handleDragEnd = () => setDraggedItem(null)

  const applySelectedToAll = (time: 'am' | 'pm') => {
    if (!selectedSlot || !selectedSlot.endsWith(time)) return
    const sourceProducts = slots[selectedSlot]
    setSlots((prev) => {
      const next = { ...prev }
      for (const day of DAYS) {
        const key = `${day.key}_${time}` as SlotKey
        next[key] = [...sourceProducts]
      }
      return next
    })
  }

  const applySelectedDayToAll = () => {
    if (!selectedSlot) return
    const currentDay = selectedSlot.split('_')[0]
    const amProducts = slots[`${currentDay}_am` as SlotKey]
    const pmProducts = slots[`${currentDay}_pm` as SlotKey]

    setSlots((prev) => {
      const next = { ...prev }
      for (const day of DAYS) {
        next[`${day.key}_am` as SlotKey] = [...amProducts]
        next[`${day.key}_pm` as SlotKey] = [...pmProducts]
      }
      return next
    })
  }

  const analyzeIngredients = async () => {
    setAnalyzing(true)
    setWarnings([])
    setDismissedWarnings(new Set())
    setScanCompleted(false)
    
    const activeRoutine = Object.fromEntries(
      Object.entries(slots).filter(([_, products]) => products.length > 0)
    )

    try {
      const uniqueProds = Array.from(
        new Map(Object.values(activeRoutine).flat().map(p => [p.id, p])).values()
      )

      const [warningsRes, scoresRes] = await Promise.all([
        fetch('/api/analyze/warnings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            routineSlots: activeRoutine,
            mergedProducts: allProducts
          })
        }),
        fetch('/api/analyze/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uniqueProducts: uniqueProds })
        })
      ])
      
      const wData = await warningsRes.json()
      const sData = await scoresRes.json()

      if (wData.error) throw new Error(wData.error)
      if (sData.error) throw new Error(sData.error)

      if (wData.warnings) setWarnings(wData.warnings)
      if (sData.scores) {
        setProductScores(
          Object.fromEntries(sData.scores.map((s: any) => [s.productId, s]))
        )
      }
      
      setScanCompleted(true)
      setActiveTab('analysis')
    } catch (error: any) {
      console.error(error)
      alert("Analysis failed: " + error.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const dismissWarning = (id: string) => {
    setDismissedWarnings(prev => {
      const newSet = new Set(prev)
      newSet.add(id)
      return newSet
    })
  }

  const saveRoutineAction = async () => {
    const filledCount = Object.values(slots).filter((slot) => slot.length > 0).length
    if (filledCount === 0) {
      alert('Add at least one product before saving.')
      return
    }

    setSaving(true)
    setScanCompleted(false) // clear scan results on save

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
      .eq('week_start', weekStart)
      .maybeSingle()

    let error;
    let targetRoutineId;

    if (existing) {
      const { error: updateError } = await supabase
        .from('routines')
        .update({ slots: slotIdsOnly })
        .eq('id', existing.id)
        
      error = updateError
      targetRoutineId = existing.id
    } else {
      const { data: newRoutine, error: insertError } = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          week_start: weekStart,
          slots: slotIdsOnly,
        })
        .select('id')
        .single()
        
      error = insertError
      targetRoutineId = newRoutine?.id
    }

    setSaving(false)

    if (error) {
      console.error(error.message)
      alert('Failed to save routine.')
      return
    }

    // BACKGROUND AUTOMATION: Trigger AI Projection silently
    if (targetRoutineId) {
      const fullSlots = Object.fromEntries(
        Object.entries(slots).filter(([_, products]) => products.length > 0)
      )

      fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineId: targetRoutineId,
          slots: fullSlots,
          weekStart: weekStart,
        })
      }).catch(console.error)
    }

    if (onSaveRoutine) {
      onSaveRoutine(slots)
    }
  }

  if (loading) {
    return <div className="p-10">Loading routine layout...</div>
  }

  return (
    <>
      {!hideHeader && (
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">{title}</h2>
            <p className="mt-2 text-neutral-600">{description}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={analyzeIngredients}
              disabled={analyzing}
              className="rounded-xl border border-neutral-300 px-5 py-3 text-black hover:bg-neutral-50 disabled:opacity-50 font-medium"
            >
              {analyzing ? 'Scanning...' : 'Scan Full Week'}
            </button>
            <button
              onClick={saveRoutineAction}
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : saveLabel}
            </button>
          </div>
        </div>
      )}

      {warnings.filter(w => !dismissedWarnings.has(w.id)).length > 0 && (
        <div className="mb-6 space-y-3">
          {warnings.filter(w => !dismissedWarnings.has(w.id)).map(warning => (
            <div key={warning.id} className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${warning.type === 'clash' ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <div>
                <div className="font-semibold mb-1 flex items-center gap-2">
                  {warning.type === 'clash' ? '⚠️ Routine Clash Detected' : '🚫 Pore-Clogger Detected'}
                </div>
                <p className="text-sm opacity-90">{warning.message}</p>
                {warning.violatingIngredients && warning.violatingIngredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {warning.violatingIngredients.map((ing: string) => (
                       <span key={ing} className="px-2 py-0.5 bg-red-100/90 border border-red-200 text-red-800 rounded-md text-xs font-bold uppercase tracking-wider">{ing}</span>
                    ))}
                  </div>
                )}
                {warning.recommendation && (
                  <p className="text-sm mt-3 font-medium">💡 Tip: {warning.recommendation}</p>
                )}
              </div>
              <button onClick={() => dismissWarning(warning.id)} className="text-xs opacity-60 hover:opacity-100 font-medium whitespace-nowrap px-2 py-1 bg-white/50 rounded-lg">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {scanCompleted && warnings.filter(w => !dismissedWarnings.has(w.id)).length === 0 && (
        <div className="mb-6 bg-green-50 text-green-900 border border-green-200 p-4 rounded-xl flex items-center justify-between">
          <div>
             <span className="font-semibold">✨ Routine checks out!</span> No pore-cloggers or active clashes detected in this week's routine.
          </div>
          <button onClick={() => setScanCompleted(false)} className="text-xs opacity-60 hover:opacity-100 font-medium px-2 py-1 bg-white/50 rounded-lg">Dismiss</button>
        </div>
      )}

      <div className={`grid gap-6 lg:grid-cols-[2.5fr_1fr] bg-neutral-50 px-2 py-4 -mx-2 sm:px-4 sm:py-6 sm:-mx-4 rounded-3xl ${journalMode ? 'bg-cyan-50/60 outline outline-1 outline-cyan-200' : ''}`}>
        <div className={`rounded-3xl border shadow-sm overflow-x-auto p-6 ${journalMode ? 'bg-white/70 backdrop-blur-md border-cyan-200 shadow-cyan-900/10' : 'bg-white border-neutral-200'}`}>
          <div className="mb-4 grid grid-cols-[60px_repeat(7,minmax(120px,1fr))] gap-3 min-w-[900px]">
            <div />
            {DAYS.map((day) => (
              <div
                key={day.key}
                className="rounded-2xl bg-neutral-100 px-3 py-2 text-center text-sm font-medium"
              >
                {day.label}
              </div>
            ))}

            {TIMES.map((time) => (
              <div key={time.key} className="contents">
                <div className="flex items-center rounded-2xl bg-neutral-100 px-4 text-sm font-medium">
                  {time.label}
                </div>

                {DAYS.map((day) => {
                  const slotKey = `${day.key}_${time.key}` as SlotKey
                  const isSelected = selectedSlot === slotKey

                  return (
                    <div
                      key={slotKey}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedSlot(slotKey)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, slotKey)}
                      className={`cursor-pointer ring-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-black min-h-[140px] rounded-2xl border p-2 text-left transition overflow-hidden ${isSelected
                          ? 'border-black bg-neutral-50 ring-1 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                        }`}
                    >
                      <div className="mb-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                        {day.label.slice(0, 3)} {time.label}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {slots[slotKey].length === 0 ? (
                          <span className="text-[11px] text-neutral-400">Empty</span>
                        ) : (
                          slots[slotKey].map((product, index) => (
                            <div
                              key={product.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, slotKey, index)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, slotKey, index)}
                              onDragEnd={handleDragEnd}
                              className={`group flex items-start gap-1 rounded-lg border px-1.5 py-1.5 text-left text-[11px] leading-tight shadow-sm cursor-grab active:cursor-grabbing transition-colors ${
                                draggedItem?.slotKey === slotKey && draggedItem.index === index
                                  ? 'border-black bg-neutral-100 opacity-50'
                                  : activeOffendingIds.has(product.id)
                                    ? 'border-red-400 bg-red-50 text-red-900 border-[1.5px] shadow-sm shadow-red-200/50'
                                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                                }`}
                            >
                              <span className="shrink-0 font-medium text-black">{index + 1}.</span>
                              <span className="flex-1 min-w-0 break-words">{product.name}</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeProductFromSlot(slotKey, product.id)
                                }}
                                className="cursor-pointer shrink-0 text-neutral-400 hover:text-red-500"
                              >
                                ×
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          
          {hideHeader && (
             <div className="mt-8 flex items-center justify-end">
               <button
                  onClick={saveRoutineAction}
                  disabled={saving}
                  className="rounded-xl bg-black px-6 py-3 text-white font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : saveLabel}
                </button>
             </div>
          )}
        </div>

        <aside className={`rounded-3xl border p-6 shadow-sm flex flex-col max-h-[800px] overflow-hidden ${
            journalMode ? 'bg-white/70 backdrop-blur-md border-cyan-200 shadow-cyan-900/10' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center gap-4 border-b border-neutral-200 mb-4 pb-2 shrink-0">
            <button 
              onClick={() => setActiveTab('picker')}
              className={`text-lg font-semibold transition ${activeTab === 'picker' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Add Products
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`text-lg font-semibold transition ${activeTab === 'analysis' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Analysis
            </button>
          </div>

          {activeTab === 'picker' ? (
            <>
              {selectedSlot ? (
            <p className="mt-2 text-sm text-neutral-600">
              Editing{' '}
              <span className="font-medium">
                {selectedSlot.replace('_', ' ').toUpperCase()}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">
              Select a routine slot to start adding products.
            </p>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="mt-4 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none shrink-0"
          />

          {!isCreatingCustom && (
            <button
              type="button"
              onClick={() => setIsCreatingCustom(true)}
              className="mt-2 text-xs text-neutral-500 hover:text-black underline underline-offset-2 shrink-0 text-left"
            >
              Can&apos;t find your product? Add a custom one.
            </button>
          )}

          {isCreatingCustom && (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm text-sm shrink-0 overflow-y-auto">
              <h4 className="mb-3 font-semibold">Custom Product</h4>
              <div className="space-y-3">
                <input
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Brand (e.g. CeraVe)"
                  className="w-full rounded-lg border p-2 outline-none"
                />
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Product Name"
                  className="w-full rounded-lg border p-2 outline-none"
                />
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Category (e.g. Cleanser)"
                  className="w-full rounded-lg border p-2 outline-none"
                />
                <textarea
                  value={customIngredients}
                  onChange={(e) => setCustomIngredients(e.target.value)}
                  placeholder="Ingredients separated by commas (optional)"
                  className="w-full rounded-lg border p-2 outline-none text-xs"
                  rows={3}
                />
                {customError && (
                  <div className="text-xs text-red-500 font-medium">
                    Error: {customError}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveCustomProduct}
                    disabled={isSavingCustom || !customBrand || !customName || !customCategory}
                    className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                  >
                    {isSavingCustom ? 'Saving...' : 'Save Product'}
                  </button>
                  <button
                    onClick={() => setIsCreatingCustom(false)}
                    className="rounded-lg border px-4 py-2 text-neutral-600 hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => applySelectedToAll('am')}
              className="rounded-full border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              Apply to all mornings
            </button>
            <button
              type="button"
              onClick={() => applySelectedToAll('pm')}
              className="rounded-full border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              Apply to all evenings
            </button>
            <button
              type="button"
              onClick={applySelectedDayToAll}
              className="rounded-full border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50"
            >
              Copy this day to all days
            </button>
          </div>

          <div className="mt-6 space-y-3 overflow-y-auto basis-0 min-h-0 flex-1">
            {filteredProducts.map((product) => {
              const isCustom = customProducts.some((cp) => cp.id === product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => addProductToSlot(product)}
                  className="group relative block w-full rounded-2xl border border-neutral-200 p-4 text-left hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                >
                  <div className="font-medium pr-6">{product.name}</div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {product.brand} · {product.category}
                  </div>
                  {isCustom && (
                    <div
                      role="button"
                      onClick={(e) => handleDeleteCustomProduct(e, product.id)}
                      className="absolute right-4 top-4 text-neutral-300 hover:text-red-500 z-10"
                      title="Delete custom product"
                    >
                      🗑️
                    </div>
                  )}
                </button>
              )
            })}
          </div>

            <p className="mt-6 text-xs text-neutral-500 shrink-0">
              Tip: apply products from thinnest to thickest consistency.
            </p>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 content-start pt-2">
              {Object.keys(productScores).length === 0 ? (
                <div className="text-center text-sm text-neutral-500 py-10">
                   Click "Scan Full Week" to generate standard dermatological scoring for active products in your routine.
                </div>
              ) : (
                uniqueActiveProducts.map(product => {
                  const scores = productScores[product.id];
                  if (!scores) return null;
                  return <ProductScores key={product.id} product={product} scores={scores} />
                })
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
