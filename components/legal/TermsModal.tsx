'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { TermsDocumentType, TermsContextType, TermsDocument } from '@/lib/types'

interface TermsModalProps {
  documentType: TermsDocumentType
  contextType: TermsContextType
  contextEntityId?: string
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  blocking?: boolean  // Cannot close without accepting
}

export default function TermsModal({
  documentType,
  contextType,
  contextEntityId,
  isOpen,
  onClose,
  onAccept,
  blocking = false,
}: TermsModalProps) {
  const [termsDocument, setTermsDocument] = useState<TermsDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Tracking state
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [checkboxConfirmed, setCheckboxConfirmed] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch the active terms document
  useEffect(() => {
    if (!isOpen) return

    const fetchTerms = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/terms/${documentType}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load terms document')
        }

        const data = await response.json()
        setTermsDocument(data)

        // If scroll is not required, mark as scrolled
        if (!data.requires_scroll) {
          setHasScrolledToBottom(true)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTerms()
  }, [isOpen, documentType])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false)
      setCheckboxConfirmed(false)
      setTermsDocument(null)
      setError(null)
    }
  }, [isOpen])

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!contentRef.current || !termsDocument?.requires_scroll) return

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current
    // Consider scrolled to bottom if within 50px of bottom
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setHasScrolledToBottom(true)
    }
  }, [termsDocument?.requires_scroll])

  // Handle accept
  const handleAccept = async () => {
    if (!termsDocument) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/terms/${documentType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_type: contextType,
          context_entity_id: contextEntityId,
          checkbox_confirmed: checkboxConfirmed,
          scrolled_to_bottom: hasScrolledToBottom,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record acceptance')
      }

      onAccept()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle close with blocking check
  const handleClose = () => {
    if (blocking) return
    onClose()
  }

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (blocking) return
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !blocking) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, blocking, onClose])

  if (!isOpen) return null

  const canAccept = checkboxConfirmed && (hasScrolledToBottom || !termsDocument?.requires_scroll)

  // Convert markdown-ish content to simple HTML for display
  const renderContent = (content: string) => {
    // Simple markdown parsing for display
    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let inList = false
    let listItems: string[] = []

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">{item}</li>
            ))}
          </ul>
        )
        listItems = []
        inList = false
      }
    }

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        flushList()
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6 first:mt-0">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-5">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">
            {line.substring(4)}
          </h3>
        )
      }
      // List items
      else if (line.startsWith('- ')) {
        inList = true
        listItems.push(line.substring(2))
      }
      // Bold text lines (like **Effective Date:**)
      else if (line.startsWith('**') && line.includes('**')) {
        flushList()
        const boldMatch = line.match(/\*\*(.+?)\*\*(.*)/)
        if (boldMatch) {
          elements.push(
            <p key={index} className="text-gray-700 dark:text-gray-300 mb-2">
              <strong className="font-semibold">{boldMatch[1]}</strong>{boldMatch[2]}
            </p>
          )
        }
      }
      // Empty lines
      else if (line.trim() === '') {
        flushList()
      }
      // Regular paragraphs
      else if (line.trim()) {
        flushList()
        // Handle inline bold
        const processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        elements.push(
          <p
            key={index}
            className="text-gray-700 dark:text-gray-300 mb-3"
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        )
      }
    })

    flushList()
    return elements
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : termsDocument?.title || 'Terms & Conditions'}
              </h2>
              {termsDocument && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Version {termsDocument.version} | Effective {new Date(termsDocument.effective_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {!blocking && (
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Summary */}
        {termsDocument?.summary && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {termsDocument.summary}
            </p>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : termsDocument ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {renderContent(termsDocument.content)}
            </div>
          ) : null}
        </div>

        {/* Scroll indicator */}
        {termsDocument?.requires_scroll && !hasScrolledToBottom && (
          <div className="px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              Please scroll to the bottom to continue
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkboxConfirmed}
              onChange={(e) => setCheckboxConfirmed(e.target.checked)}
              disabled={termsDocument?.requires_scroll && !hasScrolledToBottom}
              className="mt-1 w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600
                       text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 focus:ring-offset-0
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I have read, understood, and agree to the terms and conditions outlined above.
            </span>
          </label>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {!blocking && (
              <button
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400
                         hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleAccept}
              disabled={!canAccept || submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900
                       rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  I Accept
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
