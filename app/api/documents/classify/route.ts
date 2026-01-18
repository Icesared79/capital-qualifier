import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyDocument, ClassificationInput, ClassificationResult } from '@/lib/document-classifier'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, dealId } = body

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // Get the document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get deal context if available
    let dealContext: ClassificationInput['dealContext'] = undefined
    if (dealId || doc.deal_id) {
      const { data: deal } = await supabase
        .from('deals')
        .select(`
          *,
          company:companies (
            name,
            qualification_data
          )
        `)
        .eq('id', dealId || doc.deal_id)
        .single()

      if (deal) {
        const qualData = (deal.company as any)?.qualification_data || {}
        dealContext = {
          assetType: qualData.assets?.[0] || qualData.assetType,
          fundingAmount: deal.capital_amount,
          companyName: (deal.company as any)?.name,
        }
      }
    }

    // Download the file from storage to get content
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
    }

    // Convert to appropriate format based on mime type
    let fileContent: string

    if (doc.mime_type.includes('image')) {
      // Convert image to base64
      const arrayBuffer = await fileData.arrayBuffer()
      fileContent = Buffer.from(arrayBuffer).toString('base64')
    } else if (doc.mime_type.includes('pdf')) {
      // For PDFs, we'll use a text extraction or send as base64
      // For now, send filename-based classification (PDF text extraction would need additional library)
      const arrayBuffer = await fileData.arrayBuffer()
      fileContent = Buffer.from(arrayBuffer).toString('base64')
    } else {
      // For text-based files (CSV, Excel converted to text, etc.)
      fileContent = await fileData.text()
    }

    // Classify the document
    const classificationInput: ClassificationInput = {
      fileName: doc.name,
      mimeType: doc.mime_type,
      fileContent,
      dealContext,
    }

    const classification = await classifyDocument(classificationInput)

    if (!classification) {
      return NextResponse.json({
        error: 'Classification failed',
        fallback: {
          category: 'other',
          confidence: 'low',
          summary: 'Unable to classify document automatically',
        }
      }, { status: 200 })
    }

    // Update the document record with classification
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        category: classification.category,
        classification_data: classification,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Failed to update document with classification:', updateError)
    }

    // If there's a suggested checklist item, try to link it
    if (classification.suggestedChecklistItem && doc.deal_id) {
      // Find the checklist item
      const { data: checklistItem } = await supabase
        .from('document_checklist_items')
        .select('id')
        .or(`id.eq.${classification.suggestedChecklistItem},name.ilike.%${classification.suggestedChecklistItem}%`)
        .limit(1)
        .single()

      if (checklistItem) {
        // Check if a status record exists
        const { data: existingStatus } = await supabase
          .from('deal_checklist_status')
          .select('id')
          .eq('deal_id', doc.deal_id)
          .eq('checklist_item_id', checklistItem.id)
          .single()

        if (existingStatus) {
          // Update existing
          await supabase
            .from('deal_checklist_status')
            .update({
              document_id: documentId,
              status: 'uploaded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingStatus.id)
        } else {
          // Create new
          await supabase
            .from('deal_checklist_status')
            .insert({
              deal_id: doc.deal_id,
              checklist_item_id: checklistItem.id,
              document_id: documentId,
              status: 'uploaded',
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      classification,
    })

  } catch (error: any) {
    console.error('Document classification error:', error)
    return NextResponse.json(
      { error: error.message || 'Classification failed' },
      { status: 500 }
    )
  }
}
