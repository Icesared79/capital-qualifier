import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface RejectDocumentRequest {
  documentId: string
  reason: string
  checklistItemId?: string
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

    const body: RejectDocumentRequest = await request.json()
    const { documentId, reason, checklistItemId } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Missing required field: reason' },
        { status: 400 }
      )
    }

    // Get the document with deal info
    const { data: document, error: docError } = await adminClient
      .from('documents')
      .select(`
        *,
        deals!inner(
          id,
          companies!inner(owner_id, name)
        )
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update document status
    const { error: updateError } = await adminClient
      .from('documents')
      .update({
        status: 'rejected',
        review_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject document' },
        { status: 500 }
      )
    }

    // If there's a checklist item, reset its status to pending
    if (checklistItemId) {
      await adminClient
        .from('deal_checklist_status')
        .update({
          status: 'pending',
          document_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', document.deal_id)
        .eq('checklist_item_id', checklistItemId)
    }

    // Create activity log entry
    await adminClient
      .from('activities')
      .insert({
        deal_id: document.deal_id,
        user_id: user.id,
        action: 'document_rejected',
        details: {
          document_id: documentId,
          document_name: document.name,
          reason: reason,
          rejected_by: user.email
        }
      })

    // Create notification for deal owner
    const ownerId = document.deals.companies.owner_id
    await adminClient
      .from('notifications')
      .insert({
        user_id: ownerId,
        deal_id: document.deal_id,
        type: 'document_rejected',
        title: 'Document Requires Revision',
        message: `Your document "${document.name}" requires revision: ${reason}`
      })

    return NextResponse.json({
      success: true,
      message: 'Document rejected with feedback',
      document: {
        id: documentId,
        status: 'rejected',
        review_notes: reason
      }
    })
  } catch (error) {
    console.error('Error rejecting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
