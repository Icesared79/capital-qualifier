import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's profile to determine partner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'optma' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 })
  }

  // Get partner data
  const { data: partner, error } = await supabase
    .from('funding_partners')
    .select('*')
    .eq('slug', 'optima')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ partner })
}

export async function PUT(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's profile to determine partner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'optma' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 })
  }

  const body = await request.json()

  // Get current partner to get ID
  const { data: currentPartner } = await supabase
    .from('funding_partners')
    .select('id')
    .eq('slug', 'optima')
    .single()

  if (!currentPartner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Update partner profile
  const { data: partner, error } = await supabase
    .from('funding_partners')
    .update({
      name: body.name,
      description: body.description,
      website: body.website,
      primary_contact_name: body.primary_contact_name,
      primary_contact_email: body.primary_contact_email,
      primary_contact_phone: body.primary_contact_phone,
      partner_type: body.partner_type,
      focus_asset_classes: body.focus_asset_classes,
      min_deal_size: body.min_deal_size,
      max_deal_size: body.max_deal_size,
      geographic_focus: body.geographic_focus,
      can_tokenize: body.can_tokenize,
      has_legal_team: body.has_legal_team,
      provides_spv_formation: body.provides_spv_formation,
      updated_at: new Date().toISOString()
    })
    .eq('id', currentPartner.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ partner })
}
