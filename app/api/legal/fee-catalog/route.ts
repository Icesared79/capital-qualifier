import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all active fee catalog items
export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin or legal role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'legal'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: catalog, error } = await supabase
    .from('legal_fee_catalog')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('display_order')

  if (error) {
    console.error('Error fetching fee catalog:', error)
    return NextResponse.json({ error: 'Failed to fetch fee catalog' }, { status: 500 })
  }

  return NextResponse.json({ catalog })
}
