import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has accepted platform ToS
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get active terms document
        const { data: termsDoc } = await supabase
          .from('terms_documents')
          .select('id')
          .eq('document_type', 'platform_tos')
          .eq('is_active', true)
          .single()

        if (termsDoc) {
          // Check for existing acknowledgement
          const { data: acknowledgement } = await supabase
            .from('terms_acknowledgements')
            .select('id')
            .eq('user_id', user.id)
            .eq('terms_document_id', termsDoc.id)
            .limit(1)
            .single()

          // If no acknowledgement, redirect to terms page
          if (!acknowledgement) {
            const termsUrl = new URL('/auth/terms', origin)
            termsUrl.searchParams.set('next', next)
            return NextResponse.redirect(termsUrl.toString())
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
