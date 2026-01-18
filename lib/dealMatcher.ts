/**
 * Deal Matching Logic
 * Matches deals against partner preferences/criteria
 */

import { PartnerNotificationPreferences, DealMatchInfo, DealSummary } from './types'

/**
 * Parse currency string to number
 * Handles formats like "$1M", "$500K", "$2.5M", "1000000"
 */
export function parseCurrencyToNumber(currency: string | null | undefined): number | null {
  if (!currency) return null

  // Remove $ and any commas
  let cleaned = currency.replace(/[$,]/g, '').trim().toUpperCase()

  // Check for M (millions) or K (thousands) suffix
  let multiplier = 1

  if (cleaned.endsWith('M')) {
    multiplier = 1_000_000
    cleaned = cleaned.slice(0, -1)
  } else if (cleaned.endsWith('K')) {
    multiplier = 1_000
    cleaned = cleaned.slice(0, -1)
  } else if (cleaned.endsWith('B')) {
    multiplier = 1_000_000_000
    cleaned = cleaned.slice(0, -1)
  }

  const value = parseFloat(cleaned)
  if (isNaN(value)) return null

  return value * multiplier
}

/**
 * Format number as currency string
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  } else if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

interface DealForMatching {
  capital_amount?: string | number | null
  asset_classes?: string[] | null
  geographic_focus?: string | null
  overall_score?: number | null
  qualification_data?: {
    assetClass?: string[]
    geoFocus?: string
    location?: string
  } | null
}

/**
 * Check if a deal matches partner's criteria
 */
export function checkDealMatch(
  preferences: PartnerNotificationPreferences | null,
  deal: DealForMatching
): DealMatchInfo {
  const matchReasons: string[] = []
  const mismatches: string[] = []

  // If no preferences set, consider it a match (no filtering)
  if (!preferences) {
    return {
      matches: true,
      matchReasons: ['No preferences set - showing all deals'],
      mismatches: []
    }
  }

  // Check asset classes
  const dealAssetClasses = deal.asset_classes || deal.qualification_data?.assetClass || []
  const preferredAssetClasses = preferences.preferred_asset_classes || []

  if (preferredAssetClasses.length > 0 && dealAssetClasses.length > 0) {
    const matchingClasses = dealAssetClasses.filter(ac =>
      preferredAssetClasses.some(pac =>
        pac.toLowerCase() === ac.toLowerCase() ||
        pac.toLowerCase().includes(ac.toLowerCase()) ||
        ac.toLowerCase().includes(pac.toLowerCase())
      )
    )
    if (matchingClasses.length > 0) {
      matchReasons.push(`Asset class: ${matchingClasses.join(', ')}`)
    } else {
      mismatches.push(`Asset class mismatch`)
    }
  }

  // Check deal size
  const dealAmount = typeof deal.capital_amount === 'string'
    ? parseCurrencyToNumber(deal.capital_amount)
    : deal.capital_amount

  const minSize = parseCurrencyToNumber(preferences.min_deal_size)
  const maxSize = parseCurrencyToNumber(preferences.max_deal_size)

  if (dealAmount) {
    let sizeMatch = true

    if (minSize && dealAmount < minSize) {
      mismatches.push(`Below minimum deal size (${preferences.min_deal_size})`)
      sizeMatch = false
    }

    if (maxSize && dealAmount > maxSize) {
      mismatches.push(`Above maximum deal size (${preferences.max_deal_size})`)
      sizeMatch = false
    }

    if (sizeMatch && (minSize || maxSize)) {
      matchReasons.push(`Deal size: ${formatCurrency(dealAmount)}`)
    }
  }

  // Check geography
  const dealGeo = deal.geographic_focus || deal.qualification_data?.geoFocus || deal.qualification_data?.location || ''
  const preferredGeos = preferences.preferred_geographies || []

  if (preferredGeos.length > 0 && dealGeo) {
    const geoMatch = preferredGeos.some(pg =>
      dealGeo.toLowerCase().includes(pg.toLowerCase()) ||
      pg.toLowerCase().includes(dealGeo.toLowerCase()) ||
      pg.toLowerCase() === 'us' && /united states|usa|u\.s\./i.test(dealGeo)
    )
    if (geoMatch) {
      matchReasons.push(`Geography: ${dealGeo}`)
    } else {
      mismatches.push(`Geography mismatch`)
    }
  }

  // Check minimum score
  if (preferences.min_score && deal.overall_score !== null && deal.overall_score !== undefined) {
    if (deal.overall_score >= preferences.min_score) {
      matchReasons.push(`Score: ${deal.overall_score}`)
    } else {
      mismatches.push(`Below minimum score (${preferences.min_score})`)
    }
  }

  // Determine if it's an overall match
  // If there are any mismatches on "required" criteria (size, score), it's not a match
  // Asset class and geography mismatches are softer
  const hasCriticalMismatch = mismatches.some(m =>
    m.includes('minimum deal size') ||
    m.includes('maximum deal size') ||
    m.includes('minimum score')
  )

  return {
    matches: !hasCriticalMismatch && (matchReasons.length > 0 || mismatches.length === 0),
    matchReasons,
    mismatches
  }
}

/**
 * Filter deals that match partner's criteria
 */
export function filterMatchingDeals<T extends DealForMatching>(
  preferences: PartnerNotificationPreferences | null,
  deals: T[]
): T[] {
  if (!preferences) return deals

  return deals.filter(deal => {
    const matchInfo = checkDealMatch(preferences, deal)
    return matchInfo.matches
  })
}

/**
 * Sort deals by match quality (best matches first)
 */
export function sortDealsByMatchQuality<T extends DealForMatching>(
  preferences: PartnerNotificationPreferences | null,
  deals: T[]
): T[] {
  if (!preferences) return deals

  return [...deals].sort((a, b) => {
    const matchA = checkDealMatch(preferences, a)
    const matchB = checkDealMatch(preferences, b)

    // Matches first
    if (matchA.matches && !matchB.matches) return -1
    if (!matchA.matches && matchB.matches) return 1

    // More match reasons = better match
    return matchB.matchReasons.length - matchA.matchReasons.length
  })
}
