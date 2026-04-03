'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { CheckInFlow } from '@/components/journal/CheckInFlow'

const getCurrentWeekStart = () => {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

export default function JournalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    const loadUserAndLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      setUserId(user.id)
      setWeekStart(getCurrentWeekStart())

      // Fetch log history
      const { data: logData } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })

      if (logData) {
        setLogs(logData)
      }

      setLoading(false)
    }

    loadUserAndLogs()
  }, [router, supabase, isCheckingIn])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  // Check if they already logged this week
  const hasLoggedThisWeek = logs.some((log) => log.week_start === weekStart)

  if (!userId || loading) {
    return <div className="p-10">Loading journal...</div>
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-10">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">Luminary Journal</h1>

        <nav className="flex items-center gap-5 text-sm text-neutral-600">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/routine">Routine</Link>
          <Link href="/journal" className="font-medium text-black">Journal</Link>
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

      <section className="mx-auto max-w-6xl px-6 pt-10">
        {isCheckingIn ? (
          <CheckInFlow 
            userId={userId} 
            weekStart={weekStart} 
            onCancel={() => setIsCheckingIn(false)}
            onComplete={() => setIsCheckingIn(false)}
          />
        ) : (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-semibold">Weekly Check-In</h2>
                <p className="mt-2 text-neutral-600">
                  Track your skin progress over time and monitor routine effectiveness.
                </p>
              </div>

              {!hasLoggedThisWeek ? (
                <button
                  onClick={() => setIsCheckingIn(true)}
                  className="rounded-xl bg-black px-6 py-3 text-white font-medium shadow-md transition hover:bg-neutral-800 hover:-translate-y-0.5"
                >
                  Start This Week's Log →
                </button>
              ) : (
                <button
                  onClick={() => setIsCheckingIn(true)}
                  className="rounded-xl bg-neutral-200 px-6 py-3 text-neutral-600 font-medium transition hover:bg-neutral-300"
                >
                  Edit this week's log
                </button>
              )}
            </div>

            <div>
              <h3 className="mb-6 text-xl font-medium">Log History</h3>
              {logs.length === 0 ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center text-neutral-500 shadow-sm">
                  You haven't logged any weekly journals yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                     <div key={log.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-6">
                       <div className="sm:w-1/3 shrink-0">
                         <h4 className="font-semibold text-lg">Week of {log.week_start}</h4>
                         <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{new Date(log.created_at).toLocaleDateString()}</p>
                         
                         <div className="mt-4 flex flex-wrap gap-1.5">
                           {log.diet_tags && log.diet_tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-neutral-600">
                                {tag}
                              </span>
                           ))}
                         </div>
                       </div>
                       
                       <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 place-items-center">
                          <MetricIndicator label="Oiliness" value={log.oiliness} />
                          <MetricIndicator label="Dryness" value={log.dryness} />
                          <MetricIndicator label="Irritation" value={log.irritation} />
                          <MetricIndicator label="Breakouts" value={log.breakouts} />
                          <MetricIndicator label="Satisfaction" value={log.satisfaction} />
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function MetricIndicator({ label, value }: { label: string, value: number }) {
  // Translate 1-5 to dot visual UI
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((idx) => (
           <div 
             key={idx} 
             className={`h-2 w-4 rounded-full ${idx <= value ? 'bg-black' : 'bg-neutral-100'}`}
           />
        ))}
      </div>
      <span className="text-xs font-bold">{value}/5</span>
    </div>
  )
}