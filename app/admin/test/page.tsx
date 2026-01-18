'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminTestPage() {
  const [status, setStatus] = useState<any>({ loading: true })
  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      let profile = null
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = data
      }

      setStatus({
        loading: false,
        user: user ? { id: user.id, email: user.email } : null,
        userError: userError?.message,
        session: session ? { expires_at: session.expires_at } : null,
        sessionError: sessionError?.message,
        profile,
        isAdmin: profile?.role === 'admin'
      })
    }
    checkSession()
  }, [])

  const goToAdmin = () => {
    window.location.href = '/dashboard/admin'
  }

  const loginAgain = () => {
    window.location.href = '/admin'
  }

  if (status.loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p>Checking session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Session Debug</h1>

      <div className="space-y-4 mb-8">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="font-bold mb-2">User</h2>
          {status.user ? (
            <div className="text-green-400">
              <p>ID: {status.user.id}</p>
              <p>Email: {status.user.email}</p>
            </div>
          ) : (
            <p className="text-red-400">Not logged in - {status.userError}</p>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="font-bold mb-2">Session</h2>
          {status.session ? (
            <p className="text-green-400">Active - expires: {status.session.expires_at}</p>
          ) : (
            <p className="text-red-400">No session - {status.sessionError}</p>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="font-bold mb-2">Profile</h2>
          {status.profile ? (
            <div>
              <p>Role: <span className={status.profile.role === 'admin' ? 'text-green-400' : 'text-yellow-400'}>{status.profile.role}</span></p>
              <p>Email: {status.profile.email}</p>
            </div>
          ) : (
            <p className="text-red-400">No profile found</p>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="font-bold mb-2">Admin Access</h2>
          {status.isAdmin ? (
            <p className="text-green-400">YES - You should be able to access admin dashboard</p>
          ) : (
            <p className="text-red-400">NO - Role is not admin</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {status.isAdmin && (
          <button
            onClick={goToAdmin}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            Go to Admin Dashboard
          </button>
        )}
        <button
          onClick={loginAgain}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold"
        >
          Go to Admin Login
        </button>
      </div>
    </div>
  )
}
