/**
 * Utility functions for formatting values consistently across the application
 */

// Funding amount range keys -> upper bound values for display
// We display the upper bound as the "target" amount for consistency
const FUNDING_AMOUNT_VALUES: Record<string, number> = {
  under_500k: 500_000,
  '500k_2m': 2_000_000,
  '2m_10m': 10_000_000,
  '10m_50m': 50_000_000,
  over_50m: 50_000_000, // Shows as "$50M+"
}

// Flag for ranges that should show "+" suffix
const OPEN_ENDED_RANGES = ['over_50m']

/**
 * Format a number as compact currency (shorthand: $10M, $500K, etc.)
 * This is the standard format for displaying dollar amounts
 */
function formatAsCompactCurrency(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (num >= 1_000) {
    return `$${Math.round(num / 1_000)}K`
  }
  return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/**
 * Format a capital/funding amount for display
 *
 * Handles:
 * - Numbers (10000000 -> "$10M")
 * - String numbers ("10000000" -> "$10M")
 * - Range keys ("500k_2m" -> "$2M", "over_50m" -> "$50M+")
 * - Already formatted strings ("$15M" -> pass through)
 * - null/undefined -> returns fallback
 *
 * @param amount The amount to format (number, string, or null)
 * @param fallback Value to return if amount is null/undefined (default: "Amount TBD")
 * @returns Formatted string for display (always compact format like $2M, $500K)
 */
export function formatCapitalAmount(
  amount: string | number | null | undefined,
  fallback: string = 'Amount TBD'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return fallback
  }

  // If it's a number, format it directly with compact notation
  if (typeof amount === 'number') {
    return formatAsCompactCurrency(amount)
  }

  // It's a string - check various cases
  const str = String(amount).trim()

  // Check if it matches a range key - convert to upper bound value
  if (FUNDING_AMOUNT_VALUES[str]) {
    const value = FUNDING_AMOUNT_VALUES[str]
    const formatted = formatAsCompactCurrency(value)
    // Add "+" suffix for open-ended ranges
    if (OPEN_ENDED_RANGES.includes(str)) {
      return formatted + '+'
    }
    return formatted
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
      return formatAsCompactCurrency(num)
    }
  }

  // Check if it looks like a range (e.g., "15000000 - 50000000" without $ signs)
  const rangeMatch = str.match(/^(\d[\d,]*)\s*-\s*(\d[\d,]*)$/)
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ''))
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''))
    if (!isNaN(low) && !isNaN(high)) {
      return `${formatAsCompactCurrency(low)} - ${formatAsCompactCurrency(high)}`
    }
  }

  // Return as-is if we can't parse it
  return str
}

/**
 * Format a number as compact currency (always use shorthand: $10M, $500K, etc.)
 * Alias for consistency with older code
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

  return formatAsCompactCurrency(value)
}

/**
 * Format a number as full currency with $ prefix and thousand separators
 * Use this only when you need the exact dollar amount (e.g., invoices)
 */
export function formatFullCurrency(num: number): string {
  return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
