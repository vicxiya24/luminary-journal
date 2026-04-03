'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useChat } from 'ai/react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { PRODUCTS, type Product } from '@/lib/data/products'

const getCurrentWeekStart = () => {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

export default function SimulatePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [skinProfile, setSkinProfile] = useState<any>(null)
  const [routine, setRoutine] = useState<any>(null)
  const [customProducts, setCustomProducts] = useState<Product[]>([])

  const mergedProducts = useMemo(() => {
    return [...PRODUCTS, ...customProducts]
  }, [customProducts])

  useEffect(() => {
    const fetchConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      setSkinProfile(profileData || {})

      // Fetch Custom Products
      const { data: customData } = await supabase
        .from('custom_products')
        .select('*')
        .eq('user_id', user.id)
      
      if (customData) setCustomProducts(customData)

      // Fetch Routine
      const weekStart = getCurrentWeekStart()
      const { data: routineData } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle()
      
      setRoutine(routineData?.slots || {})
      setLoadingConfig(false)
    }

    fetchConfig()
  }, [supabase, router])

  const hasRoutine = useMemo(() => {
    if (!routine) return false
    return Object.values(routine).some((slot: any) => Array.isArray(slot) && slot.length > 0)
  }, [routine])

// ...
  const { messages, append, isLoading, error } = useChat({
    api: '/api/analyze',
    streamProtocol: 'text',
    body: {
      skinProfile,
      mergedProducts,
      routine
    }
  })

  const handleGenerate = () => {
    if (!hasRoutine) return
    append({
      role: 'user',
      content: 'Please synthesize a 14-day projection using my loaded skin profile and routine.'
    })
  }

  const latestMessage = messages[messages.length - 1]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shrink-0">
        <h1 className="text-xl font-semibold">Luminary Journal</h1>
        <nav className="flex items-center gap-5 text-sm text-neutral-600">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/routine">Routine</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/simulate" className="font-medium text-black">Simulate</Link>
          <Link href="/profile">Profile</Link>
        </nav>
        <button onClick={handleSignOut} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm">
          Sign out
        </button>
      </header>

      <section className="mx-auto w-full max-w-4xl px-6 py-12 flex-1 flex flex-col">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-semibold mb-4">AI Dermatological Projection</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Our Gemini AI engine analyzes your routine's molecular interactions against your specific skin profile 
            to forecast barrier health, identify active conflict risks, and project results over a 14-day cycle.
          </p>
        </div>

        {loadingConfig ? (
          <div className="text-center py-20 text-neutral-400">Loading your profile and routine...</div>
        ) : !hasRoutine ? (
          <div className="bg-white border rounded-3xl p-10 text-center shadow-sm">
            <div className="text-4xl mb-4">🧴</div>
            <h3 className="text-xl font-semibold mb-2">No active routine found</h3>
            <p className="text-neutral-500 mb-6">
              You need to build your weekly routine before we can run a simulation.
            </p>
            <Link href="/routine" className="bg-black text-white px-6 py-3 rounded-xl inline-block">
              Build Routine
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center">
            {messages.length === 0 && (
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-black text-white px-8 py-4 rounded-full font-medium text-lg shadow-lg hover:bg-neutral-800 transition disabled:opacity-50"
              >
                Generate 14-Day Projection
              </button>
            )}

            {error && (
              <div className="mt-8 bg-red-50 text-red-500 p-4 rounded-xl border border-red-100">
                Error connecting to AI projection layer: {error.message}
              </div>
            )}

            {(messages.length > 0 || isLoading) && (
              <div className="w-full mt-10 bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
                
                {isLoading && messages.length === 1 && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                    <p className="text-neutral-500 animate-pulse">Analyzing ingredient interactions...</p>
                  </div>
                )}

                {latestMessage?.role === 'assistant' && (
                  <div className="prose prose-neutral max-w-none">
                    <ReactMarkdown>{latestMessage.content}</ReactMarkdown>
                  </div>
                )}
                
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}