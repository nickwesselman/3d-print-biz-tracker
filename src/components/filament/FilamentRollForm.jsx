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
import { addFilamentRoll, updateFilamentRoll } from '../../hooks/useFilamentRolls'

const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Resin', 'Other']

const EMPTY = {
  brand: '',
  material: 'PLA',
  color: '',
  weightGrams: 1000,
  costPaid: '',
}

export default function FilamentRollForm({ open, onClose, editRoll }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (editRoll) {
      setForm({
        brand: editRoll.brand || '',
        material: editRoll.material || 'PLA',
        color: editRoll.color || '',
        weightGrams: editRoll.weightGrams || 1000,
        costPaid: editRoll.costPaid || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [editRoll, open])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const costPerGram = form.costPaid && form.weightGrams
    ? (Number(form.costPaid) / Number(form.weightGrams)).toFixed(4)
    : null

  async function handleSubmit() {
    const data = {
      ...form,
      weightGrams: Number(form.weightGrams),
      costPaid: Number(form.costPaid),
    }
    if (editRoll) {
      await updateFilamentRoll(editRoll.id, data)
    } else {
      await addFilamentRoll(data)
    }
    onClose()
  }

  const valid = form.brand && form.color && form.weightGrams && form.costPaid

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editRoll ? 'Edit Filament Roll' : 'Add Filament Roll'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Color" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Galaxy Black" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Material" value={form.material} onChange={e => set('material', e.target.value)}>
              {MATERIALS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Roll Weight (g)"
              type="number"
              value={form.weightGrams}
              onChange={e => set('weightGrams', e.target.value)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Cost Paid"
              type="number"
              value={form.costPaid}
              onChange={e => set('costPaid', e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          {costPerGram && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Cost per gram: <strong>${costPerGram}/g</strong>
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!valid}>
          {editRoll ? 'Save Changes' : 'Add Roll'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
