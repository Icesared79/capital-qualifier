import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - List all partners
export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: partners, error } = await supabase
    .from('funding_partners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }

  return NextResponse.json({ partners })
}

// POST - Create a new partner
export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, slug, partner_role, partner_type, website, primary_contact_email } = body

  // Validate required fields
  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  // Validate partner_role
  if (partner_role && !['funding', 'legal', 'tokenization'].includes(partner_role)) {
    return NextResponse.json({ error: 'Invalid partner role' }, { status: 400 })
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('funding_partners')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'A partner with this slug already exists' }, { status: 400 })
  }

  // Create the partner
  const { data: partner, error } = await supabase
    .from('funding_partners')
    .insert({
      name,
      slug,
      partner_role: partner_role || 'funding',
      partner_type: partner_type || 'institutional',
      website: website || null,
      primary_contact_email: primary_contact_email || null,
      status: 'active',
      can_tokenize: false,
      has_legal_team: partner_role === 'legal', // Legal partners have legal team by default
      provides_spv_formation: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating partner:', error)
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }

  return NextResponse.json({ partner }, { status: 201 })
}
