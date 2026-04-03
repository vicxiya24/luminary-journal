'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const [skinType, setSkinType] = useState('')
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])
  const [sensitivityLevel, setSensitivityLevel] = useState(3)
  const [medications, setMedications] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/')
        return
      }

      setUserId(user.id)
      setEmail(user.email ?? null)

      const { data: existingProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      const { data: existingRoutine, error: routineError } = await supabase
        .from('routines')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (routineError) {
        setError(routineError.message)
        setLoading(false)
        return
      }

      if (existingProfile && existingRoutine) {
        router.replace('/dashboard')
        return
      }

      if (existingProfile && !existingRoutine) {
        router.replace('/onboarding/routine')
        return
      }

      setLoading(false)
    }

    loadUser()
  }, [router, supabase])

  const toggleItem = (
    value: string,
    current: string[],
    setter: (items: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value))
    } else {
      setter([...current, value])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userId || !email) {
      setError('User session not found.')
      return
    }

    if (!skinType) {
      setError('Please select your skin type.')
      return
    }

    if (skinConcerns.length === 0) {
      setError('Please choose at least one skin concern.')
      return
    }

    if (medications.length === 0) {
      setError('Please select at least one medication option.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      skin_type: skinType.toLowerCase(),
      skin_concerns: skinConcerns,
      sensitivity_level: sensitivityLevel,
      medications,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    router.replace('/onboarding/routine')
  }

  if (loading) {
    return <div className="p-10">Loading onboarding...</div>
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm text-neutral-500">Step 2 of 3</p>
        <h1 className="mb-2 text-3xl font-semibold">Skin profile setup</h1>
        <p className="mb-8 text-neutral-600">
          Tell Luminary Journal about your skin so analysis can be personalized.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <label className="mb-2 block text-sm font-medium">Skin Type</label>
            <select
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 p-3"
            >
              <option value="">Select your skin type</option>
              {SKIN_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </section>

          <section>
            <p className="mb-3 text-sm font-medium">Skin Concerns</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERNS.map((concern) => {
                const selected = skinConcerns.includes(concern)
                return (
                  <button
                    type="button"
                    key={concern}
                    onClick={() =>
                      toggleItem(concern, skinConcerns, setSkinConcerns)
                    }
                    className={`rounded-full px-4 py-2 text-sm border ${selected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-neutral-300'
                      }`}
                  >
                    {concern}
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <label className="mb-2 block text-sm font-medium">
              Sensitivity Level: {sensitivityLevel}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={sensitivityLevel}
              onChange={(e) => setSensitivityLevel(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-neutral-500">
              <span>1 = Not sensitive</span>
              <span>5 = Very reactive</span>
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-medium">Medications</p>
            <div className="space-y-2">
              {MEDICATIONS.map((med) => (
                <label key={med} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={medications.includes(med)}
                    onChange={() => toggleItem(med, medications, setMedications)}
                  />
                  <span>{med}</span>
                </label>
              ))}
            </div>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}