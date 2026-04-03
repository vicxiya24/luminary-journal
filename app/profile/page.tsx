'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive']

const SKIN_CONCERNS = [
  'Acne',
  'Blackheads',
  'Dryness',
  'Redness',
  'Hyperpigmentation',
  'Fine Lines',
  'Dullness',
  'Large Pores',
  'Texture',
  'Dark Circles',
]

const MEDICATIONS = [
  'Isotretinoin / Accutane',
  'Oral Retinoids',
  'Tretinoin / Tazarotene',
  'Spironolactone',
  'Hormonal Birth Control',
  'Doxycycline / Minocycline',
  'Methotrexate',
  'Corticosteroids',
  'Lithium',
  'None of the above',
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  
  // Profile State
  const [skinType, setSkinType] = useState('')
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])
  const [sensitivityLevel, setSensitivityLevel] = useState(3)
  const [medications, setMedications] = useState<string[]>([])

  // Custom Products State
  const [customProducts, setCustomProducts] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/')
        return
      }

      setUserId(user.id)

      // Fetch User Profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setSkinType(profile.skin_type.charAt(0).toUpperCase() + profile.skin_type.slice(1))
        setSkinConcerns(profile.skin_concerns || [])
        setSensitivityLevel(profile.sensitivity_level || 3)
        setMedications(profile.medications || [])
      }

      // Fetch Custom Products
      const { data: products } = await supabase
        .from('custom_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (products) {
        setCustomProducts(products)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('users')
      .update({
        skin_type: skinType.toLowerCase(),
        skin_concerns: skinConcerns,
        sensitivity_level: sensitivityLevel,
        medications: medications,
      })
      .eq('id', userId)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleDeleteCustomProduct = async (productId: string) => {
    const { error } = await supabase
      .from('custom_products')
      .delete()
      .eq('id', productId)

    if (!error) {
      setCustomProducts(prev => prev.filter(p => p.id !== productId))
    }
  }

  if (loading) {
    return <div className="p-10">Loading profile...</div>
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-4">
        <div className="text-xl font-bold tracking-tight">Luminary Journal</div>
        <nav className="flex gap-8 text-sm font-medium text-neutral-500">
          <Link href="/dashboard" className="hover:text-black">Dashboard</Link>
          <Link href="/routine" className="hover:text-black">Routine</Link>
          <Link href="/journal" className="hover:text-black">Journal</Link>
          <Link href="/simulate" className="hover:text-black">Simulate</Link>
          <Link href="/profile" className="text-black">Profile</Link>
        </nav>
        <button
          onClick={handleSignOut}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Left Column: Skin Profile */}
        <section className="flex-1 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold">Skin Profile</h1>
            <p className="text-neutral-500 mt-1">Update your base metrics. This adjusts how the AI analyzes your routine.</p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm border border-neutral-100">
            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* Skin Type */}
              <div>
                <label className="mb-2 block text-sm font-medium">Skin Type</label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 p-3 bg-white"
                >
                  <option value="">Select your skin type</option>
                  {SKIN_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Skin Concerns */}
              <div>
                <p className="mb-3 text-sm font-medium">Skin Concerns</p>
                <div className="flex flex-wrap gap-2">
                  {SKIN_CONCERNS.map((concern) => {
                    const selected = skinConcerns.includes(concern)
                    return (
                      <button
                        type="button"
                        key={concern}
                        onClick={() =>
                          setSkinConcerns((prev) =>
                            selected ? prev.filter((c) => c !== concern) : [...prev, concern]
                          )
                        }
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        {concern}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sensitivity */}
              <div>
                <label className="mb-4 block text-sm font-medium">
                  Sensitivity Level: {sensitivityLevel} / 5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={sensitivityLevel}
                  onChange={(e) => setSensitivityLevel(parseInt(e.target.value))}
                  className="h-2 w-full appearance-none rounded-full bg-neutral-200 accent-black outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                />
                <div className="mt-2 flex justify-between text-xs text-neutral-500">
                  <span>1 — Tough as nails</span>
                  <span>5 — Reacts to everything</span>
                </div>
              </div>

              {/* Medications */}
              <div>
                <p className="mb-3 text-sm font-medium">Active Medications</p>
                <div className="flex flex-col gap-2">
                  {MEDICATIONS.map((med) => {
                    const selected = medications.includes(med)
                    return (
                      <button
                        type="button"
                        key={med}
                        onClick={() => {
                          if (med === 'None of the above') {
                            setMedications(['None of the above'])
                          } else {
                            setMedications((prev) => {
                              const withoutNone = prev.filter((m) => m !== 'None of the above')
                              return selected
                                ? withoutNone.filter((m) => m !== med)
                                : [...withoutNone, med]
                            })
                          }
                        }}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selected ? 'border-white bg-white' : 'border-neutral-300'
                          }`}
                        >
                          {selected && <div className="h-2.5 w-2.5 bg-black" />}
                        </div>
                        {med}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-black px-6 py-3 font-medium text-white shadow-md disabled:opacity-50 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {saving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Custom Products */}
        <section className="flex-1 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold">Your Custom Products</h1>
            <p className="text-neutral-500 mt-1">Manage items you’ve manually added to the database.</p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm border border-neutral-100">
            {customProducts.length === 0 ? (
              <div className="text-center py-10 px-6 border border-dashed border-neutral-200 rounded-2xl">
                <p className="text-neutral-500 mb-4">You haven't added any custom products yet.</p>
                <Link href="/routine" className="text-sm font-medium bg-neutral-100 hover:bg-neutral-200 py-2 px-4 rounded-xl transition">
                  Go to Routine Builder to add one
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {customProducts.map(product => (
                  <div key={product.id} className="border border-neutral-100 p-4 rounded-2xl flex items-start gap-4 hover:border-neutral-300 transition group">
                    <div className="h-10 w-10 flex-shrink-0 bg-neutral-100 rounded-full flex items-center justify-center text-lg">
                      ✨
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">{product.name}</p>
                      <p className="text-sm text-neutral-500">{product.brand} • {product.category}</p>
                      <p className="text-xs text-neutral-400 mt-2 truncate max-w-xs">{product.ingredients.join(', ')}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteCustomProduct(product.id)}
                      className="opacity-0 group-hover:opacity-100 text-sm text-red-500 hover:text-red-700 transition px-2 py-1 bg-red-50 rounded-lg whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}