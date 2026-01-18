import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { TermsDocumentType } from '@/lib/types'

const validDocumentTypes: TermsDocumentType[] = [
  'platform_tos',
  'originator_agreement',
  'offering_certification',
  'partner_network_agreement',
  'deal_confidentiality',
]

// GET - List all terms documents
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
  const documentType = searchParams.get('document_type')
  const activeOnly = searchParams.get('active_only') === 'true'

  try {
    let query = supabase
      .from('terms_documents')
      .select('*')
      .order('document_type')
      .order('effective_date', { ascending: false })

    if (documentType && validDocumentTypes.includes(documentType as TermsDocumentType)) {
      query = query.eq('document_type', documentType)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: documents, error } = await query

    if (error) throw error

    return NextResponse.json({ documents })
  } catch (error: any) {
    console.error('Error fetching terms documents:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch terms documents' },
      { status: 500 }
    )
  }
}

// POST - Create new terms document
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
    const {
      document_type,
      version,
      effective_date,
      title,
      summary,
      content,
      requires_scroll = true,
      is_active = false,
    } = body

    // Validate required fields
    if (!document_type || !validDocumentTypes.includes(document_type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }
    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 })
    }
    if (!effective_date) {
      return NextResponse.json({ error: 'Effective date is required' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // If setting as active, deactivate other versions of same type first
    if (is_active) {
      await supabase
        .from('terms_documents')
        .update({ is_active: false })
        .eq('document_type', document_type)
    }

    const { data: document, error } = await supabase
      .from('terms_documents')
      .insert({
        document_type,
        version,
        effective_date,
        title,
        summary,
        content,
        requires_scroll,
        is_active,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ document })
  } catch (error: any) {
    console.error('Error creating terms document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create terms document' },
      { status: 500 }
    )
  }
}
