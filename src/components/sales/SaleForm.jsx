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
} from '@mui/material'
import { addSale, updateSale } from '../../hooks/useSales'
import { useModels } from '../../hooks/useModels'
import { useSettings } from '../../hooks/useSettings'
import { todayISODate } from '../../utils/formatters'

const PLATFORMS = ['In Person', 'Etsy', 'Facebook', 'Instagram', 'eBay', 'Other']

const EMPTY = {
  modelId: '',
  salePrice: '',
  saleDatetime: todayISODate(),
  platform: 'In Person',
  notes: '',
}

export default function SaleForm({ open, onClose, editSale, preselectedModelId }) {
  const [form, setForm] = useState(EMPTY)
  const models = useModels()
  const settings = useSettings()

  useEffect(() => {
    if (editSale) {
      setForm({
        modelId: editSale.modelId || '',
        salePrice: editSale.salePrice || '',
        saleDatetime: editSale.saleDatetime?.slice(0, 10) || todayISODate(),
        platform: editSale.platform || 'In Person',
        notes: editSale.notes || '',
      })
    } else {
      const modelId = preselectedModelId || ''
      const model = models.find(m => m.id === Number(modelId))
      setForm({
        ...EMPTY,
        modelId,
        salePrice: model?.defaultSalePrice || '',
        saleDatetime: todayISODate(),
      })
    }
  }, [editSale, preselectedModelId, open])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleModelChange(e) {
    const modelId = e.target.value
    const model = models.find(m => m.id === Number(modelId))
    setForm(f => ({ ...f, modelId, salePrice: model?.defaultSalePrice || f.salePrice }))
  }

  async function handleSubmit() {
    const data = {
      modelId: Number(form.modelId),
      salePrice: Number(form.salePrice),
      saleDatetime: new Date(form.saleDatetime).toISOString(),
      platform: form.platform,
      notes: form.notes,
    }
    if (editSale) {
      await updateSale(editSale.id, data)
    } else {
      await addSale(data)
    }
    onClose()
  }

  const valid = form.modelId && form.salePrice && form.saleDatetime

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editSale ? 'Edit Sale' : 'Log a Sale'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              select
              label="Model *"
              value={form.modelId}
              onChange={handleModelChange}
              disabled={!!preselectedModelId && !editSale}
            >
              {models.map(m => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Sale Price *"
              type="number"
              value={form.salePrice}
              onChange={e => set('salePrice', e.target.value)}
              inputProps={{ min: 0, step: 0.5 }}
              InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>{settings.currencySymbol}</Typography> }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Date *"
              type="date"
              value={form.saleDatetime}
              onChange={e => set('saleDatetime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              label="Platform"
              value={form.platform}
              onChange={e => set('platform', e.target.value)}
            >
              {PLATFORMS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!valid}>
          {editSale ? 'Save Changes' : 'Log Sale'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
