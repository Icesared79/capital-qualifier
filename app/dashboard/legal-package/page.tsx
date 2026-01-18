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
  file_size: number
}

const requiredLegalDocuments = [
  { key: 'articles', label: 'Articles of Incorporation/Organization', category: 'corporate' },
  { key: 'bylaws', label: 'Bylaws/Operating Agreement', category: 'corporate' },
  { key: 'cap_table', label: 'Cap Table / Ownership Structure', category: 'corporate' },
  { key: 'board_resolutions', label: 'Board Resolutions (if applicable)', category: 'corporate' },
  { key: 'good_standing', label: 'Certificate of Good Standing', category: 'legal' },
  { key: 'licenses', label: 'Business Licenses & Permits', category: 'legal' },
  { key: 'compliance', label: 'Compliance Certifications', category: 'legal' },
  { key: 'loan_agreements', label: 'Sample Loan Agreements', category: 'legal' },
  { key: 'financials_audited', label: 'Audited Financial Statements', category: 'financials' },
  { key: 'tax_returns', label: 'Tax Returns (3 years)', category: 'financials' },
  { key: 'loan_tape', label: 'Loan Tape / Asset Schedule', category: 'loan_tape' },
  { key: 'servicing_agreement', label: 'Servicing Agreement (if applicable)', category: 'legal' },
]

export default function LegalPackagePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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

  const getDocumentStatus = (category: string) => {
    const catDocs = documents.filter(d => d.category === category)
    if (catDocs.length === 0) return 'missing'
    if (catDocs.some(d => d.status === 'approved')) return 'approved'
    if (catDocs.some(d => d.status === 'pending')) return 'pending'
    return 'missing'
  }

  const getCategoryDocCount = (category: string) => {
    return documents.filter(d => d.category === category).length
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

    const addText = (text: string) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      const lines = doc.splitTextToSize(text, contentWidth)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 2
    }

    const addField = (label: string, value: string) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text(label + ':', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      doc.text(value || 'N/A', margin + 70, y)
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
    doc.setFillColor(30, 58, 138) // Dark blue header
    doc.rect(0, 0, pageWidth, 45, 'F')

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('LEGAL PACKAGE', margin, 22)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Securities Documentation for Tokenization', margin, 32)
    doc.text(`Prepared: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 39)

    // Reference code on right
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(deal.qualification_code, pageWidth - margin - 50, 30)

    y = 60

    // === ISSUER INFORMATION ===
    addTitle('Issuer Information')

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F')
    y += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(company.name || 'Company Name', margin + 8, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(`Reference: ${deal.qualification_code}`, margin + 8, y)
    y += 7
    doc.text(`Entity Type: ${qData.companyType === 'originator' ? 'Loan Originator' : 'Operating Company'}`, margin + 8, y)

    y += 20

    // === ENTITY DETAILS ===
    addSection('Entity Details')

    addField('Legal Name', company.name)
    addField('Entity Type', qData.companyType === 'originator' ? 'Loan Originator / Lender' : 'Borrower / Business')
    addField('State of Formation', qData.headquarters?.split(',')[1]?.trim() || 'N/A')
    addField('Year Founded', qData.yearFounded)
    addField('Principal Address', qData.headquarters)
    addField('Website', qData.website)

    // === MANAGEMENT & CONTACT ===
    addSection('Management & Contact')

    addField('Primary Contact', qData.primaryContact)
    addField('Title', 'Principal / Managing Member')
    addField('Email', qData.primaryEmail)
    addField('Phone', qData.primaryPhone)

    // === BUSINESS OVERVIEW ===
    checkNewPage(60)
    addSection('Business Overview')

    if (qData.description) {
      addText(qData.description)
    }

    y += 5
    addField('Team Size', qData.teamSize)
    addField('AUM / Portfolio Size', qData.assetsUnderManagement)
    addField('Annual Volume', qData.annualRevenue)

    // === CAPITAL STRUCTURE ===
    if (company.recommended_structure || company.capital_fits) {
      checkNewPage(60)
      addSection('Proposed Capital Structure')

      if (company.recommended_structure) {
        const structureLabels: Record<string, string> = {
          warehouse_line: 'Warehouse Line Facility',
          forward_flow: 'Forward Flow Agreement',
          whole_loan_sale: 'Whole Loan Sale Program',
          securitization: 'Asset-Backed Securitization',
          credit_facility: 'Credit Facility',
          equity_partnership: 'Equity Partnership',
          mezzanine: 'Mezzanine Financing',
        }
        addField('Recommended Structure', structureLabels[company.recommended_structure] || company.recommended_structure)
      }

      if (company.capital_fits) {
        const excellentFits = company.capital_fits.filter((cf: any) => cf.fit === 'excellent')
        if (excellentFits.length > 0) {
          y += 5
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(71, 85, 105)
          doc.text('Alternative Structures:', margin, y)
          y += 6

          excellentFits.forEach((cf: any) => {
            doc.setFont('helvetica', 'normal')
            doc.text(`• ${cf.name}`, margin + 5, y)
            y += 5
          })
        }
      }

      if (company.overall_score) {
        y += 5
        addField('Qualification Score', `${company.overall_score}%`)
      }
    }

    // === DOCUMENT CHECKLIST ===
    checkNewPage(100)
    addSection('Document Checklist for Tokenization')

    y += 3
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(107, 114, 128)
    doc.text('The following documents are required for securities counsel review:', margin, y)
    y += 10

    // Corporate Documents
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Corporate Documents', margin, y)
    y += 8

    requiredLegalDocuments
      .filter(d => d.category === 'corporate')
      .forEach((reqDoc) => {
        const status = getDocumentStatus(reqDoc.category)
        checkNewPage(10)

        doc.setFontSize(10)
        if (status === 'approved') {
          doc.setTextColor(16, 185, 129)
          doc.text('✓', margin + 5, y)
        } else if (status === 'pending') {
          doc.setTextColor(245, 158, 11)
          doc.text('○', margin + 5, y)
        } else {
          doc.setTextColor(239, 68, 68)
          doc.text('□', margin + 5, y)
        }

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        doc.text(reqDoc.label, margin + 15, y)
        y += 6
      })

    y += 5

    // Legal Documents
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Legal & Compliance', margin, y)
    y += 8

    requiredLegalDocuments
      .filter(d => d.category === 'legal')
      .forEach((reqDoc) => {
        const status = getDocumentStatus(reqDoc.category)
        checkNewPage(10)

        doc.setFontSize(10)
        if (status === 'approved') {
          doc.setTextColor(16, 185, 129)
          doc.text('✓', margin + 5, y)
        } else if (status === 'pending') {
          doc.setTextColor(245, 158, 11)
          doc.text('○', margin + 5, y)
        } else {
          doc.setTextColor(239, 68, 68)
          doc.text('□', margin + 5, y)
        }

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        doc.text(reqDoc.label, margin + 15, y)
        y += 6
      })

    y += 5

    // Financial Documents
    checkNewPage(40)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Financial Documents', margin, y)
    y += 8

    requiredLegalDocuments
      .filter(d => d.category === 'financials' || d.category === 'loan_tape')
      .forEach((reqDoc) => {
        const status = getDocumentStatus(reqDoc.category)

        doc.setFontSize(10)
        if (status === 'approved') {
          doc.setTextColor(16, 185, 129)
          doc.text('✓', margin + 5, y)
        } else if (status === 'pending') {
          doc.setTextColor(245, 158, 11)
          doc.text('○', margin + 5, y)
        } else {
          doc.setTextColor(239, 68, 68)
          doc.text('□', margin + 5, y)
        }

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        doc.text(reqDoc.label, margin + 15, y)
        y += 6
      })

    // === TOKENIZATION NOTES ===
    checkNewPage(60)
    addSection('Tokenization Considerations')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)

    const notes = [
      'This package contains preliminary information for securities counsel review.',
      'Additional documentation may be required based on the specific tokenization structure.',
      'All financial statements should be prepared in accordance with GAAP.',
      'Compliance certifications must be current and valid.',
      'Loan tape should include individual asset-level detail for proper collateralization.',
    ]

    notes.forEach((note) => {
      checkNewPage(15)
      const lines = doc.splitTextToSize(`• ${note}`, contentWidth - 10)
      doc.text(lines, margin + 5, y)
      y += lines.length * 5 + 3
    })

    // === FOOTER ON EACH PAGE ===
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(156, 163, 175)
      doc.text(
        `Confidential - Legal Package for Securities Counsel | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        290,
        { align: 'center' }
      )
    }

    // Save
    doc.save(`${company.name?.replace(/[^a-z0-9]/gi, '_') || 'legal'}_package_${deal.qualification_code}.pdf`)

    setGenerating(false)
  }

  const totalDocs = documents.length
  const completionPct = Math.round((totalDocs / requiredLegalDocuments.length) * 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!company) {
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
              <h1 className="text-xl font-semibold text-gray-900">Legal Package</h1>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Profile First</h2>
            <p className="text-gray-500 mb-6">
              Please set up your company profile before generating a legal package.
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
                <h1 className="text-xl font-semibold text-gray-900">Legal Package</h1>
                <p className="text-sm text-gray-500">Documentation for securities counsel</p>
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
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">About Legal Packages</p>
              <p className="mt-1">
                This package is designed for your securities attorney to review for tokenization.
                It includes company information, proposed capital structure, and a document checklist.
              </p>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden mb-6">
          {/* Preview Header */}
          <div className="bg-blue-900 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">LEGAL PACKAGE</h2>
                <p className="text-sm text-blue-300">Securities Documentation for Tokenization</p>
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
            {/* Issuer Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
              <p className="text-sm text-gray-500">
                {company.type === 'originator' ? 'Loan Originator' : 'Operating Company'} | {company.qualification_data?.headquarters || 'N/A'}
              </p>
            </div>

            {/* Document Completion */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Document Completion</span>
                <span className="text-sm font-semibold text-gray-900">{totalDocs} of {requiredLegalDocuments.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(completionPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Required Documents */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Required Documents</h4>

              {/* Corporate */}
              <div className="mb-4">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Corporate Documents</h5>
                <div className="space-y-2">
                  {requiredLegalDocuments.filter(d => d.category === 'corporate').map((reqDoc) => {
                    const status = getDocumentStatus(reqDoc.category)
                    return (
                      <div key={reqDoc.key} className="flex items-center gap-2 text-sm">
                        {status === 'approved' ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : status === 'pending' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-gray-300" />
                        )}
                        <span className={status === 'approved' ? 'text-gray-900' : 'text-gray-500'}>{reqDoc.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Legal */}
              <div className="mb-4">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal & Compliance</h5>
                <div className="space-y-2">
                  {requiredLegalDocuments.filter(d => d.category === 'legal').map((reqDoc) => {
                    const status = getDocumentStatus(reqDoc.category)
                    return (
                      <div key={reqDoc.key} className="flex items-center gap-2 text-sm">
                        {status === 'approved' ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : status === 'pending' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-gray-300" />
                        )}
                        <span className={status === 'approved' ? 'text-gray-900' : 'text-gray-500'}>{reqDoc.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Financial */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Financial Documents</h5>
                <div className="space-y-2">
                  {requiredLegalDocuments.filter(d => d.category === 'financials' || d.category === 'loan_tape').map((reqDoc) => {
                    const status = getDocumentStatus(reqDoc.category)
                    return (
                      <div key={reqDoc.key} className="flex items-center gap-2 text-sm">
                        {status === 'approved' ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : status === 'pending' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-gray-300" />
                        )}
                        <span className={status === 'approved' ? 'text-gray-900' : 'text-gray-500'}>{reqDoc.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
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
