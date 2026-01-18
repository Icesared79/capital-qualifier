/**
 * Utility functions for formatting values consistently across the application
 */

// Funding amount range labels (key -> display label)
export const FUNDING_AMOUNT_LABELS: Record<string, string> = {
  under_500k: 'Under $500K',
  '500k_2m': '$500K - $2M',
  '2m_10m': '$2M - $10M',
  '10m_50m': '$10M - $50M',
  over_50m: '$50M+',
}

/**
 * Format a capital/funding amount for display
 *
 * Handles:
 * - Numbers (10000000 -> "$10,000,000")
 * - String numbers ("10000000" -> "$10,000,000")
 * - Range keys ("10m_50m" -> "$10M - $50M")
 * - Already formatted strings ("$15,000,000 - $50,000,000" -> pass through)
 * - null/undefined -> returns fallback
 *
 * @param amount The amount to format (number, string, or null)
 * @param fallback Value to return if amount is null/undefined (default: "Amount TBD")
 * @returns Formatted string for display
 */
export function formatCapitalAmount(
  amount: string | number | null | undefined,
  fallback: string = 'Amount TBD'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return fallback
  }

  // If it's a number, format it directly
  if (typeof amount === 'number') {
    return formatNumberAsCurrency(amount)
  }

  // It's a string - check various cases
  const str = String(amount).trim()

  // Check if it matches a range key label
  if (FUNDING_AMOUNT_LABELS[str]) {
    return FUNDING_AMOUNT_LABELS[str]
  }

  // Check if it's already formatted (starts with $)
  if (str.startsWith('$')) {
    return str
  }

  // Check if it's a plain number string (possibly with commas)
  const cleanedNumber = str.replace(/,/g, '')
  if (/^\d+(\.\d+)?$/.test(cleanedNumber)) {
    const num = parseFloat(cleanedNumber)
    if (!isNaN(num)) {
      return formatNumberAsCurrency(num)
    }
  }

  // Check if it looks like a range (e.g., "15000000 - 50000000" without $ signs)
  const rangeMatch = str.match(/^(\d[\d,]*)\s*-\s*(\d[\d,]*)$/)
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ''))
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''))
    if (!isNaN(low) && !isNaN(high)) {
      return `${formatNumberAsCurrency(low)} - ${formatNumberAsCurrency(high)}`
    }
  }

  // Return as-is if we can't parse it
  return str
}

/**
 * Format a number as currency with $ prefix and thousand separators
 * For large numbers (>= 1M), optionally uses shorthand
 */
function formatNumberAsCurrency(num: number, useShorthand: boolean = false): string {
  if (useShorthand) {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(0)}K`
    }
  }

  return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/**
 * Format a number as compact currency (always use shorthand: $10M, $500K, etc.)
 */
export function formatCompactCurrency(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') {
    return '-'
  }

  let value: number
  if (typeof num === 'string') {
    // Try to parse
    const cleaned = num.replace(/[$,]/g, '')
    value = parseFloat(cleaned)
    if (isNaN(value)) {
      return num // Return as-is if can't parse
    }
  } else {
    value = num
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
