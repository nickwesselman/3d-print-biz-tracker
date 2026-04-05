import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
} from '@mui/material'
import { addFailedPrint, updateFailedPrint } from '../../hooks/useFailedPrints'
import { useModels } from '../../hooks/useModels'
import { useFilamentRolls } from '../../hooks/useFilamentRolls'
import { useSettings } from '../../hooks/useSettings'
import { todayISODate } from '../../utils/formatters'

const REASONS = ['Adhesion failure', 'Warping', 'Stringing', 'Layer shift', 'Under-extrusion', 'Spaghetti', 'Power outage', 'Other']

const EMPTY = {
  modelId: '',
  filamentRollId: '',
  filamentWastedGrams: '',
  failureReason: '',
  failedAt: todayISODate(),
}

export default function FailureForm({ open, onClose, editFailure, preselectedModelId }) {
  const [form, setForm] = useState(EMPTY)
  const models = useModels()
  const filamentRolls = useFilamentRolls()
  const settings = useSettings()

  useEffect(() => {
    if (editFailure) {
      setForm({
        modelId: editFailure.modelId || '',
        filamentRollId: editFailure.filamentRollId || '',
        filamentWastedGrams: editFailure.filamentWastedGrams || '',
        failureReason: editFailure.failureReason || '',
        failedAt: editFailure.failedAt?.slice(0, 10) || todayISODate(),
      })
    } else {
      setForm({ ...EMPTY, modelId: preselectedModelId || '', failedAt: todayISODate() })
    }
  }, [editFailure, preselectedModelId, open])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Live waste cost preview
  const roll = filamentRolls.find(r => r.id === Number(form.filamentRollId))
  const costPerGram = roll ? roll.costPaid / roll.weightGrams : 0
  const wastedCost = form.filamentWastedGrams && costPerGram
    ? (Number(form.filamentWastedGrams) * costPerGram).toFixed(2)
    : null

  async function handleSubmit() {
    const data = {
      modelId: Number(form.modelId) || null,
      filamentRollId: Number(form.filamentRollId) || null,
      filamentWastedGrams: Number(form.filamentWastedGrams) || 0,
      wastedCost: wastedCost ? Number(wastedCost) : 0,
      failureReason: form.failureReason,
      failedAt: new Date(form.failedAt).toISOString(),
    }
    if (editFailure) {
      await updateFailedPrint(editFailure.id, data)
    } else {
      await addFailedPrint(data)
    }
    onClose()
  }

  const valid = form.filamentWastedGrams

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editFailure ? 'Edit Failed Print' : 'Log Failed Print'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              select
              label="Model (optional)"
              value={form.modelId}
              onChange={e => set('modelId', e.target.value)}
            >
              <MenuItem value="">Unknown / Not saved</MenuItem>
              {models.map(m => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              label="Filament Roll"
              value={form.filamentRollId}
              onChange={e => set('filamentRollId', e.target.value)}
            >
              <MenuItem value="">Unknown</MenuItem>
              {filamentRolls.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.brand} {r.color} ({r.material})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Filament Wasted (g) *"
              type="number"
              value={form.filamentWastedGrams}
              onChange={e => set('filamentWastedGrams', e.target.value)}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Date"
              type="date"
              value={form.failedAt}
              onChange={e => set('failedAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              label="Reason (optional)"
              value={form.failureReason}
              onChange={e => set('failureReason', e.target.value)}
            >
              <MenuItem value="">— Select reason —</MenuItem>
              {REASONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>

          {wastedCost && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="error.main">
                  Waste cost: <strong>{settings.currencySymbol}{wastedCost}</strong>
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="warning" disabled={!valid}>
          {editFailure ? 'Save Changes' : 'Log Failure'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
