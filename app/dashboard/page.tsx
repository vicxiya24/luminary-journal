'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error.message)
      return
    }

    router.replace('/')
    router.refresh()
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

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-3xl font-semibold">Dashboard</h2>
        <p className="mt-2 text-neutral-600">
          Your first routine was saved successfully.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium">Current Routine</h3>
            <p className="mb-6 mt-2 text-sm text-neutral-600">
              Your weekly routine has been saved.
            </p>
            <Link
              href="/routine"
              className="mt-auto inline-block rounded-xl border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-50"
            >
              Edit routine
            </Link>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium">Weekly Check-Ins</h3>
            <p className="mt-2 text-sm text-neutral-600">
              No journal entries yet.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium">Skin Trends</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Trend data will appear after your first check-in.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}