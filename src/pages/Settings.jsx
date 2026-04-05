import { useState, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import LogoutIcon from '@mui/icons-material/Logout'
import { useGoogleLogin } from '@react-oauth/google'
import { useSettings, updateSettings } from '../hooks/useSettings'
import { exportAllData, downloadBackup, importBackup, backupToDrive, restoreFromDrive } from '../utils/googleDrive'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatDatetime } from '../utils/formatters'

const CURRENCIES = [
  { symbol: '$', label: 'USD ($)' },
  { symbol: '£', label: 'GBP (£)' },
  { symbol: '€', label: 'EUR (€)' },
  { symbol: 'A$', label: 'AUD (A$)' },
  { symbol: 'C$', label: 'CAD (C$)' },
]

export default function Settings() {
  const settings = useSettings()
  const [driveStatus, setDriveStatus] = useState(null) // 'loading' | 'success' | 'error'
  const [driveMessage, setDriveMessage] = useState('')
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [localRestoreConfirm, setLocalRestoreConfirm] = useState(false)
  const [pendingRestoreFile, setPendingRestoreFile] = useState(null)
  const importRef = useRef()

  const accessToken = settings.googleAccessToken

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    onSuccess: async (response) => {
      await updateSettings({ googleAccessToken: response.access_token })
      setDriveStatus('success')
      setDriveMessage('Signed in to Google Drive')
    },
    onError: () => {
      setDriveStatus('error')
      setDriveMessage('Google sign-in failed')
    },
  })

  async function handleBackupToDrive() {
    if (!accessToken) return
    setDriveStatus('loading')
    try {
      await backupToDrive(accessToken)
      await updateSettings({ lastBackedUpAt: new Date().toISOString() })
      setDriveStatus('success')
      setDriveMessage('Backed up to Google Drive!')
    } catch (e) {
      setDriveStatus('error')
      setDriveMessage(e.message)
    }
  }

  async function handleRestoreFromDrive() {
    if (!accessToken) return
    setRestoreConfirm(false)
    setDriveStatus('loading')
    try {
      const modifiedTime = await restoreFromDrive(accessToken)
      setDriveStatus('success')
      setDriveMessage(`Restored from backup (saved ${formatDatetime(modifiedTime)})`)
    } catch (e) {
      setDriveStatus('error')
      setDriveMessage(e.message)
    }
  }

  async function handleLocalExport() {
    const data = await exportAllData()
    downloadBackup(data)
  }

  function handleLocalImportSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingRestoreFile(file)
    setLocalRestoreConfirm(true)
  }

  async function handleLocalImportConfirm() {
    setLocalRestoreConfirm(false)
    try {
      await importBackup(pendingRestoreFile)
      setDriveStatus('success')
      setDriveMessage('Data imported successfully!')
    } catch (e) {
      setDriveStatus('error')
      setDriveMessage('Import failed: ' + e.message)
    }
    setPendingRestoreFile(null)
    importRef.current.value = ''
  }

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      <Stack spacing={2}>
        {/* General settings */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              General
            </Typography>
            <TextField
              select
              label="Currency"
              value={settings.currencySymbol}
              onChange={e => updateSettings({ currencySymbol: e.target.value })}
            >
              {CURRENCIES.map(c => (
                <MenuItem key={c.symbol} value={c.symbol}>{c.label}</MenuItem>
              ))}
            </TextField>
          </CardContent>
        </Card>

        {/* Google Drive backup */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Google Drive Backup
            </Typography>

            {driveStatus === 'loading' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">Working…</Typography>
              </Box>
            )}
            {driveStatus === 'success' && (
              <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setDriveStatus(null)}>{driveMessage}</Alert>
            )}
            {driveStatus === 'error' && (
              <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setDriveStatus(null)}>{driveMessage}</Alert>
            )}

            {!accessToken ? (
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => googleLogin()}
                fullWidth
              >
                Sign in with Google
              </Button>
            ) : (
              <Stack spacing={1.5}>
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Signed in to Google Drive
                  {settings.lastBackedUpAt && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Last backed up: {formatDatetime(settings.lastBackedUpAt)}
                    </Typography>
                  )}
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleBackupToDrive}
                  disabled={driveStatus === 'loading'}
                >
                  Back Up Now
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadIcon />}
                  onClick={() => setRestoreConfirm(true)}
                  disabled={driveStatus === 'loading'}
                  color="warning"
                >
                  Restore from Drive
                </Button>
                <Button
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={() => updateSettings({ googleAccessToken: null })}
                  color="error"
                  variant="text"
                >
                  Sign Out
                </Button>
              </Stack>
            )}

            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
              Your backup is stored privately in your Google Drive's hidden app folder — it doesn't appear in your Drive.
            </Typography>
          </CardContent>
        </Card>

        {/* Local export/import */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Local Backup
            </Typography>
            <Stack spacing={1.5}>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleLocalExport}>
                Export to JSON File
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                color="warning"
                onClick={() => importRef.current?.click()}
              >
                Import from JSON File
              </Button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={handleLocalImportSelect}
              />
            </Stack>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
              Export saves all your data. Import will overwrite existing data.
            </Typography>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              About
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PrintBiz — 3D Print Business Tracker
            </Typography>
            <Typography variant="caption" color="text.disabled">
              All data stored locally on this device. Install as a PWA for offline use.
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <ConfirmDialog
        open={restoreConfirm}
        title="Restore from Google Drive?"
        message="This will overwrite all current data with the backup from Google Drive. This cannot be undone."
        onConfirm={handleRestoreFromDrive}
        onCancel={() => setRestoreConfirm(false)}
        confirmLabel="Restore"
        confirmColor="warning"
      />

      <ConfirmDialog
        open={localRestoreConfirm}
        title="Import Data?"
        message="This will overwrite all current data with the contents of the selected file. This cannot be undone."
        onConfirm={handleLocalImportConfirm}
        onCancel={() => { setLocalRestoreConfirm(false); setPendingRestoreFile(null) }}
        confirmLabel="Import"
        confirmColor="warning"
      />
    </Box>
  )
}
