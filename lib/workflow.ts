/**
 * Workflow Management System
 * Stage rules, transitions, and configuration for funding applications
 */

import { FundingApplicationStage } from './types'

// Stage display configuration
export interface StageConfig {
  label: string
  description: string
  owner: 'client' | 'admin' | 'both'
  color: string
  bgColor: string
  actionItems: {
    client: string[]
    admin: string[]
  }
}

// Stage order and configuration
export const STAGE_ORDER: FundingApplicationStage[] = [
  'draft',
  'qualified',
  'documents_requested',
  'documents_in_review',
  'due_diligence',
  'term_sheet',
  'negotiation',
  'closing',
  'funded'
]

// Terminal/inactive stages
export const TERMINAL_STAGES: FundingApplicationStage[] = [
  'funded',
  'declined',
  'withdrawn'
]

// Stage configurations
export const STAGE_CONFIG: Record<FundingApplicationStage, StageConfig> = {
  draft: {
    label: 'Draft',
    description: 'Application in progress',
    owner: 'client',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    actionItems: {
      client: ['Complete your funding application'],
      admin: []
    }
  },
  qualified: {
    label: 'Submitted',
    description: 'Application submitted, awaiting document request',
    owner: 'admin',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    actionItems: {
      client: [],
      admin: ['Review application', 'Request documents when ready']
    }
  },
  documents_requested: {
    label: 'Documents Requested',
    description: 'Additional documents needed',
    owner: 'client',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    actionItems: {
      client: ['Upload financial statements', 'Provide bank statements', 'Submit loan tape data', 'Upload performance history'],
      admin: ['Monitor document uploads', 'Review submitted documents']
    }
  },
  documents_in_review: {
    label: 'Documents in Review',
    description: 'Documents being reviewed',
    owner: 'admin',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    actionItems: {
      client: ['Respond to any follow-up questions'],
      admin: ['Review all submitted documents', 'Approve or reject documents', 'Request additional information if needed']
    }
  },
  due_diligence: {
    label: 'Due Diligence',
    description: 'Detailed review in progress',
    owner: 'admin',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    actionItems: {
      client: ['Upload loan agreement samples', 'Provide insurance certificates', 'Be available for follow-up calls'],
      admin: ['Conduct thorough due diligence', 'Schedule calls as needed', 'Prepare term sheet']
    }
  },
  term_sheet: {
    label: 'Term Sheet',
    description: 'Terms being negotiated',
    owner: 'both',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    actionItems: {
      client: ['Review proposed terms', 'Upload signed term sheet'],
      admin: ['Issue term sheet', 'Address client questions', 'Negotiate terms as needed']
    }
  },
  negotiation: {
    label: 'Negotiation',
    description: 'Final terms being finalized',
    owner: 'both',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    actionItems: {
      client: ['Review final documents', 'Coordinate with legal counsel'],
      admin: ['Finalize documentation', 'Coordinate legal review']
    }
  },
  closing: {
    label: 'Closing',
    description: 'Deal closing in progress',
    owner: 'both',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    actionItems: {
      client: ['Execute final agreements', 'Provide board resolutions', 'Complete closing checklist'],
      admin: ['Coordinate closing', 'Verify all documents', 'Prepare for funding']
    }
  },
  funded: {
    label: 'Funded',
    description: 'Deal successfully funded',
    owner: 'admin',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    actionItems: {
      client: [],
      admin: []
    }
  },
  declined: {
    label: 'Declined',
    description: 'Application was not approved',
    owner: 'admin',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    actionItems: {
      client: [],
      admin: []
    }
  },
  withdrawn: {
    label: 'Withdrawn',
    description: 'Application withdrawn by applicant',
    owner: 'client',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    actionItems: {
      client: [],
      admin: []
    }
  }
}

// Valid stage transitions
export const VALID_TRANSITIONS: Record<FundingApplicationStage, FundingApplicationStage[]> = {
  draft: ['qualified', 'withdrawn'],
  qualified: ['documents_requested', 'declined', 'withdrawn'],
  documents_requested: ['documents_in_review', 'declined', 'withdrawn'],
  documents_in_review: ['due_diligence', 'documents_requested', 'declined', 'withdrawn'],
  due_diligence: ['term_sheet', 'declined', 'withdrawn'],
  term_sheet: ['negotiation', 'due_diligence', 'declined', 'withdrawn'],
  negotiation: ['closing', 'term_sheet', 'declined', 'withdrawn'],
  closing: ['funded', 'negotiation', 'declined', 'withdrawn'],
  funded: [],
  declined: [],
  withdrawn: []
}

/**
 * Check if a stage transition is valid
 */
export function canTransitionTo(
  currentStage: FundingApplicationStage,
  targetStage: FundingApplicationStage
): boolean {
  const validTargets = VALID_TRANSITIONS[currentStage] || []
  return validTargets.includes(targetStage)
}

/**
 * Get valid next stages for a given stage
 */
export function getValidNextStages(currentStage: FundingApplicationStage): FundingApplicationStage[] {
  return VALID_TRANSITIONS[currentStage] || []
}

/**
 * Get forward-only transitions (excludes going back or terminating)
 */
export function getForwardTransitions(currentStage: FundingApplicationStage): FundingApplicationStage[] {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex === -1) return []

  return VALID_TRANSITIONS[currentStage].filter(stage => {
    const targetIndex = STAGE_ORDER.indexOf(stage)
    return targetIndex > currentIndex
  })
}

/**
 * Get action items for a user based on their role and the current stage
 */
export function getStageActionItems(
  stage: FundingApplicationStage,
  isAdmin: boolean
): string[] {
  const config = STAGE_CONFIG[stage]
  if (!config) return []

  if (isAdmin) {
    return config.actionItems.admin
  }
  return config.actionItems.client
}

/**
 * Get stage configuration
 */
export function getStageConfig(stage: FundingApplicationStage): StageConfig | undefined {
  return STAGE_CONFIG[stage]
}

/**
 * Check if a stage is terminal (no further progression)
 */
export function isTerminalStage(stage: FundingApplicationStage): boolean {
  return TERMINAL_STAGES.includes(stage)
}

/**
 * Get the stage index for progress calculation
 */
export function getStageIndex(stage: FundingApplicationStage): number {
  return STAGE_ORDER.indexOf(stage)
}

/**
 * Calculate progress percentage through the pipeline
 */
export function calculateProgress(stage: FundingApplicationStage): number {
  if (stage === 'declined' || stage === 'withdrawn') return 0
  const index = getStageIndex(stage)
  if (index === -1) return 0
  return Math.round((index / (STAGE_ORDER.length - 1)) * 100)
}

/**
 * Get human-readable transition message
 */
export function getTransitionMessage(
  fromStage: FundingApplicationStage,
  toStage: FundingApplicationStage
): string {
  const toConfig = STAGE_CONFIG[toStage]

  if (toStage === 'declined') {
    return 'Your application has been declined.'
  }

  if (toStage === 'withdrawn') {
    return 'Your application has been withdrawn.'
  }

  if (toStage === 'funded') {
    return 'Congratulations! Your funding has been completed.'
  }

  return `Your application has moved to ${toConfig?.label || toStage}.`
}

/**
 * Get notification title for stage change
 */
export function getStageChangeNotificationTitle(
  toStage: FundingApplicationStage
): string {
  const config = STAGE_CONFIG[toStage]

  if (toStage === 'funded') {
    return 'Funding Complete!'
  }

  if (toStage === 'declined') {
    return 'Application Update'
  }

  return `Stage Updated: ${config?.label || toStage}`
}

// Document categories for reference
export const DOCUMENT_CATEGORIES = [
  { value: 'financials', label: 'Financials', description: 'Financial statements, tax returns, bank statements' },
  { value: 'loan_tape', label: 'Loan Tape', description: 'Loan-level data, portfolio metrics, performance data' },
  { value: 'legal', label: 'Legal', description: 'Agreements, licenses, compliance documents' },
  { value: 'corporate', label: 'Corporate', description: 'Formation documents, bylaws, ownership structure' },
  { value: 'due_diligence', label: 'Due Diligence', description: 'Background checks, insurance, audit reports' },
  { value: 'other', label: 'Other', description: 'Additional supporting documentation' }
] as const

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]['value']
