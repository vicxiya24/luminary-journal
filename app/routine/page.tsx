'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { RoutineCalendar } from '@/components/routine/RoutineCalendar'

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
  const [userId, setUserId] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<string>('')

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }
      setUserId(user.id)
      setWeekStart(getCurrentWeekStart())
    }
    loadUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  if (!userId || !weekStart) {
    return <div className="p-10">Loading routine layout...</div>
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-10">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">Luminary Journal</h1>

        <nav className="flex items-center gap-5 text-sm text-neutral-600">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/routine" className="font-medium text-black">
            Routine
          </Link>
          <Link href="/journal">Journal</Link>
          <Link href="/simulate">Simulate</Link>
          <Link href="/profile">Profile</Link>
        </nav>

        <button
          onClick={handleSignOut}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] px-6 pt-10">
        <RoutineCalendar 
          userId={userId} 
          weekStart={weekStart} 
          onSaveRoutine={() => {
            router.replace('/dashboard')
            router.refresh()
          }}
        />
      </section>
    </main>
  )
}