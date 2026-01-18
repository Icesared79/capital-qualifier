'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ChecklistItem, DealChecklistStatus, FundingApplicationStage } from '@/lib/types'
import { DOCUMENT_CATEGORIES } from '@/lib/workflow'

interface DocumentChecklistProps {
  dealId: string
  currentStage: FundingApplicationStage
  isAdmin?: boolean
  assetType?: string
  fundingAmount?: string
}

interface ChecklistItemWithStatus extends ChecklistItem {
  dealStatus?: DealChecklistStatus
  assetTypes?: string[] | null
  minFundingTier?: string | null
  isCore?: boolean
  isManualAdd?: boolean
  waivedReason?: string | null
}

interface CategoryProgress {
  category: string
  label: string
  items: ChecklistItemWithStatus[]
  completed: number
  total: number
}

// Funding tier order for comparison
const FUNDING_TIER_ORDER = ['under_500k', '500k_2m', '2m_10m', '10m_50m', 'over_50m']

// Map capital amount string to funding tier key
function mapCapitalToTier(capitalAmount: string): string | null {
  if (!capitalAmount) return null

  // If already a tier key, return it
  if (FUNDING_TIER_ORDER.includes(capitalAmount)) return capitalAmount

  // Try to extract numeric value
  const cleanedAmount = capitalAmount.replace(/[^0-9.]/g, '')
  const numValue = parseFloat(cleanedAmount)

  if (isNaN(numValue)) {
    // Try to parse range strings like "$50,000,000 - $100,000,000"
    const match = capitalAmount.match(/\$?([\d,]+)/g)
    if (match && match.length > 0) {
      const firstNum = parseFloat(match[0].replace(/[^0-9.]/g, ''))
      if (!isNaN(firstNum)) {
        if (firstNum < 500000) return 'under_500k'
        if (firstNum < 2000000) return '500k_2m'
        if (firstNum < 10000000) return '2m_10m'
        if (firstNum < 50000000) return '10m_50m'
        return 'over_50m'
      }
    }
    return null
  }

  if (numValue < 500000) return 'under_500k'
  if (numValue < 2000000) return '500k_2m'
  if (numValue < 10000000) return '2m_10m'
  if (numValue < 50000000) return '10m_50m'
  return 'over_50m'
}

function meetsMinFundingTier(dealTier: string | undefined, requiredMinTier: string | null): boolean {
  if (!requiredMinTier) return true // No minimum requirement
  if (!dealTier) return false

  const dealIndex = FUNDING_TIER_ORDER.indexOf(dealTier)
  const requiredIndex = FUNDING_TIER_ORDER.indexOf(requiredMinTier)

  return dealIndex >= requiredIndex
}

function matchesAssetType(dealAssetType: string | undefined, itemAssetTypes: string[] | null): boolean {
  if (!itemAssetTypes || itemAssetTypes.length === 0) return true // No asset type filter
  if (!dealAssetType) return false

  return itemAssetTypes.includes(dealAssetType)
}

export default function DocumentChecklist({
  dealId,
  currentStage,
  isAdmin = false,
  assetType,
  fundingAmount
}: DocumentChecklistProps) {
  const [mounted, setMounted] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItemWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dealAssetType, setDealAssetType] = useState<string | undefined>(assetType)
  const [dealFundingAmount, setDealFundingAmount] = useState<string | undefined>(fundingAmount)
  const [showWaiveModal, setShowWaiveModal] = useState<string | null>(null)
  const [waiveReason, setWaiveReason] = useState('')
  const [isWaiving, setIsWaiving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Use ref to store supabase client to avoid hydration issues
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null)

  // Initialize supabase client only on client side
  if (typeof window !== 'undefined' && !supabaseRef.current) {
    supabaseRef.current = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  const supabase = supabaseRef.current!

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  // Mark as mounted after first render
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && supabase) {
      fetchChecklistData()
    }
  }, [mounted, dealId, currentStage, dealAssetType, dealFundingAmount])

  const fetchChecklistData = async () => {
    try {
      setIsLoading(true)

      // Fetch deal info if not provided
      if (!dealAssetType || !dealFundingAmount) {
        const { data: deal } = await supabase
          .from('deals')
          .select(`
            qualification_data,
            capital_amount,
            company:companies (
              qualification_data
            )
          `)
          .eq('id', dealId)
          .single()

        if (deal) {
          // Get asset type from deal or company qualification_data
          const dealQd = deal.qualification_data || {}
          const companyQd = (deal.company as any)?.qualification_data || {}

          if (!dealAssetType) {
            // Check multiple possible locations for asset type
            const assetType = dealQd.assetType ||
              dealQd.assets?.[0] ||
              companyQd.assetType ||
              companyQd.assets?.[0]
            if (assetType) setDealAssetType(assetType)
          }

          if (!dealFundingAmount) {
            // Map capital amount string to funding tier key
            const capitalAmount = deal.capital_amount || dealQd.fundingAmount || companyQd.capitalAmount
            if (capitalAmount) {
              const mappedTier = mapCapitalToTier(capitalAmount)
              if (mappedTier) setDealFundingAmount(mappedTier)
            }
          }
        }
      }

      // Fetch ALL checklist items (show complete requirements upfront)
      const { data: items, error: itemsError } = await supabase
        .from('document_checklist_items')
        .select('*')
        .order('display_order', { ascending: true })

      if (itemsError) throw itemsError

      // Get deal checklist status (including manual adds)
      const { data: statuses, error: statusError } = await supabase
        .from('deal_checklist_status')
        .select(`
          *,
          documents(id, name, status)
        `)
        .eq('deal_id', dealId)

      if (statusError) throw statusError

      // Filter items based on deal properties
      const filteredItems = (items || []).filter(item => {
        // Core items always show
        if (item.is_core) return true

        // Check asset type match
        if (!matchesAssetType(dealAssetType, item.asset_types)) return false

        // Check funding tier match
        if (!meetsMinFundingTier(dealFundingAmount, item.min_funding_tier)) return false

        return true
      })

      // Map items with their status
      const itemsWithStatus: ChecklistItemWithStatus[] = filteredItems.map(item => {
        const status = (statuses || []).find(s => s.checklist_item_id === item.id)
        return {
          id: item.id,
          stage: item.stage,
          category: item.category,
          name: item.name,
          description: item.description,
          isRequired: item.is_required,
          displayOrder: item.display_order,
          assetTypes: item.asset_types,
          minFundingTier: item.min_funding_tier,
          isCore: item.is_core,
          isManualAdd: status?.is_manual_add || false,
          waivedReason: status?.waived_reason,
          dealStatus: status ? {
            id: status.id,
            dealId: status.deal_id,
            checklistItemId: status.checklist_item_id,
            documentId: status.document_id,
            status: status.status,
            createdAt: status.created_at,
            updatedAt: status.updated_at,
            document: status.documents
          } : undefined
        }
      })

      setChecklistItems(itemsWithStatus)
    } catch (err: any) {
      console.error('Error fetching checklist:', err)
      if (err?.code === '42P01') {
        setError('Document checklist tables not set up. Please run the database migration.')
      } else if (err?.message?.includes('permission denied') || err?.code === '42501') {
        setError('Permission denied. Please check RLS policies.')
      } else {
        setError(`Failed to load document checklist: ${err?.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleWaiveItem = async (itemId: string) => {
    if (!waiveReason.trim()) return

    setIsWaiving(true)
    try {
      // Check if status exists
      const { data: existing } = await supabase
        .from('deal_checklist_status')
        .select('id')
        .eq('deal_id', dealId)
        .eq('checklist_item_id', itemId)
        .single()

      if (existing) {
        await supabase
          .from('deal_checklist_status')
          .update({
            status: 'waived',
            waived_reason: waiveReason,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('deal_checklist_status')
          .insert({
            deal_id: dealId,
            checklist_item_id: itemId,
            status: 'waived',
            waived_reason: waiveReason
          })
      }

      setShowWaiveModal(null)
      setWaiveReason('')
      fetchChecklistData()
    } catch (err) {
      console.error('Error waiving item:', err)
    } finally {
      setIsWaiving(false)
    }
  }

  const handleUnwaive = async (itemId: string) => {
    try {
      await supabase
        .from('deal_checklist_status')
        .update({
          status: 'pending',
          waived_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', dealId)
        .eq('checklist_item_id', itemId)

      fetchChecklistData()
    } catch (err) {
      console.error('Error unwaiving item:', err)
    }
  }

  // Group items by category
  const categorizedProgress: CategoryProgress[] = DOCUMENT_CATEGORIES.map(cat => {
    const items = checklistItems.filter(item => item.category === cat.value)
    const completed = items.filter(item =>
      item.dealStatus?.status === 'approved' || item.dealStatus?.status === 'waived'
    ).length
    return {
      category: cat.value,
      label: cat.label,
      items,
      completed,
      total: items.length
    }
  }).filter(cat => cat.total > 0)

  // Overall progress
  const totalItems = checklistItems.length
  const completedItems = checklistItems.filter(item =>
    item.dealStatus?.status === 'approved' || item.dealStatus?.status === 'waived'
  ).length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'waived':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )
      case 'uploaded':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
          </svg>
        )
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'waived':
        return 'Waived'
      case 'uploaded':
        return 'Under Review'
      default:
        return 'Pending'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
      case 'waived':
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
      case 'uploaded':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getAssetTypeLabel = (types: string[] | null | undefined) => {
    if (!types || types.length === 0) return null
    const labels: Record<string, string> = {
      cre: 'CRE',
      commercial_real_estate: 'CRE',
      residential: 'Residential',
      residential_real_estate: 'Residential',
      real_estate: 'Real Estate',
      consumer: 'Consumer',
      consumer_loans: 'Consumer',
      smb: 'SMB',
      business_loans: 'Business',
      sba: 'SBA',
      mca: 'MCA',
      specialty_finance: 'Specialty',
      factoring: 'Factoring',
      private_equity: 'PE/Fund',
      fund: 'Fund',
      loan_portfolio: 'Loan Portfolio',
      equipment: 'Equipment',
      receivables: 'Receivables'
    }
    return types.map(t => labels[t] || t).join(', ')
  }

  // Show loading state until mounted and data loaded
  if (!mounted || isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (totalItems === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Checklist</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No document requirements.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Checklist</h3>
            {dealAssetType && (
              <span className="text-sm px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                {getAssetTypeLabel([dealAssetType]) || dealAssetType}
              </span>
            )}
          </div>
          <Link
            href={`/dashboard/documents?deal=${dealId}`}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            View All
          </Link>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {completedItems} / {totalItems}
          </span>
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {categorizedProgress.map(category => {
          const isExpanded = expandedCategories[category.category] ?? false
          const isComplete = category.completed === category.total

          return (
            <div key={category.category}>
              {/* Category Header - Clickable */}
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Expand/Collapse Icon */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {/* Category Icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    {category.category === 'financials' && (
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {category.category === 'loan_tape' && (
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {category.category === 'legal' && (
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    )}
                    {category.category === 'corporate' && (
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {category.category === 'due_diligence' && (
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {category.category === 'other' && (
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    )}
                  </div>
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {category.completed}/{category.total}
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-4 space-y-3">
                  {category.items.map(item => {
                    const isDone = item.dealStatus?.status === 'approved' || item.dealStatus?.status === 'waived'
                    const isUploaded = item.dealStatus?.status === 'uploaded'
                    const isWaived = item.dealStatus?.status === 'waived'

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          isDone ? 'bg-gray-50 dark:bg-gray-700/50' :
                          isUploaded ? 'bg-teal-50 dark:bg-teal-900/20' :
                          'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isDone ? (
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isUploaded ? (
                            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${
                              isDone ? 'text-gray-600 dark:text-gray-400' :
                              isUploaded ? 'text-teal-700 dark:text-teal-400' :
                              'text-gray-900 dark:text-white'
                            }`}>
                              {item.name}
                            </span>
                            {item.isRequired && !isDone && (
                              <span className="text-xs font-medium px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                                Required
                              </span>
                            )}
                            {!item.isCore && item.assetTypes && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                {getAssetTypeLabel(item.assetTypes)}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                          )}
                          {isWaived && item.waivedReason && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 italic">
                              Waived: {item.waivedReason}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0">
                          {isUploaded && (
                            <span className="text-xs font-medium px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded">
                              In Review
                            </span>
                          )}
                          {isAdmin && !isDone && !isUploaded && (
                            <button
                              onClick={() => setShowWaiveModal(item.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Waive
                            </button>
                          )}
                          {isAdmin && isWaived && (
                            <button
                              onClick={() => handleUnwaive(item.id)}
                              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer CTA */}
      {completedItems < totalItems && (
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={`/dashboard/documents?deal=${dealId}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Documents
          </Link>
        </div>
      )}

      {/* Waive Modal */}
      {showWaiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Waive Requirement
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for waiving this document requirement.
            </p>
            <textarea
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              placeholder="Reason for waiving..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowWaiveModal(null)
                  setWaiveReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWaiveItem(showWaiveModal)}
                disabled={!waiveReason.trim() || isWaiving}
                className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-50"
              >
                {isWaiving ? 'Waiving...' : 'Waive Requirement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
