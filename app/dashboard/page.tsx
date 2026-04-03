'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { TrendChart, type ChartDataPoint } from '@/components/dashboard/TrendChart'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    weeksLogged: 0,
    activeProducts: 0,
    mostImprovedLabel: 'None',
  })

  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [showForecast, setShowForecast] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      // 1. Fetch data
      const [entriesRes, projectionsRes, routineRes] = await Promise.all([
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('week_start', { ascending: true }),
        supabase.from('projections').select('*').eq('user_id', user.id).order('week_start', { ascending: true }),
        supabase.from('routines').select('slots').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1)
      ])

      const entries = entriesRes.data || []
      const projections = projectionsRes.data || []
      const latestRoutine = routineRes.data?.[0]

      // 2. Compute Active Products
      let activeProductCount = 0
      if (latestRoutine?.slots) {
        const uniqueProducts = new Set()
        Object.values(latestRoutine.slots).forEach((arr: any) => {
          if (Array.isArray(arr)) {
            arr.forEach((id: string) => uniqueProducts.add(id))
          }
        })
        activeProductCount = uniqueProducts.size
      }

      // 3. Compute Most Improved Metric (Over the recorded history)
      let mostImprovedLabel = 'Not enough data'
      if (entries.length >= 2) {
        const earliest = entries[0]
        const latest = entries[entries.length - 1]

        // Improvement means going DOWN for negative metrics, going UP for satisfaction
        const deltas = [
          { label: 'Oiliness', val: earliest.oiliness - latest.oiliness },
          { label: 'Dryness', val: earliest.dryness - latest.dryness },
          { label: 'Irritation', val: earliest.irritation - latest.irritation },
          { label: 'Breakouts', val: earliest.breakouts - latest.breakouts },
          { label: 'Satisfaction', val: latest.satisfaction - earliest.satisfaction },
        ]

        // Find the one with highest positive delta
        deltas.sort((a, b) => b.val - a.val)
        if (deltas[0].val > 0) {
          mostImprovedLabel = deltas[0].label
        } else {
           mostImprovedLabel = 'Stable'
        }
      }

      // Set stats
      setStats({
        weeksLogged: entries.length,
        activeProducts: activeProductCount,
        mostImprovedLabel
      })

      setRecentEntries([...entries].reverse().slice(0, 3)) // top 3 most recent

      // 4. Assemble Chart Data
      const dataMap = new Map<string, ChartDataPoint>()

      // Attach actuals
      entries.forEach(entry => {
        dataMap.set(entry.week_start, {
          week: entry.week_start,
          oiliness: entry.oiliness,
          dryness: entry.dryness,
          irritation: entry.irritation,
          breakouts: entry.breakouts,
          satisfaction: entry.satisfaction,
        })
      })

      // Attach projections
      projections.forEach(proj => {
        const existing = dataMap.get(proj.week_start) || { week: proj.week_start }
        dataMap.set(proj.week_start, {
          ...existing,
          projected_oiliness: proj.projected_oiliness,
          projected_dryness: proj.projected_dryness,
          projected_irritation: proj.projected_irritation,
          projected_breakouts: proj.projected_breakouts,
          projected_satisfaction: proj.projected_satisfaction,
        })
      })

      // Bridge the Forecast to the Actuals
      if (entries.length > 0 && projections.length > 0) {
        const lastEntry = entries[entries.length - 1]
        const dataPoint = dataMap.get(lastEntry.week_start)
        if (dataPoint) {
          dataPoint.projected_oiliness = dataPoint.oiliness
          dataPoint.projected_dryness = dataPoint.dryness
          dataPoint.projected_irritation = dataPoint.irritation
          dataPoint.projected_breakouts = dataPoint.breakouts
          dataPoint.projected_satisfaction = dataPoint.satisfaction
        }
      }

      // Limit the chart window to the most recent 12 data points (e.g., 8 weeks looking back, 4 looking forward)
      // so it never gets infinitely squished.
      const rawDataArray = Array.from(dataMap.values())
      rawDataArray.sort((a, b) => a.week.localeCompare(b.week))
      setChartData(rawDataArray.slice(-12))
      
      setLoading(false)
    }

    loadDashboard()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  if (loading) {
     return <div className="p-10">Loading analytics...</div>
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">Luminary Journal</h1>

        <nav className="flex items-center gap-5 text-sm text-neutral-600">
          <Link href="/dashboard" className="font-medium text-black">Dashboard</Link>
          <Link href="/routine">Routine</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/simulate">Simulate</Link>
          <Link href="/profile">Profile</Link>
        </nav>

        <button
          onClick={handleSignOut}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-50"
        >
          Sign out
        </button>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Analytics Dashboard</h2>
              <p className="mt-2 text-neutral-600">
                A high-level overview of your skin health trends and active trajectory.
              </p>
            </div>
            <Link href="/journal" className="rounded-xl bg-black px-6 py-3 text-white font-medium shadow-md transition hover:-translate-y-0.5">
               Log Journal Entry →
            </Link>
        </div>

        {/* Quick Stats */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-sky-100 bg-sky-50/50 p-6 shadow-sm">
            <span className="text-sm font-semibold tracking-wide text-sky-800 uppercase">Weeks Tracked</span>
            <span className="mt-2 text-4xl font-bold text-sky-950">{stats.weeksLogged}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
            <span className="text-sm font-semibold tracking-wide text-emerald-800 uppercase">Active Products</span>
            <span className="mt-2 text-4xl font-bold text-emerald-950">{stats.activeProducts}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-3xl border border-purple-100 bg-purple-50/50 p-6 shadow-sm">
            <span className="text-sm font-semibold tracking-wide text-purple-800 uppercase">Most Improved</span>
            <span className="mt-2 text-3xl font-bold text-purple-950 text-center">{stats.mostImprovedLabel}</span>
          </div>
        </div>

        {/* Chart Engine */}
        <div className="mb-10 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
           <div className="mb-8 flex items-end justify-between">
             <h3 className="text-xl font-medium">Trajectory & Forecasting</h3>
             <button 
                onClick={() => setShowForecast(!showForecast)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${showForecast ? 'bg-sky-100 text-sky-800' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
             >
                {showForecast ? 'Hide Projections' : 'Show Projections'}
             </button>
           </div>
           
           {chartData.length === 0 ? (
             <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500">
                You haven't logged any entries or generated any projections yet. Head to the Journal to start!
             </div>
           ) : (
             <TrendChart data={chartData} showForecast={showForecast} />
           )}
        </div>

        {/* Mini Logs */}
        {recentEntries.length > 0 && (
          <div>
            <h3 className="mb-6 text-xl font-medium">Recent Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentEntries.map((log) => (
                    <div key={log.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col gap-4 hover:border-neutral-300 transition">
                       <div>
                         <h4 className="font-semibold text-lg hover:underline cursor-pointer">Week of {log.week_start}</h4>
                         <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{new Date(log.created_at).toLocaleDateString()}</p>
                       </div>
                       
                       <div className="grid grid-cols-5 gap-2 place-items-center bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                          <MiniIndicator val={log.oiliness} />
                          <MiniIndicator val={log.dryness} />
                          <MiniIndicator val={log.irritation} />
                          <MiniIndicator val={log.breakouts} />
                          <MiniIndicator val={log.satisfaction} />
                       </div>
                    </div>
                ))}
            </div>
            {stats.weeksLogged > 3 && (
               <div className="mt-6 text-center">
                  <Link href="/journal" className="text-sm font-medium text-neutral-500 hover:text-black hover:underline">
                     View all {stats.weeksLogged} journal entries →
                  </Link>
               </div>
            )}
          </div>
        )}

      </section>
    </main>
  )
}

function MiniIndicator({ val }: { val: number }) {
  // Ultra compact dot indicator for recent entries micro-cards
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-2.5 w-2.5 rounded-full ${val >= 1 ? 'bg-black' : 'bg-neutral-200'}`} />
      <div className={`h-2.5 w-2.5 rounded-full ${val >= 3 ? 'bg-black' : 'bg-neutral-200'}`} />
      <div className={`h-2.5 w-2.5 rounded-full ${val >= 5 ? 'bg-black' : 'bg-neutral-200'}`} />
    </div>
  )
}