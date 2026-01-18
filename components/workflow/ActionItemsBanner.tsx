'use client'

import Link from 'next/link'
import { FundingApplicationStage } from '@/lib/types'
import { getStageActionItems, STAGE_CONFIG, isTerminalStage } from '@/lib/workflow'

interface ActionItemsBannerProps {
  dealId: string
  currentStage: FundingApplicationStage
  isAdmin?: boolean
  pendingDocuments?: number
}

export default function ActionItemsBanner({
  dealId,
  currentStage,
  isAdmin = false,
  pendingDocuments = 0
}: ActionItemsBannerProps) {
  const actionItems = getStageActionItems(currentStage, isAdmin)
  const stageConfig = STAGE_CONFIG[currentStage]
  const isTerminal = isTerminalStage(currentStage)

  // Don't show banner for terminal stages or if no action items
  if (isTerminal || actionItems.length === 0) {
    return null
  }

  // Determine urgency styling based on stage
  const getUrgencyStyle = () => {
    if (currentStage === 'documents_requested' && pendingDocuments > 0) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-500',
        title: 'text-amber-800 dark:text-amber-200',
        text: 'text-amber-700 dark:text-amber-300'
      }
    }

    if (currentStage === 'closing') {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-500',
        title: 'text-green-800 dark:text-green-200',
        text: 'text-green-700 dark:text-green-300'
      }
    }

    return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-800 dark:text-blue-200',
      text: 'text-blue-700 dark:text-blue-300'
    }
  }

  const style = getUrgencyStyle()

  // Get the main action based on stage
  const getMainAction = () => {
    if (isAdmin) {
      return null // Admins use the AdminControlsPanel instead
    }

    switch (currentStage) {
      case 'qualified':
      case 'documents_requested':
        return {
          label: 'Upload Documents',
          href: `/dashboard/documents?deal=${dealId}`,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )
        }
      case 'term_sheet':
        return {
          label: 'View Documents',
          href: `/dashboard/documents?deal=${dealId}`,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        }
      case 'closing':
        return {
          label: 'Complete Checklist',
          href: `/dashboard/documents?deal=${dealId}`,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        }
      default:
        return null
    }
  }

  const mainAction = getMainAction()

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-4 mb-6`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.icon}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className={`font-semibold ${style.title} mb-1`}>
            {isAdmin ? 'Admin Action Items' : 'Your Next Steps'}
          </h4>

          {/* Action items list */}
          <ul className={`text-sm ${style.text} space-y-1`}>
            {actionItems.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
            {actionItems.length > 3 && (
              <li className="text-sm opacity-75">
                +{actionItems.length - 3} more items...
              </li>
            )}
          </ul>

          {/* Pending documents indicator */}
          {pendingDocuments > 0 && !isAdmin && (
            <p className={`text-sm ${style.text} mt-2 font-medium`}>
              {pendingDocuments} document{pendingDocuments > 1 ? 's' : ''} pending upload
            </p>
          )}
        </div>

        {/* Main Action Button */}
        {mainAction && (
          <Link
            href={mainAction.href}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
          >
            {mainAction.icon}
            {mainAction.label}
          </Link>
        )}
      </div>
    </div>
  )
}
