import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { addModel, updateModel } from '../../hooks/useModels'
import { useFilamentRolls } from '../../hooks/useFilamentRolls'
import { useSubscriptions } from '../../hooks/useSubscriptions'
import { resizeImageToDataUrl } from '../../utils/imageUtils'
import { computeFilamentCost, computeAmortizedSubscriptionCost, computeTotalModelCost, computeMargin, computeMonthlyCost } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import { useSettings } from '../../hooks/useSettings'

const EMPTY = {
  name: '',
  description: '',
  imageDataUrl: '',
  filamentRollId: '',
  filamentGrams: '',
  printHours: '',
  printMinutes: '',
  subscriptionId: '',
  defaultSalePrice: '',
}

export default function ModelForm({ open, onClose, editModel }) {
  const [form, setForm] = useState(EMPTY)
  const fileRef = useRef()
  const filamentRolls = useFilamentRolls()
  const subscriptions = useSubscriptions()
  const settings = useSettings()

  useEffect(() => {
    if (editModel) {
      const totalMin = editModel.printTimeMinutes || 0
      setForm({
        name: editModel.name || '',
        description: editModel.description || '',
        imageDataUrl: editModel.imageDataUrl || '',
        filamentRollId: editModel.filamentRollId || '',
        filamentGrams: editModel.filamentGrams || '',
        printHours: Math.floor(totalMin / 60) || '',
        printMinutes: totalMin % 60 || '',
        subscriptionId: editModel.subscriptionId || '',
        defaultSalePrice: editModel.defaultSalePrice || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [editModel, open])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImageToDataUrl(file)
    set('imageDataUrl', dataUrl)
  }

  // Live cost preview
  const roll = filamentRolls.find(r => r.id === Number(form.filamentRollId))
  const sub = subscriptions.find(s => s.id === Number(form.subscriptionId))
  const costPerGram = roll ? roll.costPaid / roll.weightGrams : 0
  const filamentCost = computeFilamentCost(Number(form.filamentGrams), costPerGram)
  const modelsUsingSub = sub ? 1 : 0 // simplified preview — actual count determined at display time
  const monthlyCost = sub ? computeMonthlyCost(sub.cost, sub.billingCycle) : 0
  const amortized = sub ? computeAmortizedSubscriptionCost(monthlyCost, 1) : 0
  const totalCost = computeTotalModelCost(filamentCost, amortized)
  const margin = computeMargin(Number(form.defaultSalePrice), totalCost)
  const profit = Number(form.defaultSalePrice) - totalCost

  const fmt = v => formatCurrency(v, settings.currencySymbol)

  async function handleSubmit() {
    const printTimeMinutes =
      (Number(form.printHours) || 0) * 60 + (Number(form.printMinutes) || 0)
    const data = {
      name: form.name,
      description: form.description,
      imageDataUrl: form.imageDataUrl,
      filamentRollId: Number(form.filamentRollId) || null,
      filamentGrams: Number(form.filamentGrams) || 0,
      printTimeMinutes,
      subscriptionId: Number(form.subscriptionId) || null,
      defaultSalePrice: Number(form.defaultSalePrice) || 0,
    }
    if (editModel) {
      await updateModel(editModel.id, data)
    } else {
      await addModel(data)
    }
    onClose()
  }

  const valid = form.name && form.filamentRollId && form.filamentGrams && form.defaultSalePrice

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle>{editModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Image picker */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={form.imageDataUrl || undefined}
                variant="rounded"
                sx={{ width: 72, height: 72, bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider' }}
              >
                <PhotoCameraIcon />
              </Avatar>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileRef.current?.click()}
                >
                  {form.imageDataUrl ? 'Change Photo' : 'Add Photo'}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                  Tap to take a photo or pick from library
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Model Name *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              label="Filament Roll *"
              value={form.filamentRollId}
              onChange={e => set('filamentRollId', e.target.value)}
            >
              {filamentRolls.length === 0 && (
                <MenuItem disabled>No rolls added yet — go to Filament first</MenuItem>
              )}
              {filamentRolls.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.brand} {r.color} ({r.material})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Filament Used (g) *"
              type="number"
              value={form.filamentGrams}
              onChange={e => set('filamentGrams', e.target.value)}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              label="Print Hours"
              type="number"
              value={form.printHours}
              onChange={e => set('printHours', e.target.value)}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          <Grid item xs={3}>
            <TextField
              label="Minutes"
              type="number"
              value={form.printMinutes}
              onChange={e => set('printMinutes', e.target.value)}
              inputProps={{ min: 0, max: 59, step: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              label="Designer Subscription (optional)"
              value={form.subscriptionId}
              onChange={e => set('subscriptionId', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {subscriptions.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Sale Price *"
              type="number"
              value={form.defaultSalePrice}
              onChange={e => set('defaultSalePrice', e.target.value)}
              inputProps={{ min: 0, step: 0.5 }}
              InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>{settings.currencySymbol}</Typography> }}
            />
          </Grid>

          {/* Live cost preview */}
          {form.filamentGrams && form.filamentRollId && form.defaultSalePrice && (
            <Grid item xs={12}>
              <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Cost Preview
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mt: 0.5, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.disabled">Filament</Typography>
                    <Typography variant="body2">{fmt(filamentCost)}</Typography>
                  </Box>
                  {sub && (
                    <Box>
                      <Typography variant="caption" color="text.disabled">Sub (est.)</Typography>
                      <Typography variant="body2">{fmt(amortized)}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.disabled">Total Cost</Typography>
                    <Typography variant="body2">{fmt(totalCost)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.disabled">Profit</Typography>
                    <Typography variant="body2" color={profit >= 0 ? 'secondary.main' : 'error.main'}>
                      {fmt(profit)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.disabled">Margin</Typography>
                    <Typography variant="body2" color={margin >= 50 ? 'secondary.main' : margin >= 20 ? 'warning.main' : 'error.main'}>
                      {margin.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!valid}>
          {editModel ? 'Save Changes' : 'Add Model'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
