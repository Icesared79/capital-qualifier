import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { TermsDocumentType, TermsContextType } from '@/lib/types'

// GET - List acknowledgements with filters
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check authentication and admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const documentType = searchParams.get('document_type')
  const contextType = searchParams.get('context_type')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '50')

  try {
    let query = supabase
      .from('terms_acknowledgements')
      .select(`
        *,
        terms_document:terms_documents(id, document_type, version, title),
        user:profiles(id, email, full_name)
      `, { count: 'exact' })
      .order('acknowledged_at', { ascending: false })

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (documentType) {
      query = query.eq('terms_document.document_type', documentType)
    }

    if (contextType) {
      query = query.eq('context_type', contextType)
    }

    if (dateFrom) {
      query = query.gte('acknowledged_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('acknowledged_at', dateTo)
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to)

    const { data: acknowledgements, error, count } = await query

    if (error) throw error

    // If search is provided, filter by email or name (client-side for now)
    let filteredAcknowledgements = acknowledgements
    if (search && filteredAcknowledgements) {
      const searchLower = search.toLowerCase()
      filteredAcknowledgements = filteredAcknowledgements.filter((ack: any) => {
        const email = ack.user?.email?.toLowerCase() || ''
        const name = ack.user?.full_name?.toLowerCase() || ''
        return email.includes(searchLower) || name.includes(searchLower)
      })
    }

    return NextResponse.json({
      acknowledgements: filteredAcknowledgements,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    })
  } catch (error: any) {
    console.error('Error fetching acknowledgements:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch acknowledgements' },
      { status: 500 }
    )
  }
}

// GET stats for acknowledgements
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Check authentication and admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'stats') {
      // Get counts by document type
      const { data: documents, error: docsError } = await supabase
        .from('terms_documents')
        .select('id, document_type, title, is_active')

      if (docsError) throw docsError

      const stats = await Promise.all(
        (documents || []).map(async (doc) => {
          const { count, error } = await supabase
            .from('terms_acknowledgements')
            .select('*', { count: 'exact', head: true })
            .eq('terms_document_id', doc.id)

          return {
            document_id: doc.id,
            document_type: doc.document_type,
            title: doc.title,
            is_active: doc.is_active,
            acknowledgement_count: count || 0,
          }
        })
      )

      // Get total unique users who have acknowledged any terms
      const { data: uniqueUsers, error: usersError } = await supabase
        .from('terms_acknowledgements')
        .select('user_id')

      const uniqueUserCount = new Set((uniqueUsers || []).map(u => u.user_id)).size

      // Get acknowledgements in last 24 hours
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { count: recentCount, error: recentError } = await supabase
        .from('terms_acknowledgements')
        .select('*', { count: 'exact', head: true })
        .gte('acknowledged_at', yesterday.toISOString())

      return NextResponse.json({
        stats,
        summary: {
          total_unique_users: uniqueUserCount,
          acknowledgements_last_24h: recentCount || 0,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error fetching acknowledgement stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
