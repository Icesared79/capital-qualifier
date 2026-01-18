/**
 * AI Document Classifier
 * Uses Claude to analyze uploaded documents and determine:
 * - Document type/category
 * - Suggested checklist item match
 * - Key extracted information
 */

import Anthropic from '@anthropic-ai/sdk'

// Document categories matching the checklist
export type DocumentCategory =
  | 'financials'
  | 'loan_tape'
  | 'legal'
  | 'corporate'
  | 'due_diligence'
  | 'other'

// Specific document types within each category
export type DocumentType =
  // Financials
  | 'financial_statements'
  | 'bank_statements'
  | 'tax_returns'
  | 'profit_loss'
  | 'balance_sheet'
  // Loan Tape
  | 'loan_tape'
  | 'performance_history'
  | 'delinquency_report'
  | 'portfolio_summary'
  // Legal
  | 'loan_agreement'
  | 'term_sheet'
  | 'final_agreements'
  | 'servicing_agreement'
  // Corporate
  | 'formation_documents'
  | 'board_resolutions'
  | 'ownership_structure'
  | 'cap_table'
  // Due Diligence
  | 'insurance_certificate'
  | 'property_appraisal'
  | 'title_report'
  | 'environmental_assessment'
  | 'rent_roll'
  // Other
  | 'pitch_deck'
  | 'other'

export interface ClassificationResult {
  // Primary classification
  category: DocumentCategory
  documentType: DocumentType
  confidence: 'high' | 'medium' | 'low'

  // Suggested checklist match
  suggestedChecklistItem: string | null
  checklistMatchReason: string | null

  // Extracted information
  extractedInfo: {
    title?: string
    date?: string
    period?: string // e.g., "Q3 2024" or "2023 Annual"
    parties?: string[]
    amounts?: string[]
    keyTerms?: string[]
    assetType?: string
    propertyAddress?: string
  }

  // Quality assessment
  quality: {
    isComplete: boolean
    isReadable: boolean
    issues: string[]
  }

  // Brief summary
  summary: string
}

export interface ClassificationInput {
  fileName: string
  mimeType: string
  fileContent: string // base64 for images/PDFs, text for spreadsheets
  dealContext?: {
    assetType?: string
    fundingAmount?: string
    companyName?: string
  }
}

// Checklist items for matching
const CHECKLIST_ITEMS = [
  { id: 'financial_statements_3yr', name: 'Financial Statements (3 years)', category: 'financials', keywords: ['financial statement', 'income statement', 'balance sheet', 'audit', 'reviewed'] },
  { id: 'bank_statements_6mo', name: 'Bank Statements (6 months)', category: 'financials', keywords: ['bank statement', 'account statement', 'checking', 'savings'] },
  { id: 'loan_tape', name: 'Loan Tape / Portfolio Data', category: 'loan_tape', keywords: ['loan tape', 'portfolio', 'loan schedule', 'loan data'] },
  { id: 'performance_history', name: 'Performance History', category: 'loan_tape', keywords: ['performance', 'historical', 'delinquency', 'default rate'] },
  { id: 'final_agreements', name: 'Final Agreements', category: 'legal', keywords: ['agreement', 'contract', 'executed', 'signed'] },
  { id: 'loan_agreements_samples', name: 'Loan Agreements (samples)', category: 'legal', keywords: ['loan agreement', 'promissory note', 'credit agreement'] },
  { id: 'term_sheet_signed', name: 'Term Sheet (signed)', category: 'legal', keywords: ['term sheet', 'terms', 'proposed terms'] },
  { id: 'company_formation', name: 'Company Formation Documents', category: 'corporate', keywords: ['articles', 'incorporation', 'operating agreement', 'bylaws', 'certificate of formation'] },
  { id: 'board_resolutions', name: 'Board Resolutions', category: 'corporate', keywords: ['board resolution', 'unanimous consent', 'board minutes'] },
  { id: 'ownership_structure', name: 'Ownership Structure', category: 'corporate', keywords: ['cap table', 'ownership', 'shareholders', 'members', 'equity'] },
  { id: 'insurance_certificates', name: 'Insurance Certificates', category: 'due_diligence', keywords: ['insurance', 'certificate of insurance', 'COI', 'policy'] },
  { id: 'property_appraisals', name: 'Property Appraisals', category: 'due_diligence', keywords: ['appraisal', 'property value', 'market value', 'appraised'] },
  { id: 'title_reports', name: 'Title Reports', category: 'due_diligence', keywords: ['title', 'title report', 'title insurance', 'preliminary title'] },
  { id: 'environmental_assessments', name: 'Environmental Assessments', category: 'due_diligence', keywords: ['environmental', 'phase I', 'phase II', 'ESA', 'environmental site'] },
  { id: 'rent_rolls', name: 'Rent Rolls', category: 'due_diligence', keywords: ['rent roll', 'tenant', 'lease', 'rental income'] },
]

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured')
    return null
  }
  return new Anthropic({ apiKey })
}

export async function classifyDocument(input: ClassificationInput): Promise<ClassificationResult | null> {
  const client = getAnthropicClient()
  if (!client) {
    return null
  }

  const systemPrompt = `You are a document classification expert for a capital markets platform. Your job is to analyze uploaded documents and classify them accurately.

The platform deals with:
- Asset originators seeking capital (real estate, loans, receivables)
- Due diligence document packages for institutional investors
- Loan tapes and portfolio data

Document Categories:
- financials: Financial statements, bank statements, tax returns, P&L, balance sheets
- loan_tape: Loan tapes, portfolio data, performance history, delinquency reports
- legal: Loan agreements, term sheets, servicing agreements, final executed documents
- corporate: Formation documents, board resolutions, ownership/cap table
- due_diligence: Insurance, appraisals, title reports, environmental assessments, rent rolls
- other: Pitch decks, marketing materials, miscellaneous

Checklist Items to Match:
${CHECKLIST_ITEMS.map(item => `- ${item.id}: ${item.name} (${item.category})`).join('\n')}

Respond with valid JSON only. No markdown, no explanation outside the JSON.`

  const userPrompt = `Analyze this document and classify it.

Filename: ${input.fileName}
MIME Type: ${input.mimeType}
${input.dealContext ? `Deal Context: Asset Type: ${input.dealContext.assetType || 'Unknown'}, Company: ${input.dealContext.companyName || 'Unknown'}` : ''}

${input.mimeType.includes('image') || input.mimeType.includes('pdf')
  ? 'Document content is provided as an image/PDF attachment.'
  : `Document content preview:\n${input.fileContent.slice(0, 5000)}`
}

Respond with JSON in this exact format:
{
  "category": "financials|loan_tape|legal|corporate|due_diligence|other",
  "documentType": "specific type like financial_statements, loan_tape, term_sheet, etc.",
  "confidence": "high|medium|low",
  "suggestedChecklistItem": "checklist item id or null",
  "checklistMatchReason": "brief explanation of why this matches that checklist item",
  "extractedInfo": {
    "title": "document title if visible",
    "date": "document date if visible",
    "period": "time period covered if applicable",
    "parties": ["list of parties/companies mentioned"],
    "amounts": ["key financial amounts mentioned"],
    "keyTerms": ["important terms or metrics"],
    "assetType": "real estate, consumer loans, etc. if determinable",
    "propertyAddress": "property address if this is a property document"
  },
  "quality": {
    "isComplete": true/false,
    "isReadable": true/false,
    "issues": ["list any quality issues"]
  },
  "summary": "1-2 sentence description of what this document is and contains"
}`

  try {
    // Build the message content based on file type
    const messageContent: Anthropic.MessageCreateParams['messages'][0]['content'] = []

    if (input.mimeType.includes('image')) {
      // For images, send as vision input
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: input.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: input.fileContent,
        },
      })
      messageContent.push({
        type: 'text',
        text: userPrompt,
      })
    } else {
      // For text-based files, send as text
      messageContent.push({
        type: 'text',
        text: userPrompt,
      })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    })

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Parse JSON response
    const result = JSON.parse(textBlock.text) as ClassificationResult
    return result

  } catch (error) {
    console.error('Document classification error:', error)

    // Return a fallback classification based on filename/mimetype
    return fallbackClassification(input)
  }
}

function fallbackClassification(input: ClassificationInput): ClassificationResult {
  const fileName = input.fileName.toLowerCase()
  const mimeType = input.mimeType.toLowerCase()

  // Simple keyword-based fallback
  let category: DocumentCategory = 'other'
  let documentType: DocumentType = 'other'
  let suggestedChecklistItem: string | null = null

  if (fileName.includes('loan') && (fileName.includes('tape') || mimeType.includes('spreadsheet') || mimeType.includes('excel'))) {
    category = 'loan_tape'
    documentType = 'loan_tape'
    suggestedChecklistItem = 'loan_tape'
  } else if (fileName.includes('financial') || fileName.includes('statement') || fileName.includes('p&l') || fileName.includes('balance')) {
    category = 'financials'
    documentType = 'financial_statements'
    suggestedChecklistItem = 'financial_statements_3yr'
  } else if (fileName.includes('bank')) {
    category = 'financials'
    documentType = 'bank_statements'
    suggestedChecklistItem = 'bank_statements_6mo'
  } else if (fileName.includes('term') && fileName.includes('sheet')) {
    category = 'legal'
    documentType = 'term_sheet'
    suggestedChecklistItem = 'term_sheet_signed'
  } else if (fileName.includes('appraisal')) {
    category = 'due_diligence'
    documentType = 'property_appraisal'
    suggestedChecklistItem = 'property_appraisals'
  } else if (fileName.includes('title')) {
    category = 'due_diligence'
    documentType = 'title_report'
    suggestedChecklistItem = 'title_reports'
  } else if (fileName.includes('insurance') || fileName.includes('coi')) {
    category = 'due_diligence'
    documentType = 'insurance_certificate'
    suggestedChecklistItem = 'insurance_certificates'
  } else if (fileName.includes('rent') && fileName.includes('roll')) {
    category = 'due_diligence'
    documentType = 'rent_roll'
    suggestedChecklistItem = 'rent_rolls'
  } else if (fileName.includes('agreement') || fileName.includes('contract')) {
    category = 'legal'
    documentType = 'loan_agreement'
    suggestedChecklistItem = 'loan_agreements_samples'
  } else if (fileName.includes('incorporation') || fileName.includes('formation') || fileName.includes('operating')) {
    category = 'corporate'
    documentType = 'formation_documents'
    suggestedChecklistItem = 'company_formation'
  }

  return {
    category,
    documentType,
    confidence: 'low',
    suggestedChecklistItem,
    checklistMatchReason: 'Classified based on filename (AI classification unavailable)',
    extractedInfo: {},
    quality: {
      isComplete: true,
      isReadable: true,
      issues: ['AI classification unavailable - using filename-based classification'],
    },
    summary: `Document uploaded: ${input.fileName}`,
  }
}

/**
 * Batch classify multiple documents
 */
export async function classifyDocuments(inputs: ClassificationInput[]): Promise<(ClassificationResult | null)[]> {
  // Process in parallel with rate limiting
  const results: (ClassificationResult | null)[] = []

  for (const input of inputs) {
    const result = await classifyDocument(input)
    results.push(result)
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return results
}
