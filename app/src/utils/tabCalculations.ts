export const VAT_RATE = Number(import.meta.env.VITE_VAT) || 0.15

export interface TabTotals {
  subtotal: number
  tax: number
  totalBeforeTip: number
  totalOwed: number
  tipAmount: number
}

/**
 * Calculates tab totals based on Inclusive Pricing logic.
 * User logic: Tax is calculated as a percentage of the Total (Gross).
 * Tax = Total * 0.15
 * Subtotal = Total - Tax
 */
export const calculateTabTotals = (
  items: { item_total: number }[],
  tipAmount: number = 0,
): TabTotals => {
  // 1. Calculate Total Value of Items (Gross ID)
  const totalBeforeTip = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0)

  // 2. Calculate Tax (on Gross)
  const tax = totalBeforeTip * VAT_RATE

  // 3. Calculate Subtotal
  const subtotal = totalBeforeTip - tax

  // 4. Calculate Total Owed
  const totalOwed = totalBeforeTip + tipAmount

  return {
    subtotal,
    tax,
    totalBeforeTip,
    totalOwed,
    tipAmount,
  }
}
