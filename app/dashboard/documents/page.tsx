'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface ClassificationData {
  category: DocumentCategory
  documentType: string
  confidence: 'high' | 'medium' | 'low'
  suggestedChecklistItem: string | null
  summary: string
  extractedInfo?: {
    title?: string
    date?: string
    period?: string
    parties?: string[]
    amounts?: string[]
  }
}

interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  category: DocumentCategory
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  created_at: string
  classification_data?: ClassificationData | null
  classification_confirmed?: boolean
}

interface ChecklistItem {
  id: string
  stage: string
  category: DocumentCategory
  name: string
  description: string | null
  is_required: boolean
  display_order: number
}

type DocumentCategory = 'financials' | 'loan_tape' | 'legal' | 'corporate' | 'due_diligence' | 'other'

const categories: { value: DocumentCategory; label: string; description: string; examples: string[] }[] = [
  {
    value: 'financials',
    label: 'Financial Statements',
    description: 'Company financial records and reports',
    examples: ['P&L statements', 'Balance sheets', 'Tax returns', 'Bank statements'],
  },
  {
    value: 'loan_tape',
    label: 'Loan Tape / Portfolio Data',
    description: 'Detailed loan-level data and portfolio metrics',
    examples: ['Loan tape (Excel/CSV)', 'Portfolio performance', 'Delinquency reports', 'Vintage analysis'],
  },
  {
    value: 'legal',
    label: 'Legal Documents',
    description: 'Legal agreements and compliance documentation',
    examples: ['Operating agreements', 'Licenses', 'Compliance certifications', 'Loan documents'],
  },
  {
    value: 'corporate',
    label: 'Corporate Documents',
    description: 'Company formation and governance documents',
    examples: ['Articles of incorporation', 'Bylaws', 'Board resolutions', 'Cap table'],
  },
  {
    value: 'due_diligence',
    label: 'Due Diligence',
    description: 'Supporting documentation for due diligence',
    examples: ['Background checks', 'Insurance certificates', 'Audit reports', 'KYC documents'],
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Any other relevant documentation',
    examples: ['Pitch deck', 'Marketing materials', 'Press coverage', 'References'],
  },
]

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const statusLabels = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Needs Revision',
}

function DocumentsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [dealId, setDealId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<DocumentCategory | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [dealStage, setDealStage] = useState<string>('qualified')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingDoc, setProcessingDoc] = useState<string | null>(null)
  const [classifyingDocs, setClassifyingDocs] = useState<Set<string>>(new Set())
  const [smartUploadMode, setSmartUploadMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userIsAdmin = profile?.role === 'admin'
    setIsAdmin(userIsAdmin)

    // Check for deal ID from URL params
    const dealIdParam = searchParams.get('deal')

    if (dealIdParam) {
      // Load specific deal (for admin or owner)
      const { data: deal } = await supabase
        .from('deals')
        .select('id, stage, company_id, companies(owner_id)')
        .eq('id', dealIdParam)
        .single()

      if (deal) {
        // Verify access (owner or admin)
        const hasAccess = userIsAdmin || (deal.companies as any)?.owner_id === user.id
        if (hasAccess) {
          setDealId(deal.id)
          setDealStage(deal.stage)
          setCompanyId(deal.company_id)
          await loadDocuments(deal.id)
          await loadChecklist(deal.stage)
        }
      }
    } else {
      // Get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)

      if (companies && companies.length > 0) {
        setCompanyId(companies[0].id)

        // Get or create deal
        const { data: deals } = await supabase
          .from('deals')
          .select('id, stage')
          .eq('company_id', companies[0].id)
          .limit(1)

        if (deals && deals.length > 0) {
          setDealId(deals[0].id)
          setDealStage(deals[0].stage)
          await loadDocuments(deals[0].id)
          await loadChecklist(deals[0].stage)
        } else {
          // Create a deal for this company
          const qualificationCode = `BCS-${Date.now().toString(36).toUpperCase()}`
          const { data: newDeal, error: dealError } = await supabase
            .from('deals')
            .insert({
              company_id: companies[0].id,
              qualification_code: qualificationCode,
              stage: 'qualified',
            })
            .select()
            .single()

          if (newDeal && !dealError) {
            setDealId(newDeal.id)
            await loadChecklist('qualified')
          }
        }
      }
    }

    setLoading(false)
  }

  const loadChecklist = async (stage: string) => {
    // Get checklist items for stages up to and including current stage
    const stageOrder = ['qualified', 'documents_requested', 'documents_in_review', 'due_diligence', 'term_sheet', 'closing']
    const currentIndex = stageOrder.indexOf(stage)
    const relevantStages = currentIndex >= 0 ? stageOrder.slice(0, currentIndex + 1) : ['qualified']

    const { data } = await supabase
      .from('document_checklist_items')
      .select('*')
      .in('stage', relevantStages)
      .order('display_order', { ascending: true })

    if (data) {
      setChecklistItems(data)
    }
  }

  const loadDocuments = async (dId: string) => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('deal_id', dId)
      .order('created_at', { ascending: false })

    if (data) {
      setDocuments(data)
    }
  }

  const handleFileSelect = (category: DocumentCategory) => {
    setSelectedCategory(category)
    fileInputRef.current?.click()
  }

  const classifyDocument = async (documentId: string) => {
    setClassifyingDocs(prev => new Set(prev).add(documentId))
    try {
      const response = await fetch('/api/documents/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, dealId }),
      })
      const result = await response.json()
      if (result.classification) {
        // Reload to get updated classification data
        if (dealId) await loadDocuments(dealId)
      }
    } catch (err) {
      console.error('Classification failed:', err)
    } finally {
      setClassifyingDocs(prev => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }
  }

  const handleSmartUpload = () => {
    setSmartUploadMode(true)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !dealId) return

    // For smart upload, we don't need a pre-selected category
    const category = smartUploadMode ? 'other' : selectedCategory
    if (!category) return

    setUploading(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setUploading(false)
      return
    }

    const uploadedDocIds: string[] = []

    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${dealId}/${category}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) {
          // If bucket doesn't exist, show helpful message
          if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
            setError('Storage bucket not configured. Please set up the "documents" bucket in Supabase Storage.')
          } else {
            setError(`Upload failed: ${uploadError.message}`)
          }
          continue
        }

        // Create document record
        const { data: docData, error: dbError } = await supabase
          .from('documents')
          .insert({
            deal_id: dealId,
            uploaded_by: user.id,
            name: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: file.type,
            category: category,
            status: 'pending',
          })
          .select('id')
          .single()

        if (dbError) {
          setError(`Failed to save document record: ${dbError.message}`)
        } else if (docData) {
          uploadedDocIds.push(docData.id)
        }
      }

      // Reload documents
      await loadDocuments(dealId)

      // If smart upload mode, classify all uploaded documents
      if (smartUploadMode && uploadedDocIds.length > 0) {
        setSuccess(`${uploadedDocIds.length} document(s) uploaded. AI is analyzing...`)
        // Classify documents in background
        for (const docId of uploadedDocIds) {
          classifyDocument(docId)
        }
      } else {
        setSuccess('Documents uploaded successfully!')
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    }

    setUploading(false)
    setSelectedCategory(null)
    setSmartUploadMode(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"?`)) return

    // Delete from storage
    await supabase.storage.from('documents').remove([doc.file_path])

    // Delete record
    await supabase.from('documents').delete().eq('id', doc.id)

    // Reload
    if (dealId) {
      await loadDocuments(dealId)
    }
  }

  const handleApproveDocument = async (doc: Document) => {
    if (!isAdmin) return
    setProcessingDoc(doc.id)
    setError('')

    try {
      const response = await fetch('/api/workflow/approve-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve document')
      }

      setSuccess(`Document "${doc.name}" approved`)
      if (dealId) {
        await loadDocuments(dealId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve document')
    } finally {
      setProcessingDoc(null)
    }
  }

  const handleRejectDocument = async () => {
    if (!isAdmin || !rejectingDoc || !rejectReason.trim()) return
    setProcessingDoc(rejectingDoc.id)
    setError('')

    try {
      const response = await fetch('/api/workflow/reject-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: rejectingDoc.id,
          reason: rejectReason.trim()
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject document')
      }

      setSuccess(`Document "${rejectingDoc.name}" marked for revision`)
      setShowRejectModal(false)
      setRejectingDoc(null)
      setRejectReason('')
      if (dealId) {
        await loadDocuments(dealId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject document')
    } finally {
      setProcessingDoc(null)
    }
  }

  const openRejectModal = (doc: Document) => {
    setRejectingDoc(doc)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const getDocumentsByCategory = (category: DocumentCategory) => {
    return documents.filter(d => d.category === category)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryProgress = (category: DocumentCategory) => {
    const docs = getDocumentsByCategory(category)
    if (docs.length === 0) return 'empty'
    if (docs.some(d => d.status === 'rejected')) return 'needs_attention'
    if (docs.every(d => d.status === 'approved')) return 'complete'
    return 'in_progress'
  }

  const getCategoryStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'needs_attention': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Profile First</h2>
            <p className="text-gray-500 mb-6">
              Please set up your company profile before uploading documents.
            </p>
            <Link href="/dashboard/profile">
              <Button>Set Up Profile</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-500">Upload and manage your due diligence documents</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Smart Upload Zone */}
        <div
          className="mb-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
          onClick={handleSmartUpload}
        >
          <div className="p-8 text-center">
            {/* Upload Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
              {uploading && smartUploadMode ? (
                <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>

            {/* Text */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {uploading && smartUploadMode ? 'Uploading...' : 'Drop files here or click to upload'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Our AI will automatically classify and organize your documents
            </p>

            {/* Supported formats */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['PDF', 'DOC', 'XLS', 'CSV', 'PNG', 'JPG'].map((format) => (
                <span
                  key={format}
                  className="px-2 py-1 text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Document Categories */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const categoryDocs = getDocumentsByCategory(cat.value)
            const progress = getCategoryProgress(cat.value)
            const isExpanded = expandedCategory === cat.value

            return (
              <div
                key={cat.value}
                className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.value)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getCategoryStatusColor(progress)}`} />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {categoryDocs.length} file{categoryDocs.length !== 1 ? 's' : ''}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Examples */}
                    <div className="py-4 border-b border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Examples of documents to upload:</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.examples.map((example) => (
                          <span
                            key={example}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Documents List */}
                    {categoryDocs.length > 0 && (
                      <div className="py-4 space-y-2">
                        {categoryDocs.map((doc) => {
                          const isClassifying = classifyingDocs.has(doc.id)
                          const classification = doc.classification_data

                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(doc.file_size)} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                                {/* AI Classification Info */}
                                {isClassifying && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <svg className="w-3 h-3 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span className="text-xs text-indigo-600">AI analyzing...</span>
                                  </div>
                                )}
                                {!isClassifying && classification && (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-600 italic">{classification.summary}</p>
                                    {classification.confidence && (
                                      <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${
                                        classification.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                        classification.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {classification.confidence} confidence
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${statusColors[doc.status]}`}>
                                {statusLabels[doc.status]}
                              </span>
                              {/* Admin approve/reject buttons */}
                              {isAdmin && doc.status === 'pending' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleApproveDocument(doc)}
                                    disabled={processingDoc === doc.id}
                                    className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded transition-colors disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(doc)}
                                    disabled={processingDoc === doc.id}
                                    className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                                    title="Request Revision"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                              {!isAdmin && (
                                <button
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )})}
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => handleFileSelect(cat.value)}
                        disabled={uploading}
                        className="w-full justify-center"
                      >
                        {uploading && selectedCategory === cat.value ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Upload {cat.label}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
        </div>
      </main>

      {/* Rejection Modal */}
      {showRejectModal && rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !processingDoc && setShowRejectModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Revision</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{rejectingDoc.name}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for revision
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please explain what needs to be corrected or updated..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={!!processingDoc}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDocument}
                disabled={!rejectReason.trim() || !!processingDoc}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-base hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingDoc ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Request Revision'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <DocumentsPageContent />
    </Suspense>
  )
}
