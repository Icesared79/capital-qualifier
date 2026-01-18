import * as XLSX from 'xlsx'
import { LoanTapeRow, PerformanceHistoryRow } from './types'

// Column name mappings (handle variations in loan tape headers)
const LOAN_TAPE_COLUMN_MAP: Record<string, keyof LoanTapeRow> = {
  'loan id': 'loanId',
  'loan_id': 'loanId',
  'loanid': 'loanId',
  'borrower name': 'borrowerName',
  'borrower_name': 'borrowerName',
  'borrowername': 'borrowerName',
  'original balance': 'originalBalance',
  'original_balance': 'originalBalance',
  'originalbalance': 'originalBalance',
  'orig balance': 'originalBalance',
  'current balance': 'currentBalance',
  'current_balance': 'currentBalance',
  'currentbalance': 'currentBalance',
  'curr balance': 'currentBalance',
  'interest rate': 'interestRate',
  'interest_rate': 'interestRate',
  'interestrate': 'interestRate',
  'rate': 'interestRate',
  'coupon': 'interestRate',
  'origination date': 'originationDate',
  'origination_date': 'originationDate',
  'originationdate': 'originationDate',
  'orig date': 'originationDate',
  'maturity date': 'maturityDate',
  'maturity_date': 'maturityDate',
  'maturitydate': 'maturityDate',
  'term months': 'termMonths',
  'term_months': 'termMonths',
  'termmonths': 'termMonths',
  'term': 'termMonths',
  'payment status': 'paymentStatus',
  'payment_status': 'paymentStatus',
  'paymentstatus': 'paymentStatus',
  'status': 'paymentStatus',
  'property type': 'propertyType',
  'property_type': 'propertyType',
  'propertytype': 'propertyType',
  'asset type': 'propertyType',
  'property state': 'propertyState',
  'property_state': 'propertyState',
  'propertystate': 'propertyState',
  'state': 'propertyState',
  'property city': 'propertyCity',
  'property_city': 'propertyCity',
  'propertycity': 'propertyCity',
  'city': 'propertyCity',
  'property value': 'propertyValue',
  'property_value': 'propertyValue',
  'propertyvalue': 'propertyValue',
  'original ltv': 'originalLtv',
  'original_ltv': 'originalLtv',
  'originalltv': 'originalLtv',
  'ltv at origination': 'originalLtv',
  'current ltv': 'currentLtv',
  'current_ltv': 'currentLtv',
  'currentltv': 'currentLtv',
  'ltv': 'currentLtv',
  'dscr': 'dscr',
  'debt service coverage': 'dscr',
  'lien position': 'lienPosition',
  'lien_position': 'lienPosition',
  'lienposition': 'lienPosition',
  'lien': 'lienPosition',
  'appraisal date': 'appraisalDate',
  'appraisal_date': 'appraisalDate',
  'appraisaldate': 'appraisalDate',
  'loan purpose': 'loanPurpose',
  'loan_purpose': 'loanPurpose',
  'loanpurpose': 'loanPurpose',
  'purpose': 'loanPurpose'
}

// Performance history column mappings
const PERF_HISTORY_COLUMN_MAP: Record<string, keyof PerformanceHistoryRow> = {
  'month': 'periodMonth',
  'period': 'periodMonth',
  'date': 'periodMonth',
  'portfolio balance': 'portfolioBalance',
  'portfolio_balance': 'portfolioBalance',
  'balance': 'portfolioBalance',
  'loan count': 'loanCount',
  'loan_count': 'loanCount',
  'count': 'loanCount',
  'current %': 'currentPct',
  'current_pct': 'currentPct',
  'current': 'currentPct',
  '30 day %': 'delinquent30Pct',
  '30_day_pct': 'delinquent30Pct',
  '30 day': 'delinquent30Pct',
  '60 day %': 'delinquent60Pct',
  '60_day_pct': 'delinquent60Pct',
  '60 day': 'delinquent60Pct',
  '90+ day %': 'delinquent90Pct',
  '90_day_pct': 'delinquent90Pct',
  '90 day': 'delinquent90Pct',
  '90+ day': 'delinquent90Pct',
  'default %': 'defaultPct',
  'default_pct': 'defaultPct',
  'default': 'defaultPct',
  'prepayments': 'prepayments',
  'prepayment': 'prepayments',
  'new originations': 'newOriginations',
  'new_originations': 'newOriginations',
  'originations': 'newOriginations'
}

// Parse payment status from various formats
function parsePaymentStatus(value: any): LoanTapeRow['paymentStatus'] {
  if (!value) return 'current'
  const str = String(value).toLowerCase().trim()

  if (str.includes('current') || str === '0' || str === 'performing') return 'current'
  if (str.includes('30') || str === '1') return '30_day'
  if (str.includes('60') || str === '2') return '60_day'
  if (str.includes('90') || str === '3') return '90_day'
  if (str.includes('default') || str.includes('charge') || str === '4') return 'default'
  if (str.includes('paid') || str.includes('matured')) return 'paid_off'

  return 'current'
}

// Parse date from various formats
function parseDate(value: any): Date | undefined {
  if (!value) return undefined

  // Excel serial date
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return new Date(date.y, date.m - 1, date.d)
    }
  }

  // String date
  if (typeof value === 'string') {
    // Handle MM/DD/YYYY, YYYY-MM-DD, etc.
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) return parsed

    // Handle Mon-YY format (Jan-24)
    const monthMatch = value.match(/^([A-Za-z]{3})-(\d{2})$/)
    if (monthMatch) {
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      }
      const month = months[monthMatch[1].toLowerCase()]
      const year = 2000 + parseInt(monthMatch[2])
      if (month !== undefined) {
        return new Date(year, month, 1)
      }
    }
  }

  return undefined
}

// Parse number, handling percentages and currency
function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number') return value

  const str = String(value).replace(/[$,\s]/g, '')

  // Handle percentages (convert to decimal if > 1)
  if (str.includes('%')) {
    const num = parseFloat(str.replace('%', ''))
    return num > 1 ? num / 100 : num
  }

  const num = parseFloat(str)
  return isNaN(num) ? undefined : num
}

// Parse LTV (ensure it's a percentage between 0-100)
function parseLtv(value: any): number | undefined {
  const num = parseNumber(value)
  if (num === undefined) return undefined

  // If > 1, assume it's already a percentage (e.g., 75 = 75%)
  // If <= 1, assume it's a decimal (e.g., 0.75 = 75%)
  return num > 1 ? num : num * 100
}

// Parse interest rate (ensure it's a percentage)
function parseRate(value: any): number | undefined {
  const num = parseNumber(value)
  if (num === undefined) return undefined

  // If > 1, assume it's a percentage (e.g., 8.5 = 8.5%)
  // If <= 0.3, assume it's a decimal (e.g., 0.085 = 8.5%)
  return num <= 0.3 ? num * 100 : num
}

export interface ParseResult<T> {
  success: boolean
  data: T[]
  errors: string[]
  warnings: string[]
  unmappedColumns: string[]
}

export function parseLoanTape(fileBuffer: Buffer, fileName: string): ParseResult<LoanTapeRow> {
  const result: ParseResult<LoanTapeRow> = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    unmappedColumns: []
  }

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true })

    // Find the right sheet (prefer 'Loan Tape' if exists)
    let sheetName = workbook.SheetNames.find(n =>
      n.toLowerCase().includes('loan') || n.toLowerCase().includes('tape')
    ) || workbook.SheetNames[0]

    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    if (rawData.length < 2) {
      result.errors.push('File contains no data rows')
      return result
    }

    // Map headers
    const headers = rawData[0].map((h: any) => String(h || '').toLowerCase().trim())
    const columnMapping: Record<number, keyof LoanTapeRow> = {}

    headers.forEach((header, index) => {
      const mapped = LOAN_TAPE_COLUMN_MAP[header]
      if (mapped) {
        columnMapping[index] = mapped
      } else if (header) {
        result.unmappedColumns.push(header)
      }
    })

    // Check required fields
    const mappedFields = Object.values(columnMapping)
    const requiredFields: (keyof LoanTapeRow)[] = ['loanId', 'currentBalance', 'interestRate']
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f))

    if (missingRequired.length > 0) {
      result.errors.push(`Missing required columns: ${missingRequired.join(', ')}`)
      return result
    }

    // Parse rows
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        continue // Skip empty rows
      }

      try {
        const loan: Partial<LoanTapeRow> = {}

        Object.entries(columnMapping).forEach(([indexStr, field]) => {
          const index = parseInt(indexStr)
          const value = row[index]

          switch (field) {
            case 'loanId':
            case 'borrowerName':
            case 'propertyType':
            case 'propertyState':
            case 'propertyCity':
            case 'lienPosition':
            case 'loanPurpose':
              loan[field] = value ? String(value).trim() : undefined
              break

            case 'paymentStatus':
              loan.paymentStatus = parsePaymentStatus(value)
              break

            case 'originationDate':
            case 'maturityDate':
            case 'appraisalDate':
              loan[field] = parseDate(value)
              break

            case 'interestRate':
              loan.interestRate = parseRate(value)
              break

            case 'originalLtv':
            case 'currentLtv':
              loan[field] = parseLtv(value)
              break

            case 'originalBalance':
            case 'currentBalance':
            case 'propertyValue':
            case 'termMonths':
            case 'dscr':
              loan[field] = parseNumber(value)
              break
          }
        })

        // Validate loan has minimum required data
        if (loan.loanId && loan.currentBalance !== undefined) {
          result.data.push(loan as LoanTapeRow)
        } else {
          result.warnings.push(`Row ${i + 1}: Missing loan ID or current balance, skipped`)
        }
      } catch (err: any) {
        result.warnings.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    result.success = result.data.length > 0
    if (result.data.length === 0) {
      result.errors.push('No valid loan records found')
    }

  } catch (err: any) {
    result.errors.push(`Failed to parse file: ${err.message}`)
  }

  return result
}

export function parsePerformanceHistory(fileBuffer: Buffer, fileName: string): ParseResult<PerformanceHistoryRow> {
  const result: ParseResult<PerformanceHistoryRow> = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    unmappedColumns: []
  }

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true })

    // Find the right sheet
    let sheetName = workbook.SheetNames.find(n =>
      n.toLowerCase().includes('performance') || n.toLowerCase().includes('history')
    ) || workbook.SheetNames[0]

    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    if (rawData.length < 2) {
      result.errors.push('File contains no data rows')
      return result
    }

    // Map headers
    const headers = rawData[0].map((h: any) => String(h || '').toLowerCase().trim())
    const columnMapping: Record<number, keyof PerformanceHistoryRow> = {}

    headers.forEach((header, index) => {
      const mapped = PERF_HISTORY_COLUMN_MAP[header]
      if (mapped) {
        columnMapping[index] = mapped
      } else if (header) {
        result.unmappedColumns.push(header)
      }
    })

    // Parse rows
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        continue
      }

      try {
        const record: Partial<PerformanceHistoryRow> = {}

        Object.entries(columnMapping).forEach(([indexStr, field]) => {
          const index = parseInt(indexStr)
          const value = row[index]

          switch (field) {
            case 'periodMonth':
              record.periodMonth = parseDate(value)
              break

            default:
              record[field] = parseNumber(value)
              break
          }
        })

        if (record.periodMonth && record.portfolioBalance !== undefined) {
          result.data.push(record as PerformanceHistoryRow)
        }
      } catch (err: any) {
        result.warnings.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    // Sort by date
    result.data.sort((a, b) => a.periodMonth.getTime() - b.periodMonth.getTime())

    result.success = result.data.length > 0

  } catch (err: any) {
    result.errors.push(`Failed to parse file: ${err.message}`)
  }

  return result
}
