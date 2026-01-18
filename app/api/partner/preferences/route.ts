import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PartnerNotificationPreferences, EmailFrequency } from '@/lib/types'

interface UpdatePreferencesRequest {
  preferred_asset_classes?: string[] | null
  min_deal_size?: string | null
  max_deal_size?: string | null
  preferred_geographies?: string[] | null
  min_score?: number | null
  email_alerts_enabled?: boolean
  email_frequency?: EmailFrequency
  in_app_alerts_enabled?: boolean
  notification_email?: string | null
}

// GET: Fetch partner's preferences
export async function GET() {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's role (partner slug)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get partner by slug (role)
    const { data: partner, error: partnerError } = await supabase
      .from('funding_partners')
      .select('id, name, slug')
      .eq('slug', profile.role)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('partner_notification_preferences')
      .select('*')
      .eq('partner_id', partner.id)
      .single()

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching preferences:', preferencesError)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    // Return preferences (or null if not set)
    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug
      },
      preferences: preferences || null
    })
  } catch (error) {
    console.error('Error in GET /api/partner/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update partner's preferences
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's role (partner slug)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get partner by slug (role)
    const { data: partner, error: partnerError } = await supabase
      .from('funding_partners')
      .select('id')
      .eq('slug', profile.role)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    const body: UpdatePreferencesRequest = await request.json()

    // Upsert preferences
    const { data: preferences, error: upsertError } = await adminClient
      .from('partner_notification_preferences')
      .upsert({
        partner_id: partner.id,
        preferred_asset_classes: body.preferred_asset_classes ?? null,
        min_deal_size: body.min_deal_size ?? null,
        max_deal_size: body.max_deal_size ?? null,
        preferred_geographies: body.preferred_geographies ?? null,
        min_score: body.min_score ?? null,
        email_alerts_enabled: body.email_alerts_enabled ?? true,
        email_frequency: body.email_frequency ?? 'immediate',
        in_app_alerts_enabled: body.in_app_alerts_enabled ?? true,
        notification_email: body.notification_email ?? null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'partner_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting preferences:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('Error in PUT /api/partner/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
