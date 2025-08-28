/**
 * Format a number as FCFA (XAF) currency
 * @param amount - The amount in cents or smallest unit
 * @param includeSymbol - Whether to include the FCFA symbol
 * @returns Formatted currency string
 */
export function formatFCFA(amount: number, includeSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
  
  return includeSymbol ? `${formatted} FCFA` : formatted
}

/**
 * Parse FCFA string back to number
 * @param fcfaString - String like "10 000 FCFA" or "10000"
 * @returns Number value
 */
export function parseFCFA(fcfaString: string): number {
  if (typeof fcfaString === 'number') return fcfaString
  
  // Remove FCFA suffix and whitespace, then parse
  const cleaned = fcfaString
    .replace(/FCFA/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '')
  
  return parseInt(cleaned, 10) || 0
}

// Default amounts in FCFA as specified in requirements
export const DEFAULT_AMOUNTS = {
  COURSE_PRICE: 1000, // 1 000 FCFA per course
  ANNUAL_REGISTRATION: 10000 // 10 000 FCFA annual registration
} as const