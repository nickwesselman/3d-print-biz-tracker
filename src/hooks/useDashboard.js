import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { computeFilamentCost, computeAmortizedSubscriptionCost, computeTotalModelCost, computeProfit, computeMonthlyCost } from '../utils/calculations'

export function useDashboard() {
  return useLiveQuery(async () => {
    const [models, filamentRolls, subscriptions, sales, failedPrints] = await Promise.all([
      db.models.toArray(),
      db.filamentRolls.toArray(),
      db.subscriptions.toArray(),
      db.sales.toArray(),
      db.failedPrints.toArray(),
    ])

    const rollMap = Object.fromEntries(filamentRolls.map(r => [r.id, r]))
    const subMap = Object.fromEntries(subscriptions.map(s => [s.id, s]))

    // Count models per subscription
    const modelsPerSub = {}
    for (const m of models) {
      if (m.subscriptionId) {
        modelsPerSub[m.subscriptionId] = (modelsPerSub[m.subscriptionId] || 0) + 1
      }
    }

    // Build a cost map per model
    const modelCostMap = {}
    for (const m of models) {
      const roll = rollMap[m.filamentRollId]
      const costPerGram = roll ? roll.costPaid / roll.weightGrams : 0
      const filamentCost = computeFilamentCost(m.filamentGrams, costPerGram)
      const sub = m.subscriptionId ? subMap[m.subscriptionId] : null
      const monthlyCost = sub ? computeMonthlyCost(sub.cost, sub.billingCycle) : 0
      const amortized = sub ? computeAmortizedSubscriptionCost(monthlyCost, modelsPerSub[m.subscriptionId] || 1) : 0
      modelCostMap[m.id] = computeTotalModelCost(filamentCost, amortized)
    }

    // Total revenue
    const totalRevenue = sales.reduce((sum, s) => sum + (s.salePrice || 0), 0)

    // Total cost of goods sold (based on sold models)
    const totalCOGS = sales.reduce((sum, s) => sum + (modelCostMap[s.modelId] || 0), 0)

    // Monthly subscription costs (active subs)
    const monthlySubCosts = subscriptions
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + computeMonthlyCost(s.cost, s.billingCycle), 0)

    // Total waste cost
    const totalWasteCost = failedPrints.reduce((sum, f) => sum + (f.wastedCost || 0), 0)

    // Net profit = revenue - COGS - waste
    const netProfit = totalRevenue - totalCOGS - totalWasteCost

    // Monthly revenue (last 6 months)
    const now = new Date()
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
      const monthSales = sales.filter(s => {
        const sd = new Date(s.saleDatetime)
        return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
      })
      const revenue = monthSales.reduce((sum, s) => sum + (s.salePrice || 0), 0)
      const cogs = monthSales.reduce((sum, s) => sum + (modelCostMap[s.modelId] || 0), 0)
      monthlyData.push({ label, revenue, cogs, profit: revenue - cogs })
    }

    // Top models by total sales count
    const modelSalesCount = {}
    const modelRevenue = {}
    for (const s of sales) {
      modelSalesCount[s.modelId] = (modelSalesCount[s.modelId] || 0) + 1
      modelRevenue[s.modelId] = (modelRevenue[s.modelId] || 0) + s.salePrice
    }
    const topModels = models
      .filter(m => modelSalesCount[m.id])
      .map(m => ({
        id: m.id,
        name: m.name,
        salesCount: modelSalesCount[m.id] || 0,
        revenue: modelRevenue[m.id] || 0,
        cost: modelCostMap[m.id] || 0,
        profit: (modelRevenue[m.id] || 0) - (modelCostMap[m.id] || 0) * (modelSalesCount[m.id] || 0),
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)

    return {
      totalRevenue,
      totalCOGS,
      monthlySubCosts,
      totalWasteCost,
      netProfit,
      monthlyData,
      topModels,
      totalSales: sales.length,
      totalModels: models.length,
      totalFailures: failedPrints.length,
    }
  })
}
