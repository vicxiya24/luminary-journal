'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const routeUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error(profileError.message)
        setLoading(false)
        return
      }

      if (!profile) {
        router.replace('/onboarding')
        return
      }

      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (routineError) {
        console.error(routineError.message)
        setLoading(false)
        return
      }

      if (!routine) {
        router.replace('/onboarding/routine')
        return
      }

      router.replace('/dashboard')
    }

    routeUser()
  }, [router, supabase])

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error(error.message)
    }
  }

  if (loading) {
    return <div className="p-10">Loading...</div>
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <button
        onClick={signIn}
        className="rounded-xl bg-black px-6 py-3 text-white"
      >
        Continue with Google
      </button>
    </main>
  )
}