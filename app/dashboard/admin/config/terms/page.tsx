'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TermsDocument, TermsDocumentType } from '@/lib/types'
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react'

const documentTypeConfig: Record<TermsDocumentType, { label: string; color: string; bgColor: string }> = {
  platform_tos: { label: 'Platform ToS', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  originator_agreement: { label: 'Originator Agreement', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  offering_certification: { label: 'Offering Certification', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  partner_network_agreement: { label: 'Partner Network', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  deal_confidentiality: { label: 'Deal Confidentiality', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}

export default function TermsManagementPage() {
  const supabase = createClient()
  const [documents, setDocuments] = useState<TermsDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<TermsDocument | null>(null)
  const [editingDocument, setEditingDocument] = useState<TermsDocument | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeType, setActiveType] = useState<TermsDocumentType | 'all'>('all')

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    const response = await fetch('/api/admin/terms')
    if (response.ok) {
      const data = await response.json()
      setDocuments(data.documents || [])
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const docData = {
      document_type: formData.get('document_type') as TermsDocumentType,
      version: formData.get('version') as string,
      effective_date: formData.get('effective_date') as string,
      title: formData.get('title') as string,
      summary: formData.get('summary') as string,
      content: formData.get('content') as string,
      requires_scroll: formData.get('requires_scroll') === 'on',
    }

    if (editingDocument) {
      const response = await fetch(`/api/admin/terms/${editingDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      })

      if (response.ok) {
        await loadDocuments()
      }
    } else {
      const response = await fetch('/api/admin/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      })

      if (response.ok) {
        await loadDocuments()
      }
    }

    setSaving(false)
    setShowModal(false)
    setEditingDocument(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return

    const response = await fetch(`/api/admin/terms/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setDocuments(documents.filter(d => d.id !== id))
    } else {
      const data = await response.json()
      alert(data.error || 'Failed to delete document')
    }
  }

  async function handleActivate(doc: TermsDocument) {
    if (!confirm(`This will deactivate other ${documentTypeConfig[doc.document_type].label} versions and activate version ${doc.version}. Continue?`)) return

    const response = await fetch(`/api/admin/terms/${doc.id}/activate`, {
      method: 'POST',
    })

    if (response.ok) {
      await loadDocuments()
    } else {
      const data = await response.json()
      alert(data.error || 'Failed to activate document')
    }
  }

  const filteredDocuments = activeType === 'all'
    ? documents
    : documents.filter(d => d.document_type === activeType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms & Legal Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage versioned legal terms and documents
          </p>
        </div>
        <button
          onClick={() => { setEditingDocument(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:opacity-90 text-white dark:text-gray-900 font-medium rounded-lg transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Add Document
        </button>
      </div>

      {/* Document Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveType('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            activeType === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All ({documents.length})
        </button>
        {(Object.keys(documentTypeConfig) as TermsDocumentType[]).map(type => {
          const config = documentTypeConfig[type]
          const count = documents.filter(d => d.document_type === type).length
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                activeType === type
                  ? `${config.bgColor} ${config.color}`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No documents in this category</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Document</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Version</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Effective Date</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDocuments.map((doc) => {
                const typeConfig = documentTypeConfig[doc.document_type]
                return (
                  <tr key={doc.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!doc.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{doc.title}</p>
                      {doc.summary && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{doc.summary}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${typeConfig.bgColor} ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">v{doc.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(doc.effective_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleActivate(doc)}
                          className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setPreviewDocument(doc); setShowPreview(true) }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingDocument(doc); setShowModal(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!doc.is_active && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowModal(false); setEditingDocument(null) }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingDocument ? 'Edit Document' : 'Add Document'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEditingDocument(null) }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Type *
                  </label>
                  <select
                    name="document_type"
                    required
                    defaultValue={editingDocument?.document_type || 'platform_tos'}
                    disabled={!!editingDocument}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0 disabled:opacity-50"
                  >
                    {(Object.keys(documentTypeConfig) as TermsDocumentType[]).map(type => (
                      <option key={type} value={type}>{documentTypeConfig[type].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Version *
                  </label>
                  <input
                    type="text"
                    name="version"
                    required
                    placeholder="e.g., 1.0, 2.0"
                    defaultValue={editingDocument?.version}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingDocument?.title}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    name="effective_date"
                    required
                    defaultValue={editingDocument?.effective_date?.split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  name="summary"
                  defaultValue={editingDocument?.summary || ''}
                  placeholder="Brief description shown before the full text"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content * <span className="text-gray-400 font-normal">(Markdown supported)</span>
                </label>
                <textarea
                  name="content"
                  required
                  rows={12}
                  defaultValue={editingDocument?.content || ''}
                  placeholder="# Document Title&#10;&#10;## Section 1&#10;&#10;Content here..."
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0 font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_scroll"
                  id="requires_scroll"
                  defaultChecked={editingDocument?.requires_scroll ?? true}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <label htmlFor="requires_scroll" className="text-sm text-gray-700 dark:text-gray-300">
                  Requires scrolling to bottom before accepting
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingDocument(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDocument ? 'Save Changes' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowPreview(false); setPreviewDocument(null) }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{previewDocument.title}</h3>
                <p className="text-sm text-gray-500">Version {previewDocument.version} | Effective {new Date(previewDocument.effective_date).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => { setShowPreview(false); setPreviewDocument(null) }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewDocument.summary && (
              <p className="text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {previewDocument.summary}
              </p>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {previewDocument.content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
