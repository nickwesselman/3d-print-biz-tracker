import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useSales() {
  return useLiveQuery(() => db.sales.orderBy('saleDatetime').reverse().toArray()) ?? []
}

export function useSalesByModel(modelId) {
  return useLiveQuery(
    () => modelId ? db.sales.where('modelId').equals(modelId).reverse().sortBy('saleDatetime') : [],
    [modelId]
  ) ?? []
}

export async function addSale(data) {
  return db.sales.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateSale(id, data) {
  return db.sales.update(id, data)
}

export async function deleteSale(id) {
  return db.sales.delete(id)
}
