import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useFailedPrints() {
  return useLiveQuery(() => db.failedPrints.orderBy('failedAt').reverse().toArray()) ?? []
}

export async function addFailedPrint(data) {
  return db.failedPrints.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateFailedPrint(id, data) {
  return db.failedPrints.update(id, data)
}

export async function deleteFailedPrint(id) {
  return db.failedPrints.delete(id)
}
