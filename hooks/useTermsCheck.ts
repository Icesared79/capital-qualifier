'use client'

import { useState, useEffect, useCallback } from 'react'
import { TermsDocumentType, TermsDocument, TermsAcknowledgement } from '@/lib/types'

interface UseTermsCheckOptions {
  documentType: TermsDocumentType
  contextEntityId?: string
  // If true, will automatically fetch on mount
  autoFetch?: boolean
}

interface UseTermsCheckResult {
  // State
  loading: boolean
  error: string | null
  hasAccepted: boolean
  termsDocument: TermsDocument | null
  acknowledgement: TermsAcknowledgement | null

  // Actions
  checkAcceptance: () => Promise<boolean>
  refetch: () => Promise<void>
}

export function useTermsCheck({
  documentType,
  contextEntityId,
  autoFetch = true,
}: UseTermsCheckOptions): UseTermsCheckResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [termsDocument, setTermsDocument] = useState<TermsDocument | null>(null)
  const [acknowledgement, setAcknowledgement] = useState<TermsAcknowledgement | null>(null)

  const fetchAcceptanceStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        document_type: documentType,
      })

      if (contextEntityId) {
        params.append('context_entity_id', contextEntityId)
      }

      const response = await fetch(`/api/terms/check?${params}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check terms acceptance')
      }

      const data = await response.json()

      setHasAccepted(data.has_accepted)
      setTermsDocument(data.terms_document || null)
      setAcknowledgement(data.acknowledgement || null)
    } catch (err: any) {
      setError(err.message)
      setHasAccepted(false)
    } finally {
      setLoading(false)
    }
  }, [documentType, contextEntityId])

  // Check acceptance and return boolean result
  const checkAcceptance = useCallback(async (): Promise<boolean> => {
    await fetchAcceptanceStatus()
    return hasAccepted
  }, [fetchAcceptanceStatus, hasAccepted])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAcceptanceStatus()
    }
  }, [autoFetch, fetchAcceptanceStatus])

  return {
    loading,
    error,
    hasAccepted,
    termsDocument,
    acknowledgement,
    checkAcceptance,
    refetch: fetchAcceptanceStatus,
  }
}

// Hook for checking multiple terms at once
interface UseMultipleTermsCheckOptions {
  checks: Array<{
    documentType: TermsDocumentType
    contextEntityId?: string
  }>
  autoFetch?: boolean
}

interface MultipleTermsCheckResult {
  loading: boolean
  error: string | null
  results: Map<TermsDocumentType, boolean>
  allAccepted: boolean
  pendingDocuments: TermsDocumentType[]
  refetch: () => Promise<void>
}

export function useMultipleTermsCheck({
  checks,
  autoFetch = true,
}: UseMultipleTermsCheckOptions): MultipleTermsCheckResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Map<TermsDocumentType, boolean>>(new Map())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const checkPromises = checks.map(async ({ documentType, contextEntityId }) => {
        const params = new URLSearchParams({
          document_type: documentType,
        })

        if (contextEntityId) {
          params.append('context_entity_id', contextEntityId)
        }

        const response = await fetch(`/api/terms/check?${params}`)

        if (!response.ok) {
          return { documentType, accepted: false }
        }

        const data = await response.json()
        return { documentType, accepted: data.has_accepted }
      })

      const checkResults = await Promise.all(checkPromises)

      const newResults = new Map<TermsDocumentType, boolean>()
      checkResults.forEach(({ documentType, accepted }) => {
        newResults.set(documentType, accepted)
      })

      setResults(newResults)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [checks])

  useEffect(() => {
    if (autoFetch && checks.length > 0) {
      fetchAll()
    }
  }, [autoFetch, fetchAll, checks.length])

  const allAccepted = Array.from(results.values()).every(Boolean)
  const pendingDocuments = checks
    .filter(({ documentType }) => !results.get(documentType))
    .map(({ documentType }) => documentType)

  return {
    loading,
    error,
    results,
    allAccepted,
    pendingDocuments,
    refetch: fetchAll,
  }
}
