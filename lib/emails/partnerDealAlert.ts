import { Resend } from 'resend'
import { DealMatchInfo } from '@/lib/types'
import { formatCurrency, parseCurrencyToNumber } from '@/lib/dealMatcher'

const resend = new Resend(process.env.RESEND_API_KEY)

interface PartnerDealAlertParams {
  to: string
  partnerName: string
  dealName: string
  dealCode: string
  matchInfo: DealMatchInfo
  dealAmount?: string | number | null
  assetClasses?: string[]
  geography?: string
  score?: number | null
  dashboardUrl?: string
}

export async function sendPartnerDealAlert(params: PartnerDealAlertParams) {
  const {
    to,
    partnerName,
    dealName,
    dealCode,
    matchInfo,
    dealAmount,
    assetClasses = [],
    geography,
    score,
    dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bitcense.com'
  } = params

  const formattedAmount = dealAmount
    ? (typeof dealAmount === 'number'
      ? formatCurrency(dealAmount)
      : dealAmount)
    : 'N/A'

  const subject = matchInfo.matches
    ? `New Deal Matches Your Criteria - ${dealName}`
    : `New Deal Released - ${dealName}`

  const matchBadge = matchInfo.matches
    ? `<div style="background-color: #10B981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
        Matches Your Criteria
       </div>`
    : ''

  const matchReasons = matchInfo.matchReasons.length > 0
    ? `<div style="background-color: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">Why this deal matches:</p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #15803D;">
          ${matchInfo.matchReasons.map(r => `<li style="margin: 4px 0;">${r}</li>`).join('')}
        </ul>
       </div>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">New Deal Available</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
            Review opportunity on the partner portal
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          ${matchBadge}

          <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
            Hi ${partnerName},
          </p>

          <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.5;">
            A new deal has been released to your review queue:
          </p>

          <!-- Deal Card -->
          <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px; font-weight: 700;">
              ${dealName}
            </h2>
            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
              Deal Code: ${dealCode}
            </p>

            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #9CA3AF; font-size: 14px;">Capital:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 600;">${formattedAmount}</span>
              </div>

              ${score ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #9CA3AF; font-size: 14px;">Score:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 600;">${score}/100</span>
              </div>
              ` : ''}

              ${geography ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #9CA3AF; font-size: 14px;">Geography:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 600;">${geography}</span>
              </div>
              ` : ''}

              ${assetClasses.length > 0 ? `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #9CA3AF; font-size: 14px;">Asset Classes:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 600;">${assetClasses.slice(0, 3).join(', ')}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${matchReasons}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}/dashboard/optma"
               style="display: inline-block; background-color: #6366F1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              View Deal on Dashboard
            </a>
          </div>

          <p style="margin: 24px 0 0 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
            Express interest to unlock the full deal package, or pass if it's not a fit.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
            You're receiving this because you have deal alerts enabled.
          </p>
          <a href="${dashboardUrl}/dashboard/optma/settings"
             style="color: #6366F1; font-size: 14px; text-decoration: none;">
            Manage notification preferences
          </a>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
New Deal Available - ${dealName}

Hi ${partnerName},

A new deal has been released to your review queue:

Company: ${dealName}
Deal Code: ${dealCode}
Capital Requested: ${formattedAmount}
${score ? `Qualification Score: ${score}/100` : ''}
${geography ? `Geography: ${geography}` : ''}
${assetClasses.length > 0 ? `Asset Classes: ${assetClasses.join(', ')}` : ''}

${matchInfo.matches ? `This deal matches your criteria: ${matchInfo.matchReasons.join(', ')}` : ''}

View the deal on your dashboard: ${dashboardUrl}/dashboard/optma

---
You're receiving this because you have deal alerts enabled.
Manage preferences: ${dashboardUrl}/dashboard/optma/settings
  `.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'BitCense <noreply@bitcense.com>',
      to: [to],
      subject,
      html,
      text
    })

    if (error) {
      console.error('Error sending partner deal alert email:', error)
      return { success: false, error }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error('Exception sending partner deal alert email:', err)
    return { success: false, error: err }
  }
}

export async function sendDailyDigest(
  to: string,
  partnerName: string,
  deals: Array<{
    dealName: string
    dealCode: string
    dealAmount?: string | number | null
    matches: boolean
    matchReasons: string[]
  }>,
  dashboardUrl?: string
) {
  const appUrl = dashboardUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://app.bitcense.com'

  const matchingDeals = deals.filter(d => d.matches)
  const otherDeals = deals.filter(d => !d.matches)

  const subject = `Daily Deal Digest: ${deals.length} New Deal${deals.length !== 1 ? 's' : ''}`

  const formatDealRow = (deal: typeof deals[0]) => {
    const amount = deal.dealAmount
      ? (typeof deal.dealAmount === 'number'
        ? formatCurrency(deal.dealAmount)
        : deal.dealAmount)
      : 'N/A'

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
          <div style="font-weight: 600; color: #111827;">${deal.dealName}</div>
          <div style="font-size: 12px; color: #6B7280;">${deal.dealCode}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">
          <span style="font-weight: 600; color: #111827;">${amount}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">
          ${deal.matches
            ? '<span style="background-color: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Match</span>'
            : '<span style="color: #9CA3AF; font-size: 12px;">-</span>'}
        </td>
      </tr>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden;">

        <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px;">Daily Deal Digest</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">
            ${deals.length} new deal${deals.length !== 1 ? 's' : ''} for your review
          </p>
        </div>

        <div style="padding: 24px;">
          ${matchingDeals.length > 0 ? `
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">
              Matching Your Criteria (${matchingDeals.length})
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 12px; text-align: left; color: #6B7280; font-size: 12px; text-transform: uppercase;">Company</th>
                  <th style="padding: 12px; text-align: right; color: #6B7280; font-size: 12px; text-transform: uppercase;">Amount</th>
                  <th style="padding: 12px; text-align: center; color: #6B7280; font-size: 12px; text-transform: uppercase;">Match</th>
                </tr>
              </thead>
              <tbody>
                ${matchingDeals.map(formatDealRow).join('')}
              </tbody>
            </table>
          ` : ''}

          ${otherDeals.length > 0 ? `
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">
              Other Deals (${otherDeals.length})
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 12px; text-align: left; color: #6B7280; font-size: 12px; text-transform: uppercase;">Company</th>
                  <th style="padding: 12px; text-align: right; color: #6B7280; font-size: 12px; text-transform: uppercase;">Amount</th>
                  <th style="padding: 12px; text-align: center; color: #6B7280; font-size: 12px; text-transform: uppercase;">Match</th>
                </tr>
              </thead>
              <tbody>
                ${otherDeals.map(formatDealRow).join('')}
              </tbody>
            </table>
          ` : ''}

          <div style="text-align: center; margin-top: 32px;">
            <a href="${appUrl}/dashboard/optma"
               style="display: inline-block; background-color: #6366F1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
              View All Deals
            </a>
          </div>
        </div>

        <div style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <a href="${appUrl}/dashboard/optma/settings" style="color: #6366F1; font-size: 14px; text-decoration: none;">
            Manage notification preferences
          </a>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'BitCense <noreply@bitcense.com>',
      to: [to],
      subject,
      html
    })

    if (error) {
      console.error('Error sending daily digest email:', error)
      return { success: false, error }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error('Exception sending daily digest email:', err)
    return { success: false, error: err }
  }
}
