import { db } from '../db/database'

const BACKUP_FILE_NAME = 'printbiz-backup.json'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

export async function exportAllData() {
  const [settings, filamentRolls, models, subscriptions, sales, failedPrints] = await Promise.all([
    db.settings.toArray(),
    db.filamentRolls.toArray(),
    db.models.toArray(),
    db.subscriptions.toArray(),
    db.sales.toArray(),
    db.failedPrints.toArray(),
  ])
  return { settings, filamentRolls, models, subscriptions, sales, failedPrints, exportedAt: new Date().toISOString() }
}

export function downloadBackup(data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `printbiz-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  await restoreFromData(data)
}

export async function restoreFromData(data) {
  await db.transaction('rw', [db.settings, db.filamentRolls, db.models, db.subscriptions, db.sales, db.failedPrints], async () => {
    await db.settings.clear()
    await db.filamentRolls.clear()
    await db.models.clear()
    await db.subscriptions.clear()
    await db.sales.clear()
    await db.failedPrints.clear()

    if (data.settings?.length) await db.settings.bulkAdd(data.settings)
    if (data.filamentRolls?.length) await db.filamentRolls.bulkAdd(data.filamentRolls)
    if (data.models?.length) await db.models.bulkAdd(data.models)
    if (data.subscriptions?.length) await db.subscriptions.bulkAdd(data.subscriptions)
    if (data.sales?.length) await db.sales.bulkAdd(data.sales)
    if (data.failedPrints?.length) await db.failedPrints.bulkAdd(data.failedPrints)
  })
}

// ---- Google Drive helpers ----

async function findBackupFile(accessToken) {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and 'appDataFolder' in parents`)
  const res = await fetch(`${DRIVE_API}/files?q=${query}&spaces=appDataFolder&fields=files(id,name,modifiedTime)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Drive API error: ' + res.status)
  const json = await res.json()
  return json.files?.[0] || null
}

export async function backupToDrive(accessToken) {
  const data = await exportAllData()
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })

  const existing = await findBackupFile(accessToken)

  const metadata = {
    name: BACKUP_FILE_NAME,
    ...(!existing && { parents: ['appDataFolder'] }),
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)

  const url = existing
    ? `${DRIVE_UPLOAD}/files/${existing.id}?uploadType=multipart`
    : `${DRIVE_UPLOAD}/files?uploadType=multipart`

  const method = existing ? 'PATCH' : 'POST'

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Drive upload failed: ' + err)
  }
  return await res.json()
}

export async function restoreFromDrive(accessToken) {
  const existing = await findBackupFile(accessToken)
  if (!existing) throw new Error('No backup file found in Google Drive')

  const res = await fetch(`${DRIVE_API}/files/${existing.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Drive download failed: ' + res.status)
  const data = await res.json()
  await restoreFromData(data)
  return existing.modifiedTime
}
