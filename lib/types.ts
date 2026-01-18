export type QualificationScore = 'strong' | 'moderate' | 'needs_discussion'

export interface CategoryScore {
  name: string
  score: number
  maxScore: number
  label: string
  description: string
}

// Capital structure types that could be a fit
export type CapitalType =
  | 'warehouse_line'
  | 'forward_flow'
  | 'whole_loan_sale'
  | 'securitization'
  | 'credit_facility'
  | 'equity_partnership'
  | 'mezzanine'

export interface CapitalFit {
  type: CapitalType
  name: string
  fit: 'excellent' | 'good' | 'possible' | 'not_recommended'
  description: string
  minVolume?: string
  requirements?: string[]
}

export interface DimensionScore {
  dimension: string
  score: number
  maxScore: number
  icon: string
  insights: string[]
}

export interface OriginatorQualification {
  // Overall score (0-100)
  overallScore: number
  qualificationTier: QualificationScore

  // Multi-dimensional scoring
  dimensions: {
    scale: DimensionScore
    quality: DimensionScore
    readiness: DimensionScore
    marketPosition: DimensionScore
    capitalAlignment: DimensionScore
  }

  // Capital fit recommendations
  capitalFits: CapitalFit[]
  recommendedStructure: CapitalType | null

  // Opportunity indicators
  opportunitySize: 'institutional' | 'mid_market' | 'emerging' | 'early_stage'
  timeToFunding: 'fast_track' | 'standard' | 'extended' | 'needs_preparation'

  // Narrative
  strengths: string[]
  considerations: string[]
  nextSteps: string[]

  // Legacy compatibility
  categories: CategoryScore[]
  totalPoints: number
  maxPoints: number
}

export interface OriginatorData {
  locatedInUS: boolean | null
  country?: string
  countryOther?: string
  assetClass: string[]
  assetClassOther?: string
  capitalGoal: string[]
  capitalGoalOther?: string
  capitalAmount: string | number
  annualVolume: string
  avgDealSize: string
  defaultRate: string
  docStandard: string
  geoFocus: string
  geoFocusOther?: string
  currentFunding: string[]
  currentFundingOther?: string
  capitalMotivation: string[]
  companyName: string
  contactName: string
  email: string
  phone: string
}

export interface BorrowerData {
  locatedInUS: boolean | null
  country?: string
  countryOther?: string
  fundingPurpose: string
  fundingPurposeOther?: string
  amountNeeded: string
  timeline: string
  collateralType: string
  collateralOther?: string
  assetValue: string
  existingDebt: string
  businessType: string
  businessTypeOther?: string
  yearsInBusiness: string
  annualRevenue: string
  bankStatus: string
  rejectionReasons: string[]
  companyName: string
  contactName: string
  email: string
  phone: string
  bestTimeToReach: string
}

export interface Lead {
  id: string
  createdAt: string
  leadType: 'originator' | 'borrower'
  qualificationScore: QualificationScore
  qualificationFactors: {
    strengths: string[]
    considerations: string[]
  }
  data: OriginatorData | BorrowerData
}

export interface SelectOption {
  value: string
  label: string
  description?: string
}

// ============================================
// NEW: Business Profile + Funding Applications Model
// ============================================

// Asset types a business can have
export type AssetType =
  | 'loan_portfolio'
  | 'real_estate'
  | 'equipment'
  | 'receivables'
  | 'cash_flow'
  | 'other'

// Business profile (stored on companies table)
export interface BusinessProfile {
  id: string
  name: string
  locatedInUS: boolean
  country?: string
  countryOther?: string
  location?: string // city, state for US
  businessType?: string
  assets: AssetType[]
  assetDetails?: {
    loanPortfolio?: {
      assetClasses: string[]
      annualVolume?: string
      avgDealSize?: string
      defaultRate?: string
      docStandard?: string
    }
    realEstate?: {
      propertyTypes: string[]
      totalValue?: string
    }
    other?: {
      description: string
    }
  }
  yearFounded?: string
  teamSize?: string
  description?: string
  website?: string
}

// Funding application (stored on deals table)
export interface FundingApplication {
  id: string
  companyId: string
  qualificationCode: string
  stage: FundingApplicationStage

  // Funding request
  capitalAmount: string | number
  fundingPurpose: string
  fundingPurposeOther?: string

  // Qualification results
  qualificationData?: Record<string, any>
  qualificationScore?: QualificationScore
  overallScore?: number
  capitalFits?: CapitalFit[]
  recommendedStructure?: CapitalType
  opportunitySize?: string
  timeToFunding?: string
  strengths?: string[]
  considerations?: string[]
  nextSteps?: string[]

  // Timestamps
  createdAt: string
  updatedAt: string
}

export type FundingApplicationStage =
  | 'draft'
  | 'qualified'
  | 'documents_requested'
  | 'documents_in_review'
  | 'due_diligence'
  | 'term_sheet'
  | 'negotiation'
  | 'closing'
  | 'funded'
  | 'declined'
  | 'withdrawn'

// Unified lead data (from /apply page)
export interface UnifiedLeadData {
  // Business info
  companyName: string
  locatedInUS: boolean
  country?: string
  countryOther?: string
  location?: string

  // Assets
  assets: string[]
  loanAssetClasses?: string[]
  realEstateTypes?: string[]
  assetOther?: string

  // Funding need
  fundingAmount: string
  fundingPurpose: string
  fundingPurposeOther?: string

  // Contact
  contactName: string
  email: string
  phone?: string
}

// ============================================
// Business Profile Data (stored in companies.qualification_data)
// ============================================
export interface AddressData {
  street: string
  city: string
  state: string
  zip: string
  fullAddress: string
}

export interface Owner {
  name: string
  title: string
  email: string
}

export interface BusinessProfileData {
  // Business basics
  companyName: string
  locatedInUS: boolean
  country?: string
  countryOther?: string
  location?: string

  // Address data
  physicalAddress?: AddressData
  mailingAddress?: AddressData
  sameAsPhysical?: boolean

  // Owners/Founders
  owners?: Owner[]

  // Company details
  yearFounded?: string
  teamSize?: string
  description?: string
  website?: string

  // Assets
  assets: string[]
  assetOther?: string

  // Portfolio details (for loan originators)
  loanAssetClasses?: string[]
  realEstateTypes?: string[]
  annualVolume?: string
  avgDealSize?: string
  portfolioSize?: string
  geographicFocus?: string

  // Portfolio quality
  defaultRate?: string
  docStandard?: string
  avgLoanTerm?: string
  avgInterestRate?: string
  occupancyRate?: string

  // Current funding
  currentFunding?: string[]
  hasExistingFacility?: boolean
  facilityDetails?: string

  // Branding
  logo_url?: string
}

// ============================================
// Offering Data (stored in deals table)
// ============================================
export interface OfferingData {
  // Capital goals
  capitalGoals: string[]
  capitalGoalOther?: string

  // Funding request
  fundingAmount: string
  fundingPurpose: string
  fundingPurposeOther?: string
  timeline?: string

  // Scoring results (stored in deals.notes as JSON)
  qualificationScore?: QualificationScore
  overallScore?: number
  capitalFits?: CapitalFit[]
  recommendedStructure?: CapitalType
  opportunitySize?: string
  timeToFunding?: string
  strengths?: string[]
  considerations?: string[]
  nextSteps?: string[]
  dimensions?: Record<string, DimensionScore>
}

// ============================================
// Workflow Management Types
// ============================================

// Notification types
export type NotificationType =
  | 'stage_change'
  | 'document_approved'
  | 'document_rejected'
  | 'action_required'
  | 'new_deal_released'
  | 'deal_matches_criteria'

export interface Notification {
  id: string
  userId: string
  dealId: string | null
  type: NotificationType
  title: string
  message: string
  readAt: string | null
  createdAt: string
}

// Document checklist types
export type DocumentCategory =
  | 'financials'
  | 'loan_tape'
  | 'legal'
  | 'corporate'
  | 'due_diligence'
  | 'other'

export type ChecklistItemStatus =
  | 'pending'
  | 'uploaded'
  | 'approved'
  | 'waived'

export interface ChecklistItem {
  id: string
  stage: FundingApplicationStage
  category: DocumentCategory
  name: string
  description: string | null
  isRequired: boolean
  displayOrder: number
}

export interface DealChecklistStatus {
  id: string
  dealId: string
  checklistItemId: string
  documentId: string | null
  status: ChecklistItemStatus
  createdAt: string
  updatedAt: string
  // Joined data
  checklistItem?: ChecklistItem
  document?: {
    id: string
    name: string
    status: string
  }
}

// Document status types
export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface Document {
  id: string
  dealId: string
  uploadedBy: string
  name: string
  filePath: string
  fileSize: number
  mimeType: string
  category: DocumentCategory
  status: DocumentStatus
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
}

// User profile with role
export type UserRole = 'client' | 'admin' | 'legal' | 'optma' | 'investor'

// Handoff target teams
export type HandoffTarget = 'legal' | 'optma'

export interface UserProfile {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

// ============================================
// Admin Dashboard Types
// ============================================

// Legal review status for deals
export type LegalStatus =
  | 'not_required'
  | 'pending'
  | 'assigned'
  | 'in_review'
  | 'approved'
  | 'changes_required'
  | 'rejected'

// Tokenization status for deals
export type TokenizationStatus =
  | 'not_required'
  | 'pending'
  | 'assigned'
  | 'green_lit'
  | 'configuring'
  | 'minting'
  | 'ready'
  | 'failed'

// Deal with company and owner information for admin views
export interface DealWithCompany {
  id: string
  qualification_code: string
  stage: FundingApplicationStage
  assigned_to: string | null
  internal_notes: string | null
  handoff_to?: HandoffTarget | null  // Optional until migration is run
  handed_off_at?: string | null       // Optional until migration is run
  handed_off_by?: string | null       // Optional until migration is run
  // Legal partner fields
  legal_partner_id?: string | null
  legal_status?: LegalStatus
  legal_signed_off_at?: string | null
  legal_notes?: string | null
  legal_partner?: FundingPartner | null  // Joined data
  // Tokenization partner fields
  tokenization_partner_id?: string | null
  tokenization_status?: TokenizationStatus
  tokenization_green_lit_at?: string | null
  tokenization_completed_at?: string | null
  tokenization_notes?: string | null
  tokenization_partner?: FundingPartner | null  // Joined data
  created_at: string
  updated_at: string
  stage_changed_at: string | null
  overall_score: number | null
  qualification_score: QualificationScore | null
  capital_amount: string | number | null
  company: {
    id: string
    name: string
    owner: {
      id: string
      email: string
      full_name: string | null
    } | null
  } | null
}

// Pipeline stage counts for dashboard
export interface PipelineCounts {
  draft: number
  qualified: number
  documents_requested: number
  documents_in_review: number
  due_diligence: number
  term_sheet: number
  negotiation: number
  closing: number
  funded: number
  declined: number
  withdrawn: number
}

// Admin filters for deals list
export interface DealsFilters {
  stage?: FundingApplicationStage
  assigned_to?: string
  handoff_to?: HandoffTarget
  search?: string
  dateFrom?: string
  dateTo?: string
}

// Team member for assignment
export interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: UserRole
}

// ============================================
// PARTNER PORTAL & LEGAL TRACKING TYPES
// ============================================

// Partner organization type (what kind of entity)
export type PartnerType =
  | 'institutional'
  | 'family_office'
  | 'private_credit'
  | 'hedge_fund'
  | 'bank'
  | 'other'

// Partner role in deal flow
export type PartnerRole = 'funding' | 'legal' | 'tokenization'

export interface FundingPartner {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  partner_role: PartnerRole // funding or legal
  partner_type: PartnerType
  focus_asset_classes?: string[]
  min_deal_size?: string
  max_deal_size?: string
  geographic_focus?: string[]
  can_tokenize: boolean
  has_legal_team: boolean
  provides_spv_formation: boolean
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

// Deal Release (tracks which deals sent to which partners)
export type DealReleaseStatus =
  // Funding partner statuses
  | 'pending'
  | 'viewed'
  | 'interested'
  | 'reviewing'
  | 'due_diligence'
  | 'term_sheet'
  | 'passed'
  | 'funded'
  // Legal partner statuses
  | 'legal_review'
  | 'legal_approved'
  | 'legal_changes'
  | 'legal_rejected'

export type AccessLevel = 'summary' | 'full' | 'documents'

export interface DealRelease {
  id: string
  deal_id: string
  partner_id: string
  released_by: string
  released_at: string
  release_notes?: string
  access_level: AccessLevel
  status: DealReleaseStatus
  first_viewed_at?: string
  interest_expressed_at?: string
  passed_at?: string
  pass_reason?: string
  partner_notes?: string
  created_at: string
  updated_at: string
  // Joined data
  deal?: DealWithCompany
  partner?: FundingPartner
  released_by_user?: {
    email: string
    full_name: string | null
  }
}

// Partner Access Log (audit trail)
export type PartnerAction =
  | 'viewed_summary'
  | 'viewed_full'
  | 'downloaded_package'
  | 'downloaded_document'
  | 'expressed_interest'
  | 'passed'
  | 'submitted_term_sheet'
  | 'added_note'

export interface PartnerAccessLog {
  id: string
  partner_id: string
  deal_id: string
  user_id?: string
  action: PartnerAction
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// ============================================
// LEGAL STRUCTURE TYPES
// ============================================

export type LegalStatus =
  | 'not_started'
  | 'spv_formation'
  | 'securities_filing'
  | 'documentation'
  | 'tokenization'
  | 'complete'
  | 'on_hold'

export type SPVEntityType =
  | 'delaware_llc'
  | 'delaware_lp'
  | 'delaware_corp'
  | 'cayman_fund'
  | 'bvi_company'
  | 'other'

export type SPVStatus = 'pending' | 'forming' | 'formed' | 'active' | 'dissolved'

export type ExemptionType =
  | 'reg_d_506b'
  | 'reg_d_506c'
  | 'reg_a_tier1'
  | 'reg_a_tier2'
  | 'reg_s'
  | 'reg_cf'
  | 'reg_d_504'
  | 'other'

export type SECFilingStatus =
  | 'not_filed'
  | 'preparing'
  | 'filed'
  | 'approved'
  | 'rejected'
  | 'amended'

export type DocStatus = 'not_started' | 'drafting' | 'review' | 'final' | 'amended'

export type TokenStandard = 'erc1400' | 'erc3643' | 'erc20' | 'st20' | 'other'

export type Blockchain = 'ethereum' | 'polygon' | 'avalanche' | 'solana' | 'stellar' | 'other'

export type TokenStatus =
  | 'not_started'
  | 'designing'
  | 'development'
  | 'testing'
  | 'auditing'
  | 'deployed'
  | 'active'

export type AuditStatus = 'not_started' | 'in_progress' | 'complete' | 'not_required'

export interface LegalStructure {
  id: string
  deal_id: string
  status: LegalStatus

  // SPV Info
  spv_name?: string
  spv_entity_type?: SPVEntityType
  spv_jurisdiction?: string
  spv_formation_date?: string
  spv_ein?: string
  spv_registered_agent?: string
  spv_status: SPVStatus
  spv_owner: 'bitcense' | 'optima' | 'shared'

  // Securities
  exemption_type?: ExemptionType
  offering_amount?: number
  min_investment?: number
  max_investors?: number
  sec_filing_status: SECFilingStatus
  sec_filing_date?: string
  sec_file_number?: string
  sec_owner: 'bitcense' | 'optima' | 'shared'
  blue_sky_required: boolean
  blue_sky_states?: string[]
  blue_sky_status: 'not_started' | 'in_progress' | 'complete' | 'not_required'

  // Offering Docs
  ppm_status: DocStatus
  ppm_version?: string
  ppm_last_updated?: string
  subscription_agreement_status: DocStatus
  operating_agreement_status: DocStatus
  docs_owner: 'bitcense' | 'optima' | 'shared'

  // Tokenization
  token_standard?: TokenStandard
  blockchain?: Blockchain
  token_name?: string
  token_symbol?: string
  contract_address?: string
  deployment_date?: string
  transfer_restrictions?: {
    accredited_only?: boolean
    holding_period_days?: number
    max_investors?: number
    geographic_restrictions?: string[]
  }
  whitelist_enabled: boolean
  token_status: TokenStatus
  token_owner: 'bitcense' | 'optima' | 'shared'

  // Compliance
  kyc_provider?: string
  aml_provider?: string
  transfer_agent?: string
  cap_table_provider?: string
  audit_firm?: string
  audit_status: AuditStatus

  // Timeline
  target_close_date?: string
  actual_close_date?: string
  notes?: string

  created_at: string
  updated_at: string
}

// Legal Checklist Item
export type LegalChecklistCategory =
  | 'spv'
  | 'securities'
  | 'offering_docs'
  | 'token'
  | 'compliance'
  | 'closing'

export type LegalChecklistOwner = 'bitcense' | 'optima' | 'shared' | 'client'

export type LegalChecklistStatus = 'pending' | 'in_progress' | 'blocked' | 'review' | 'complete'

export interface LegalChecklistItem {
  id: string
  legal_structure_id: string
  category: LegalChecklistCategory
  item_name: string
  description?: string
  owner: LegalChecklistOwner
  assigned_to?: string
  status: LegalChecklistStatus
  blocked_reason?: string
  due_date?: string
  completed_at?: string
  completed_by?: string
  sort_order: number
  notes?: string
  created_at: string
  updated_at: string
}

// Legal Document Types
export type LegalDocumentType =
  // SPV Docs
  | 'articles_of_organization'
  | 'operating_agreement'
  | 'certificate_of_formation'
  | 'ein_confirmation'
  | 'registered_agent_agreement'
  // Securities Filings
  | 'form_d'
  | 'form_d_amendment'
  | 'reg_a_filing'
  | 'blue_sky_filing'
  // Offering Docs
  | 'ppm'
  | 'ppm_supplement'
  | 'subscription_agreement'
  | 'investor_questionnaire'
  | 'side_letter'
  // Token Docs
  | 'token_whitepaper'
  | 'smart_contract_audit'
  | 'security_audit'
  // Other
  | 'legal_opinion'
  | 'board_resolution'
  | 'other'

export type LegalDocVisibility = 'internal' | 'partner' | 'investor' | 'public'

export interface LegalDocument {
  id: string
  legal_structure_id: string
  document_type: LegalDocumentType
  name: string
  description?: string
  file_path: string
  file_size?: number
  mime_type?: string
  version: string
  is_current: boolean
  previous_version_id?: string
  status: 'draft' | 'review' | 'approved' | 'final' | 'superseded'
  uploaded_by: string
  uploaded_at: string
  approved_by?: string
  approved_at?: string
  visibility: LegalDocVisibility
  created_at: string
  updated_at: string
}

// ============================================
// PARTNER PORTAL VIEW TYPES
// ============================================

// Summary view for partners (before expressing interest)
export interface DealSummary {
  id: string
  qualification_code: string
  company_name: string
  company_type: 'originator' | 'borrower'
  qualification_score: QualificationScore | null
  overall_score: number | null
  opportunity_size: string | null
  asset_classes: string[]
  geographic_focus: string | null
  capital_amount: string | null
  strengths: string[] | null
  released_at: string
  release_status: DealReleaseStatus
}

// Full deal view for partners (after expressing interest)
export interface DealFullPackage extends DealSummary {
  // Company details
  company_description?: string
  year_founded?: string
  team_size?: string
  website?: string

  // Portfolio metrics
  annual_volume?: string
  avg_deal_size?: string
  portfolio_size?: string
  default_rate?: string
  doc_standard?: string

  // Contact info
  contact_name?: string
  contact_email?: string
  contact_phone?: string

  // Scoring details
  capital_fits: CapitalFit[] | null
  recommended_structure: CapitalType | null
  time_to_funding: string | null
  considerations: string[] | null
  next_steps: string[] | null
  dimensions?: Record<string, DimensionScore>

  // Documents
  documents: {
    category: DocumentCategory
    count: number
    approved_count: number
  }[]

  // Legal structure (if started)
  legal_structure?: Partial<LegalStructure>
}

// ============================================
// PARTNER DASHBOARD TYPES
// ============================================

// Email notification frequency options
export type EmailFrequency = 'immediate' | 'daily_digest' | 'weekly_digest' | 'off'

// Partner notification preferences (stored in partner_notification_preferences table)
export interface PartnerNotificationPreferences {
  id: string
  partner_id: string

  // Deal Criteria
  preferred_asset_classes: string[] | null
  min_deal_size: string | null
  max_deal_size: string | null
  preferred_geographies: string[] | null
  min_score: number | null

  // Notification Settings
  email_alerts_enabled: boolean
  email_frequency: EmailFrequency
  in_app_alerts_enabled: boolean
  notification_email: string | null

  created_at: string
  updated_at: string
}

// Partner dashboard statistics
export interface PartnerDashboardStats {
  total: number
  new: number           // pending status (not yet viewed)
  in_progress: number   // viewed, interested, reviewing
  due_diligence: number // due_diligence status
  passed: number        // passed status
  funded: number        // funded status
}

// Deal match information for criteria matching
export interface DealMatchInfo {
  matches: boolean
  matchReasons: string[]
  mismatches: string[]
}

// Deal release with match info for partner dashboard
export interface DealReleaseWithMatch extends DealRelease {
  matchInfo?: DealMatchInfo
}

// Partner deal action types
export type PartnerDealAction =
  | 'express_interest'
  | 'pass'
  | 'start_due_diligence'
  | 'add_note'
  | 'assign_legal'

// Partner dashboard filter tabs
export type PartnerDashboardTab =
  | 'all'
  | 'new'
  | 'in_progress'
  | 'due_diligence'
  | 'passed'
  | 'funded'

// ============================================
// LEGAL & SPV FEE TYPES
// ============================================

// Fee type (how the fee is calculated)
export type FeeType = 'flat' | 'hourly' | 'percentage' | 'annual'

// Fee category
export type FeeCategory = 'legal' | 'spv' | 'maintenance' | 'custom'

// Fee status (for deal-specific fees)
export type FeeStatus = 'pending' | 'invoiced' | 'paid' | 'waived'

// Predefined fee catalog item
export interface LegalFeeCatalogItem {
  id: string
  name: string
  description: string | null
  base_amount: number
  fee_type: FeeType
  category: FeeCategory
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Fee assigned to a specific deal
export interface DealLegalFee {
  id: string
  deal_id: string
  fee_catalog_id: string | null  // null for custom fees

  // Fee details
  name: string
  description: string | null
  amount: number
  fee_type: FeeType
  category: FeeCategory

  // For hourly fees
  hours: number | null
  hourly_rate: number | null

  // For percentage fees
  percentage_rate: number | null
  percentage_base: string | null

  // Status
  status: FeeStatus

  // Audit trail
  added_by: string | null
  added_at: string
  invoiced_at: string | null
  paid_at: string | null
  waived_at: string | null
  waived_reason: string | null

  notes: string | null
  created_at: string
  updated_at: string

  // Joined data
  catalog_item?: LegalFeeCatalogItem
  added_by_user?: {
    email: string
    full_name: string | null
  }
}

// Fee summary for a deal
export interface DealFeeSummary {
  total_amount: number
  pending_amount: number
  paid_amount: number
  fee_count: number
}

// ============================================
// LEGAL TERMS ACKNOWLEDGEMENT TYPES
// ============================================

// Type of terms document
export type TermsDocumentType =
  | 'platform_tos'           // Platform Terms of Service (signup)
  | 'originator_agreement'   // Originator Agreement (first offering)
  | 'offering_certification' // Offering Certification (each deal submission)
  | 'partner_network_agreement' // Partner Network Agreement (partner onboarding)
  | 'deal_confidentiality'   // Deal Confidentiality/NDA (express interest)

// Context in which terms were accepted
export type TermsContextType =
  | 'signup'              // Account creation (ToS)
  | 'first_offering'      // First offering submission (Originator Agreement)
  | 'offering_submission' // Each deal submission (Offering Certification)
  | 'partner_onboarding'  // Partner profile access (Partner Network Agreement)
  | 'deal_interest'       // Express interest in deal (Deal Confidentiality)

// Terms document record
export interface TermsDocument {
  id: string
  document_type: TermsDocumentType
  version: string
  effective_date: string
  title: string
  summary: string | null
  content: string
  is_active: boolean
  requires_scroll: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// User's acknowledgement of terms
export interface TermsAcknowledgement {
  id: string
  user_id: string
  terms_document_id: string
  context_type: TermsContextType
  context_entity_id: string | null
  acknowledged_at: string
  ip_address: string | null
  user_agent: string | null
  checkbox_confirmed: boolean
  scrolled_to_bottom: boolean
  created_at: string
  // Joined data
  terms_document?: TermsDocument
  user?: {
    email: string
    full_name: string | null
  }
}

// Request body for acknowledging terms
export interface AcknowledgeTermsRequest {
  document_type: TermsDocumentType
  context_type: TermsContextType
  context_entity_id?: string
  checkbox_confirmed: boolean
  scrolled_to_bottom: boolean
}

// Response from terms check API
export interface TermsCheckResponse {
  has_accepted: boolean
  terms_document?: TermsDocument
  acknowledgement?: TermsAcknowledgement
}

// Admin filters for acknowledgements list
export interface AcknowledgementsFilters {
  user_id?: string
  document_type?: TermsDocumentType
  context_type?: TermsContextType
  date_from?: string
  date_to?: string
  search?: string
}
