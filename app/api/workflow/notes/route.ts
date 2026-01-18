import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface NotesRequest {
  dealId: string
  notes: string
}

export async function POST(request: Request) {
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body: NotesRequest = await request.json()
    const { dealId, notes } = body

    if (!dealId) {
      return NextResponse.json(
        { error: 'Missing required field: dealId' },
        { status: 400 }
      )
    }

    // Verify the deal exists
    const { data: deal, error: dealError } = await adminClient
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Update the internal notes
    const { error: updateError } = await adminClient
      .from('deals')
      .update({
        internal_notes: notes
      })
      .eq('id', dealId)

    if (updateError) {
      console.error('Error updating notes:', updateError)
      return NextResponse.json(
        { error: 'Failed to save notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notes saved successfully'
    })
  } catch (error) {
    console.error('Error saving notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
