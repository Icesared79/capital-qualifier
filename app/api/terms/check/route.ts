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

// GET - Check if user has accepted specific terms
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const documentType = searchParams.get('document_type')
  const contextEntityId = searchParams.get('context_entity_id')

  // Validate document type
  if (!documentType || !validDocumentTypes.includes(documentType as TermsDocumentType)) {
    return NextResponse.json(
      { error: 'Invalid or missing document_type parameter' },
      { status: 400 }
    )
  }

  try {
    // Fetch active terms document
    const { data: termsDocument, error: termsError } = await supabase
      .from('terms_documents')
      .select('*')
      .eq('document_type', documentType)
      .eq('is_active', true)
      .single()

    if (termsError) {
      if (termsError.code === 'PGRST116') {
        return NextResponse.json({
          has_accepted: false,
          error: 'No active terms document found',
        })
      }
      throw termsError
    }

    // Build query for acknowledgement
    let query = supabase
      .from('terms_acknowledgements')
      .select('*')
      .eq('user_id', user.id)
      .eq('terms_document_id', termsDocument.id)

    // For context-specific terms (like deal_confidentiality), check entity ID
    if (contextEntityId) {
      query = query.eq('context_entity_id', contextEntityId)
    }

    const { data: acknowledgements, error: ackError } = await query
      .order('acknowledged_at', { ascending: false })
      .limit(1)

    if (ackError) {
      throw ackError
    }

    const hasAccepted = acknowledgements && acknowledgements.length > 0

    return NextResponse.json({
      has_accepted: hasAccepted,
      terms_document: termsDocument,
      acknowledgement: hasAccepted ? acknowledgements[0] : null,
    })
  } catch (error: any) {
    console.error('Error checking terms acceptance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check terms acceptance' },
      { status: 500 }
    )
  }
}
