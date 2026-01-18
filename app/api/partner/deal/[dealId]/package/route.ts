import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'
import { parseCurrencyToNumber } from '@/lib/dealMatcher'
import { formatCapitalAmount } from '@/lib/formatters'

// GET: Generate and download deal package PDF
export async function GET(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()
    const { dealId } = params

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's role (partner slug)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get partner by slug (role)
    const { data: partner, error: partnerError } = await supabase
      .from('funding_partners')
      .select('id, name')
      .eq('slug', profile.role)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get the deal release to check access
    const { data: release, error: releaseError } = await supabase
      .from('deal_releases')
      .select('*')
      .eq('deal_id', dealId)
      .eq('partner_id', partner.id)
      .single()

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Deal release not found' },
        { status: 404 }
      )
    }

    // Check access level
    if (release.access_level === 'summary' && release.status === 'pending') {
      return NextResponse.json(
        { error: 'Express interest to access full deal package' },
        { status: 403 }
      )
    }

    // Get deal information
    const { data: deal, error: dealError } = await adminClient
      .from('deals')
      .select(`
        id,
        qualification_code,
        stage,
        capital_amount,
        overall_score,
        qualification_score,
        qualification_data,
        notes,
        companies!inner(
          id,
          name,
          qualification_data
        )
      `)
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Log the download
    await adminClient
      .from('partner_access_logs')
      .insert({
        partner_id: partner.id,
        deal_id: dealId,
        user_id: user.id,
        action: 'downloaded_package',
        details: {
          access_level: release.access_level
        }
      })

    // Generate PDF
    const pdf = generateDealPackagePDF(deal, partner.name, release.access_level)

    // Return PDF as response
    const pdfOutput = pdf.output('arraybuffer')

    return new Response(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="deal-package-${deal.qualification_code}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/partner/deal/[dealId]/package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateDealPackagePDF(deal: any, partnerName: string, accessLevel: string): jsPDF {
  const doc = new jsPDF()
  const companyData = deal.companies?.qualification_data || {}
  const dealData = deal.qualification_data || {}
  const notesData = typeof deal.notes === 'string' ? JSON.parse(deal.notes) : (deal.notes || {})

  let yPos = 20

  // Header
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Deal Package', 105, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Prepared for: ${partnerName}`, 105, yPos, { align: 'center' })
  yPos += 5
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' })
  yPos += 5
  doc.text(`Deal Code: ${deal.qualification_code}`, 105, yPos, { align: 'center' })
  yPos += 15

  // Divider
  doc.setDrawColor(200)
  doc.line(20, yPos, 190, yPos)
  yPos += 10

  // Company Information
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Company Overview', 20, yPos)
  yPos += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const companyInfo = [
    ['Company Name:', deal.companies?.name || 'N/A'],
    ['Location:', companyData.location || companyData.geographicFocus || 'N/A'],
    ['Year Founded:', companyData.yearFounded || 'N/A'],
    ['Team Size:', companyData.teamSize || 'N/A'],
    ['Business Type:', companyData.businessType || 'N/A'],
  ]

  for (const [label, value] of companyInfo) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 7
  }

  yPos += 10

  // Funding Request
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Funding Request', 20, yPos)
  yPos += 10

  doc.setFontSize(11)

  const capitalAmount = formatCapitalAmount(deal.capital_amount, 'N/A')

  const fundingInfo = [
    ['Capital Requested:', capitalAmount],
    ['Funding Purpose:', notesData.fundingPurpose || dealData.fundingPurpose || 'N/A'],
  ]

  for (const [label, value] of fundingInfo) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 7
  }

  yPos += 10

  // Qualification Score (if has access)
  if (accessLevel !== 'summary' || deal.overall_score) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Qualification Assessment', 20, yPos)
    yPos += 10

    doc.setFontSize(11)

    const scoreInfo = [
      ['Overall Score:', deal.overall_score ? `${deal.overall_score}/100` : 'N/A'],
      ['Qualification Tier:', deal.qualification_score || 'N/A'],
    ]

    for (const [label, value] of scoreInfo) {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value), 70, yPos)
      yPos += 7
    }

    // Strengths
    const strengths = notesData.strengths || []
    if (strengths.length > 0) {
      yPos += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Strengths:', 20, yPos)
      yPos += 7
      doc.setFont('helvetica', 'normal')
      for (const strength of strengths.slice(0, 5)) {
        doc.text(`• ${strength}`, 25, yPos)
        yPos += 6
      }
    }

    // Considerations
    const considerations = notesData.considerations || []
    if (considerations.length > 0) {
      yPos += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Considerations:', 20, yPos)
      yPos += 7
      doc.setFont('helvetica', 'normal')
      for (const consideration of considerations.slice(0, 5)) {
        doc.text(`• ${consideration}`, 25, yPos)
        yPos += 6
      }
    }
  }

  // New page for portfolio details if available
  if (accessLevel !== 'summary' && (companyData.annualVolume || companyData.portfolioSize)) {
    doc.addPage()
    yPos = 20

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Portfolio Details', 20, yPos)
    yPos += 10

    doc.setFontSize(11)

    const portfolioInfo = [
      ['Asset Classes:', (companyData.loanAssetClasses || companyData.assets || []).join(', ') || 'N/A'],
      ['Annual Volume:', companyData.annualVolume || 'N/A'],
      ['Portfolio Size:', companyData.portfolioSize || 'N/A'],
      ['Avg Deal Size:', companyData.avgDealSize || 'N/A'],
      ['Default Rate:', companyData.defaultRate || 'N/A'],
      ['Geographic Focus:', companyData.geographicFocus || 'N/A'],
    ]

    for (const [label, value] of portfolioInfo) {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')

      // Handle long values
      const maxWidth = 110
      const lines = doc.splitTextToSize(String(value), maxWidth)
      doc.text(lines, 70, yPos)
      yPos += 7 * lines.length
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      'This document is confidential and intended solely for the recipient.',
      105,
      285,
      { align: 'center' }
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
  }

  return doc
}
