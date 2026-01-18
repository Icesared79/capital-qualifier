import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based route protection is handled in the layouts for:
    // - /dashboard/admin/* (requires admin role)
    // - /dashboard/legal/* (requires legal role)
    // - /dashboard/optma/* (requires optma role)
    // The layouts perform the role check and redirect if unauthorized.
    // This keeps middleware lightweight and avoids duplicate DB queries.
  }

  // Redirect logged-in users away from auth pages
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
    if (user) {
      // Get user profile to determine role-based redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Redirect to appropriate dashboard based on role
      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      } else if (profile?.role === 'legal') {
        return NextResponse.redirect(new URL('/dashboard/legal', request.url))
      } else if (profile?.role === 'optma') {
        return NextResponse.redirect(new URL('/dashboard/optma', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect logged-in admin users away from admin login page
  if (request.nextUrl.pathname === '/admin') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const adminRoles = ['admin', 'legal', 'optma']
      if (profile && adminRoles.includes(profile.role)) {
        // Already logged in as admin, redirect to appropriate dashboard
        if (profile.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        } else if (profile.role === 'legal') {
          return NextResponse.redirect(new URL('/dashboard/legal', request.url))
        } else if (profile.role === 'optma') {
          return NextResponse.redirect(new URL('/dashboard/optma', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/admin',
  ],
}
