'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { jsPDF } from 'jspdf'

interface Company {
  id: string
  name: string
  type: string
  qualification_data: any
  qualification_score: string | null
  overall_score: number | null
  capital_fits: any[] | null
  recommended_structure: string | null
  opportunity_size: string | null
  time_to_funding: string | null
  strengths: string[] | null
  considerations: string[] | null
  next_steps: string[] | null
}

interface Deal {
  id: string
  qualification_code: string
  stage: string
  created_at: string
}

interface Document {
  id: string
  name: string
  category: string
  status: string
  created_at: string
}

const capitalTypeLabels: Record<string, string> = {
  warehouse_line: 'Warehouse Line',
  forward_flow: 'Forward Flow Agreement',
  whole_loan_sale: 'Whole Loan Sale',
  securitization: 'Securitization (ABS)',
  credit_facility: 'Credit Facility',
  equity_partnership: 'Equity Partnership',
  mezzanine: 'Mezzanine Financing',
}

const opportunitySizeLabels: Record<string, string> = {
  institutional: 'Institutional Scale',
  mid_market: 'Mid-Market',
  emerging: 'Emerging Platform',
  early_stage: 'Early Stage',
}

const timeToFundingLabels: Record<string, string> = {
  fast_track: 'Fast Track (30-60 days)',
  standard: 'Standard (60-90 days)',
  extended: 'Extended (90-120 days)',
  needs_preparation: 'Needs Preparation (120+ days)',
}

export default function DealPackagePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) setProfile(profileData)

    // Get company with deals
    const { data: companies } = await supabase
      .from('companies')
      .select(`
        *,
        deals (*)
      `)
      .eq('owner_id', user.id)
      .limit(1)

    if (companies && companies.length > 0) {
      setCompany(companies[0])

      if (companies[0].deals && companies[0].deals.length > 0) {
        const dealData = companies[0].deals[0]
        setDeal(dealData)

        // Get documents
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('deal_id', dealData.id)

        if (docs) setDocuments(docs)
      }
    }

    setLoading(false)
  }

  const generatePDF = async () => {
    if (!company || !deal) return

    setGenerating(true)

    const doc = new jsPDF()
    const qData = company.qualification_data || {}
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let y = margin

    // Helper functions
    const addTitle = (text: string, size: number = 18) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(text, margin, y)
      y += size / 2 + 4
    }

    const addSubtitle = (text: string) => {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text(text, margin, y)
      y += 8
    }

    const addText = (text: string, indent: number = 0) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      const lines = doc.splitTextToSize(text, contentWidth - indent)
      doc.text(lines, margin + indent, y)
      y += lines.length * 5 + 2
    }

    const addField = (label: string, value: string, indent: number = 0) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text(label + ':', margin + indent, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      doc.text(value || 'N/A', margin + 60 + indent, y)
      y += 7
    }

    const addSection = (title: string) => {
      if (y > 250) {
        doc.addPage()
        y = margin
      }
      y += 6
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10
      addSubtitle(title)
    }

    const checkNewPage = (requiredSpace: number = 40) => {
      if (y > 280 - requiredSpace) {
        doc.addPage()
        y = margin
      }
    }

    // === HEADER ===
    doc.setFillColor(15, 23, 42) // Dark blue header
    doc.rect(0, 0, pageWidth, 45, 'F')

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DEAL PACKAGE', margin, 22)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Prepared for Optima Financial by BitCense Capital`, margin, 32)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 39)

    // Qualification code on right
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(deal.qualification_code, pageWidth - margin - 50, 30)

    y = 60

    // === EXECUTIVE SUMMARY ===
    addTitle('Executive Summary')

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F')
    y += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(company.name || 'Company Name', margin + 8, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    const companyTypeLabel = company.type === 'originator' ? 'Loan Originator' : 'Borrower'
    doc.text(`${companyTypeLabel} | ${qData.headquarters || 'Location N/A'} | Founded ${qData.yearFounded || 'N/A'}`, margin + 8, y)
    y += 7

    if (qData.description) {
      const descLines = doc.splitTextToSize(qData.description, contentWidth - 16)
      doc.text(descLines.slice(0, 2), margin + 8, y)
      y += Math.min(descLines.length, 2) * 5
    }

    y += 18

    // Score box
    if (company.overall_score) {
      doc.setFillColor(16, 185, 129) // Green
      doc.roundedRect(margin, y, 70, 35, 3, 3, 'F')

      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`${company.overall_score}%`, margin + 10, y + 22)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Qualification Score', margin + 10, y + 30)

      // Recommended structure
      if (company.recommended_structure) {
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(margin + 80, y, contentWidth - 80, 35, 3, 3, 'F')

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 41, 59)
        doc.text('Recommended Capital Structure', margin + 88, y + 12)

        doc.setFontSize(12)
        doc.setTextColor(16, 185, 129)
        doc.text(capitalTypeLabels[company.recommended_structure] || company.recommended_structure, margin + 88, y + 24)
      }

      y += 45
    }

    // === COMPANY OVERVIEW ===
    addSection('Company Overview')

    addField('Company Name', company.name)
    addField('Company Type', companyTypeLabel)
    addField('Headquarters', qData.headquarters)
    addField('Year Founded', qData.yearFounded)
    addField('Team Size', qData.teamSize)
    addField('Website', qData.website)

    // === CONTACT INFORMATION ===
    addSection('Primary Contact')

    addField('Contact Name', qData.primaryContact)
    addField('Email', qData.primaryEmail)
    addField('Phone', qData.primaryPhone)

    // === FINANCIAL OVERVIEW ===
    checkNewPage(60)
    addSection('Financial Overview')

    addField('Assets Under Management', qData.assetsUnderManagement)
    addField('Annual Revenue/Volume', qData.annualRevenue)

    if (qData.currentFundingSources) {
      y += 3
      addText('Current Funding Sources:', 0)
      addText(qData.currentFundingSources, 5)
    }

    // === CAPITAL ANALYSIS ===
    if (company.capital_fits && company.capital_fits.length > 0) {
      checkNewPage(80)
      addSection('Capital Fit Analysis')

      if (company.opportunity_size) {
        addField('Opportunity Size', opportunitySizeLabels[company.opportunity_size] || company.opportunity_size)
      }
      if (company.time_to_funding) {
        addField('Expected Timeline', timeToFundingLabels[company.time_to_funding] || company.time_to_funding)
      }

      y += 5
      addText('Capital Options:')
      y += 3

      company.capital_fits
        .filter((cf: any) => cf.fit === 'excellent' || cf.fit === 'good')
        .slice(0, 4)
        .forEach((cf: any) => {
          checkNewPage(20)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 41, 59)
          const fitColor = cf.fit === 'excellent' ? '(Excellent Fit)' : '(Good Fit)'
          doc.text(`• ${cf.name} ${fitColor}`, margin + 5, y)
          y += 5
          if (cf.description) {
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(71, 85, 105)
            const descLines = doc.splitTextToSize(cf.description, contentWidth - 15)
            doc.text(descLines.slice(0, 2), margin + 10, y)
            y += Math.min(descLines.length, 2) * 5 + 3
          }
        })
    }

    // === STRENGTHS ===
    if (company.strengths && company.strengths.length > 0) {
      checkNewPage(50)
      addSection('Key Strengths')

      company.strengths.forEach((strength) => {
        checkNewPage(15)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        const lines = doc.splitTextToSize(`• ${strength}`, contentWidth - 10)
        doc.text(lines, margin + 5, y)
        y += lines.length * 5 + 2
      })
    }

    // === CONSIDERATIONS ===
    if (company.considerations && company.considerations.length > 0) {
      checkNewPage(50)
      addSection('Considerations')

      company.considerations.forEach((consideration) => {
        checkNewPage(15)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        const lines = doc.splitTextToSize(`• ${consideration}`, contentWidth - 10)
        doc.text(lines, margin + 5, y)
        y += lines.length * 5 + 2
      })
    }

    // === DOCUMENT CHECKLIST ===
    checkNewPage(60)
    addSection('Document Checklist')

    const categories = ['financials', 'loan_tape', 'legal', 'corporate', 'due_diligence', 'other']
    const categoryLabels: Record<string, string> = {
      financials: 'Financial Statements',
      loan_tape: 'Loan Tape / Portfolio',
      legal: 'Legal Documents',
      corporate: 'Corporate Documents',
      due_diligence: 'Due Diligence',
      other: 'Other',
    }

    categories.forEach((cat) => {
      const catDocs = documents.filter(d => d.category === cat)
      const hasApproved = catDocs.some(d => d.status === 'approved')
      const hasPending = catDocs.some(d => d.status === 'pending')

      checkNewPage(15)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      if (hasApproved) {
        doc.setTextColor(16, 185, 129) // Green
        doc.text('✓', margin + 5, y)
      } else if (hasPending) {
        doc.setTextColor(245, 158, 11) // Yellow
        doc.text('○', margin + 5, y)
      } else {
        doc.setTextColor(156, 163, 175) // Gray
        doc.text('○', margin + 5, y)
      }

      doc.setTextColor(30, 41, 59)
      doc.text(`${categoryLabels[cat]}`, margin + 15, y)

      doc.setTextColor(156, 163, 175)
      doc.text(`${catDocs.length} file${catDocs.length !== 1 ? 's' : ''}`, margin + 100, y)

      y += 8
    })

    // === FOOTER ON EACH PAGE ===
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(156, 163, 175)
      doc.text(
        `Confidential - Prepared by BitCense Capital | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        290,
        { align: 'center' }
      )
    }

    // Save
    doc.save(`${company.name?.replace(/[^a-z0-9]/gi, '_') || 'deal'}_package_${deal.qualification_code}.pdf`)

    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!company || !company.qualification_score) {
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
              <h1 className="text-xl font-semibold text-gray-900">Deal Package</h1>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Complete Qualification First</h2>
            <p className="text-gray-500 mb-6">
              Please complete your qualification assessment before generating a deal package.
            </p>
            <Link href="/originator">
              <Button>Start Qualification</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-xl font-semibold text-gray-900">Deal Package</h1>
                <p className="text-sm text-gray-500">Generate a complete deal package for Optima</p>
              </div>
            </div>
            <Button onClick={generatePDF} disabled={generating}>
              {generating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Preview Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden mb-6">
          {/* Preview Header */}
          <div className="bg-slate-900 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">DEAL PACKAGE</h2>
                <p className="text-sm text-slate-400">Prepared for Optima Financial by BitCense Capital</p>
              </div>
              {deal && (
                <div className="text-right">
                  <span className="font-mono font-semibold">{deal.qualification_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-6">
            {/* Company Summary */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                <p className="text-sm text-gray-500">
                  {company.type === 'originator' ? 'Loan Originator' : 'Borrower'} | {company.qualification_data?.headquarters || 'Location N/A'}
                </p>
              </div>
              {company.overall_score && (
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-center">
                  <div className="text-2xl font-bold">{company.overall_score}%</div>
                  <div className="text-xs">Qualification Score</div>
                </div>
              )}
            </div>

            {/* Capital Recommendation */}
            {company.recommended_structure && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Recommended Capital Structure</p>
                <p className="text-lg font-semibold text-green-600">
                  {capitalTypeLabels[company.recommended_structure] || company.recommended_structure}
                </p>
              </div>
            )}

            {/* Strengths */}
            {company.strengths && company.strengths.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Strengths</h4>
                <ul className="space-y-2">
                  {company.strengths.slice(0, 4).map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Document Status */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Document Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {['financials', 'loan_tape', 'legal', 'corporate', 'due_diligence'].map((cat) => {
                  const catDocs = documents.filter(d => d.category === cat)
                  const hasApproved = catDocs.some(d => d.status === 'approved')
                  const hasPending = catDocs.some(d => d.status === 'pending')
                  const labels: Record<string, string> = {
                    financials: 'Financials',
                    loan_tape: 'Loan Tape',
                    legal: 'Legal',
                    corporate: 'Corporate',
                    due_diligence: 'Due Diligence',
                  }

                  return (
                    <div key={cat} className="flex items-center gap-2 text-sm">
                      {hasApproved ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : hasPending ? (
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={hasApproved ? 'text-gray-900' : 'text-gray-500'}>{labels[cat]}</span>
                      <span className="text-gray-400">({catDocs.length})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">About Deal Packages</p>
              <p className="mt-1">
                This PDF contains your company overview, qualification score, capital fit analysis,
                and document checklist. Share it with Optima Financial or other capital partners.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
          <div className="flex gap-3">
            <Link href="/dashboard/documents">
              <Button variant="secondary">Upload Documents</Button>
            </Link>
            <Button onClick={generatePDF} disabled={generating}>
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
