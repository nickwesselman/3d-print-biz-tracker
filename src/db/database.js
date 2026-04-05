import Dexie from 'dexie'

export const db = new Dexie('PrintBizDB')

db.version(1).stores({
  settings: '++id',
  filamentRolls: '++id, material, color',
  models: '++id, name, filamentRollId, subscriptionId',
  subscriptions: '++id, name, isActive',
  sales: '++id, modelId, saleDatetime',
  failedPrints: '++id, modelId, failedAt',
})

// Seed default settings on first run
db.on('ready', async () => {
  const count = await db.settings.count()
  if (count === 0) {
    await db.settings.add({
      currencySymbol: '$',
      googleAccessToken: null,
      lastBackedUpAt: null,
    })
  }
})

export default db
