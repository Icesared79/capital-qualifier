import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Sign out to clear the old session
  await supabase.auth.signOut()

  // Create response with redirect
  const response = NextResponse.redirect(new URL('/auth?mode=login', request.url))

  // Clear all Supabase auth cookies
  const cookieNames = [
    'sb-gwrpijvfxjppncpmamfp-auth-token',
    'sb-gwrpijvfxjppncpmamfp-auth-token.0',
    'sb-gwrpijvfxjppncpmamfp-auth-token.1',
  ]

  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    })
  })

  return response
}
