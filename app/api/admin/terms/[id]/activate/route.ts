import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Activate a terms document version (deactivates others of same type)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // Fetch the document to activate
    const { data: document, error: fetchError } = await supabase
      .from('terms_documents')
      .select('id, document_type')
      .eq('id', params.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Deactivate all other documents of the same type
    const { error: deactivateError } = await supabase
      .from('terms_documents')
      .update({ is_active: false })
      .eq('document_type', document.document_type)
      .neq('id', params.id)

    if (deactivateError) throw deactivateError

    // Activate the specified document
    const { data: activatedDocument, error: activateError } = await supabase
      .from('terms_documents')
      .update({ is_active: true })
      .eq('id', params.id)
      .select()
      .single()

    if (activateError) throw activateError

    return NextResponse.json({
      success: true,
      document: activatedDocument,
    })
  } catch (error: any) {
    console.error('Error activating terms document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to activate terms document' },
      { status: 500 }
    )
  }
}
