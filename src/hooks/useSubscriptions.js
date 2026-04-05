import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { computeMonthlyCost } from '../utils/calculations'

export function useSubscriptions() {
  return useLiveQuery(() => db.subscriptions.orderBy('name').toArray()) ?? []
}

export function useSubscription(id) {
  return useLiveQuery(() => (id ? db.subscriptions.get(id) : undefined), [id])
}

export async function addSubscription(data) {
  const monthlyCost = computeMonthlyCost(data.cost, data.billingCycle)
  return db.subscriptions.add({ ...data, monthlyCost, isActive: true, createdAt: new Date().toISOString() })
}

export async function updateSubscription(id, data) {
  const monthlyCost = computeMonthlyCost(data.cost, data.billingCycle)
  return db.subscriptions.update(id, { ...data, monthlyCost })
}

export async function deleteSubscription(id) {
  // Detach from all models first
  await db.models.where('subscriptionId').equals(id).modify({ subscriptionId: null })
  return db.subscriptions.delete(id)
}
