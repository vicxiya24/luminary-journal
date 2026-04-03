'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRODUCTS, type Product } from '@/lib/data/products'

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const

const TIMES = [
  { key: 'am', label: 'AM' },
  { key: 'pm', label: 'PM' },
] as const

type SlotKey =
  | 'mon_am' | 'mon_pm'
  | 'tue_am' | 'tue_pm'
  | 'wed_am' | 'wed_pm'
  | 'thu_am' | 'thu_pm'
  | 'fri_am' | 'fri_pm'
  | 'sat_am' | 'sat_pm'
  | 'sun_am' | 'sun_pm'

type RoutineSlots = Record<SlotKey, Product[]>

const createEmptySlots = (): RoutineSlots => ({
  mon_am: [],
  mon_pm: [],
  tue_am: [],
  tue_pm: [],
  wed_am: [],
  wed_pm: [],
  thu_am: [],
  thu_pm: [],
  fri_am: [],
  fri_pm: [],
  sat_am: [],
  sat_pm: [],
  sun_am: [],
  sun_pm: [],
})

const getCurrentWeekStart = () => {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

export default function RoutinePage() {
  const router = useRouter()
  const supabase = createClient()
  const [slots, setSlots] = useState<RoutineSlots>(createEmptySlots())
  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{ slotKey: SlotKey; index: number } | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/')
        return
      }

      const weekStart = getCurrentWeekStart()

      setUserId(user.id)

      const { data: customData } = await supabase
        .from('custom_products')
        .select('*')
        .eq('user_id', user.id)

      if (customData) {
        setCustomProducts(customData)
      }

      const allProducts = [...PRODUCTS, ...(customData || [])]

      const { data: routine, error } = await supabase
        .from('routines')
        .select('slots')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (error) {
        console.error(error.message)
        setLoading(false)
        return
      }

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
  }, [router, supabase])

  const allProducts = useMemo(() => [...PRODUCTS, ...customProducts], [customProducts])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allProducts

    return allProducts.filter((product) =>
      `${product.brand} ${product.name} ${product.category}`
        .toLowerCase()
        .includes(q)
    )
  }, [search, allProducts])

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
      console.error(error.message)
    }
    
    setIsSavingCustom(false)
  }

  const handleDeleteCustomProduct = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    const { error } = await supabase.from('custom_products').delete().eq('id', productId)
    if (!error) {
      setCustomProducts((prev) => prev.filter((p) => p.id !== productId))
      // Remove from active slots
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

      return {
        ...prev,
        [selectedSlot]: [...prev[selectedSlot], product],
      }
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

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const applySelectedToAll = (time: 'am' | 'pm') => {
    if (!selectedSlot) return
    if (!selectedSlot.endsWith(time)) return

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

  const saveRoutine = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/')
      return
    }

    const filledCount = Object.values(slots).filter((slot) => slot.length > 0).length
    if (filledCount === 0) {
      alert('Add at least one product before saving your routine.')
      return
    }

    setSaving(true)

    const slotIdsOnly = Object.fromEntries(
      Object.entries(slots).map(([key, products]) => [
        key,
        products.map((product) => product.id),
      ])
    )

    const weekStart = getCurrentWeekStart()

    const { data: existing } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle()

    let error;

    if (existing) {
      const { error: updateError } = await supabase
        .from('routines')
        .update({ slots: slotIdsOnly })
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          week_start: weekStart,
          slots: slotIdsOnly,
        })
      error = insertError
    }

    setSaving(false)

    if (error) {
      console.error(error.message)
      alert('Failed to save routine.')
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  if (loading) {
    return <div className="p-10">Loading routine...</div>
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">Luminary Journal</h1>



        <button
          onClick={handleSignOut}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">Step 3 of 3</p>
            <h2 className="text-3xl font-semibold">Build your weekly routine</h2>
            <p className="mt-2 text-neutral-600">
              Click a slot to add products for that day and time.
            </p>
          </div>

          <button
            onClick={saveRoutine}
            disabled={saving}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save routine'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2.5fr_1fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 grid grid-cols-[60px_repeat(7,minmax(0,1fr))] gap-3">
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
                                className={`group flex items-start gap-1 rounded-lg border px-1.5 py-1.5 text-left text-[11px] leading-tight shadow-sm cursor-grab active:cursor-grabbing ${
                                  draggedItem?.slotKey === slotKey && draggedItem.index === index
                                    ? 'border-black bg-neutral-100 opacity-50'
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
          </div>

          <aside className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Product picker</h3>

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
              className="mt-4 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none"
            />

            {!isCreatingCustom && (
              <button
                type="button"
                onClick={() => setIsCreatingCustom(true)}
                className="mt-2 text-xs text-neutral-500 hover:text-black underline underline-offset-2"
              >
                Can&apos;t find your product? Add a custom one.
              </button>
            )}

            {isCreatingCustom && (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm text-sm">
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

            <div className="mt-4 flex flex-wrap gap-2">
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

            <div className="mt-6 space-y-3">
              {filteredProducts.map((product) => {
                const isCustom = customProducts.some((cp) => cp.id === product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!selectedSlot}
                    onClick={() => addProductToSlot(product)}
                    className="group relative block w-full rounded-2xl border border-neutral-200 p-4 text-left hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
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

            <p className="mt-6 text-xs text-neutral-500">
              Tip: apply products from thinnest to thickest consistency.
            </p>
          </aside>
        </div>
      </section>
    </main>
  )
}