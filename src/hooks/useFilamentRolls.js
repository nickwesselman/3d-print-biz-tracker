import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useFilamentRolls() {
  return useLiveQuery(() => db.filamentRolls.orderBy('id').reverse().toArray()) ?? []
}

export function useFilamentRoll(id) {
  return useLiveQuery(() => (id ? db.filamentRolls.get(id) : undefined), [id])
}

export async function addFilamentRoll(data) {
  return db.filamentRolls.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateFilamentRoll(id, data) {
  return db.filamentRolls.update(id, data)
}

export async function deleteFilamentRoll(id) {
  return db.filamentRolls.delete(id)
}

export function getCostPerGram(roll) {
  if (!roll || !roll.weightGrams || !roll.costPaid) return 0
  return roll.costPaid / roll.weightGrams
}
