import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  const supabase = createClient()

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

  return NextResponse.json({
    cookies: allCookies.map(c => ({ name: c.name, valueLength: c.value?.length })),
    hasSupabaseCookies: allCookies.some(c => c.name.includes('supabase')),
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message,
    session: session ? {
      expires_at: session.expires_at,
      token_type: session.token_type
    } : null,
    sessionError: sessionError?.message,
    profile
  })
}
