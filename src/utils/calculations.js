/**
 * All cost/margin calculations as pure functions.
 * Print time is tracked for opportunity cost awareness but NOT included in $ cost.
 */

export function computeFilamentCost(filamentGrams, costPerGram) {
  if (!filamentGrams || !costPerGram) return 0
  return filamentGrams * costPerGram
}

export function computeAmortizedSubscriptionCost(monthlyCost, modelCount) {
  if (!monthlyCost || !modelCount || modelCount <= 0) return 0
  return monthlyCost / modelCount
}

export function computeTotalModelCost(filamentCost, amortizedSubscriptionCost = 0) {
  return filamentCost + amortizedSubscriptionCost
}

export function computeMargin(salePrice, totalCost) {
  if (!salePrice || salePrice <= 0) return 0
  return ((salePrice - totalCost) / salePrice) * 100
}

export function computeProfit(salePrice, totalCost) {
  return salePrice - totalCost
}

export function computeMonthlyCost(cost, billingCycle) {
  if (billingCycle === 'annual') return cost / 12
  return cost
}

export function formatPrintTime(minutes) {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
