import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get single terms document
export async function GET(
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
    const { data: document, error } = await supabase
      .from('terms_documents')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ document })
  } catch (error: any) {
    console.error('Error fetching terms document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch terms document' },
      { status: 500 }
    )
  }
}

// PUT - Update terms document
export async function PUT(
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
    const body = await request.json()
    const {
      version,
      effective_date,
      title,
      summary,
      content,
      requires_scroll,
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (version !== undefined) updateData.version = version
    if (effective_date !== undefined) updateData.effective_date = effective_date
    if (title !== undefined) updateData.title = title
    if (summary !== undefined) updateData.summary = summary
    if (content !== undefined) updateData.content = content
    if (requires_scroll !== undefined) updateData.requires_scroll = requires_scroll

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: document, error } = await supabase
      .from('terms_documents')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ document })
  } catch (error: any) {
    console.error('Error updating terms document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update terms document' },
      { status: 500 }
    )
  }
}

// DELETE - Delete terms document (only if not active and has no acknowledgements)
export async function DELETE(
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
    // Check if document exists and is not active
    const { data: document, error: fetchError } = await supabase
      .from('terms_documents')
      .select('id, is_active')
      .eq('id', params.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.is_active) {
      return NextResponse.json(
        { error: 'Cannot delete an active terms document' },
        { status: 400 }
      )
    }

    // Check for existing acknowledgements
    const { count, error: countError } = await supabase
      .from('terms_acknowledgements')
      .select('*', { count: 'exact', head: true })
      .eq('terms_document_id', params.id)

    if (countError) throw countError

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a document with existing acknowledgements' },
        { status: 400 }
      )
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from('terms_documents')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting terms document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete terms document' },
      { status: 500 }
    )
  }
}
