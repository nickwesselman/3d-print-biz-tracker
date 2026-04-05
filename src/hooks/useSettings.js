import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get(1))
  return settings ?? { currencySymbol: '$', googleAccessToken: null, lastBackedUpAt: null }
}

export async function updateSettings(patch) {
  await db.settings.update(1, patch)
}
