import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useModels() {
  return useLiveQuery(() => db.models.orderBy('name').toArray()) ?? []
}

export function useModel(id) {
  return useLiveQuery(() => (id ? db.models.get(Number(id)) : undefined), [id])
}

export function useModelsBySubscription(subscriptionId) {
  return useLiveQuery(
    () => subscriptionId ? db.models.where('subscriptionId').equals(subscriptionId).toArray() : [],
    [subscriptionId]
  ) ?? []
}

export async function addModel(data) {
  return db.models.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateModel(id, data) {
  return db.models.update(id, data)
}

export async function deleteModel(id) {
  // Remove associated sales and failed prints
  await db.sales.where('modelId').equals(id).delete()
  await db.failedPrints.where('modelId').equals(id).modify({ modelId: null })
  return db.models.delete(id)
}
