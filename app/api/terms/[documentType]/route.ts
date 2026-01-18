import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { TermsDocumentType, TermsContextType } from '@/lib/types'

const validDocumentTypes: TermsDocumentType[] = [
  'platform_tos',
  'originator_agreement',
  'offering_certification',
  'partner_network_agreement',
  'deal_confidentiality',
]

// GET - Fetch active terms document by type
export async function GET(
  request: NextRequest,
  { params }: { params: { documentType: string } }
) {
  const supabase = createClient()
  const { documentType } = params

  // Validate document type
  if (!validDocumentTypes.includes(documentType as TermsDocumentType)) {
    return NextResponse.json(
      { error: 'Invalid document type' },
      { status: 400 }
    )
  }

  try {
    // Fetch active terms document
    const { data: termsDocument, error } = await supabase
      .from('terms_documents')
      .select('*')
      .eq('document_type', documentType)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No active terms document found for this type' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(termsDocument)
  } catch (error: any) {
    console.error('Error fetching terms document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch terms document' },
      { status: 500 }
    )
  }
}

// POST - Record acknowledgement
export async function POST(
  request: NextRequest,
  { params }: { params: { documentType: string } }
) {
  const supabase = createClient()
  const { documentType } = params

  // Validate document type
  if (!validDocumentTypes.includes(documentType as TermsDocumentType)) {
    return NextResponse.json(
      { error: 'Invalid document type' },
      { status: 400 }
    )
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      context_type,
      context_entity_id,
      checkbox_confirmed,
      scrolled_to_bottom,
    } = body

    // Validate context type
    const validContextTypes: TermsContextType[] = [
      'signup',
      'first_offering',
      'offering_submission',
      'partner_onboarding',
      'deal_interest',
    ]

    if (!validContextTypes.includes(context_type)) {
      return NextResponse.json(
        { error: 'Invalid context type' },
        { status: 400 }
      )
    }

    // Fetch active terms document
    const { data: termsDocument, error: termsError } = await supabase
      .from('terms_documents')
      .select('id, requires_scroll')
      .eq('document_type', documentType)
      .eq('is_active', true)
      .single()

    if (termsError || !termsDocument) {
      return NextResponse.json(
        { error: 'No active terms document found' },
        { status: 404 }
      )
    }

    // Validate scroll requirement
    if (termsDocument.requires_scroll && !scrolled_to_bottom) {
      return NextResponse.json(
        { error: 'Must scroll to bottom before accepting' },
        { status: 400 }
      )
    }

    // Validate checkbox
    if (!checkbox_confirmed) {
      return NextResponse.json(
        { error: 'Must confirm checkbox before accepting' },
        { status: 400 }
      )
    }

    // Get request metadata
    const headersList = headers()
    const ip_address = headersList.get('x-forwarded-for') ||
                       headersList.get('x-real-ip') ||
                       'unknown'
    const user_agent = headersList.get('user-agent') || 'unknown'

    // Record acknowledgement
    const { data: acknowledgement, error: insertError } = await supabase
      .from('terms_acknowledgements')
      .insert({
        user_id: user.id,
        terms_document_id: termsDocument.id,
        context_type,
        context_entity_id: context_entity_id || null,
        checkbox_confirmed,
        scrolled_to_bottom,
        ip_address,
        user_agent,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      acknowledgement,
    })
  } catch (error: any) {
    console.error('Error recording acknowledgement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record acknowledgement' },
      { status: 500 }
    )
  }
}
