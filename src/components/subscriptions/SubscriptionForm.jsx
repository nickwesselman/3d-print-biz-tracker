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
import { addSubscription, updateSubscription } from '../../hooks/useSubscriptions'
import { useSettings } from '../../hooks/useSettings'
import { computeMonthlyCost } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'

const PLATFORMS = ['Patreon', 'MyMiniFactory', 'Cults3D', 'Printables', 'CGTrader', 'Thingiverse', 'Other']

const EMPTY = {
  name: '',
  platform: 'Patreon',
  billingCycle: 'monthly',
  cost: '',
  renewalDate: '',
  notes: '',
}

export default function SubscriptionForm({ open, onClose, editSub }) {
  const [form, setForm] = useState(EMPTY)
  const settings = useSettings()

  useEffect(() => {
    if (editSub) {
      setForm({
        name: editSub.name || '',
        platform: editSub.platform || 'Patreon',
        billingCycle: editSub.billingCycle || 'monthly',
        cost: editSub.cost || '',
        renewalDate: editSub.renewalDate || '',
        notes: editSub.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [editSub, open])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const monthlyCost = form.cost ? computeMonthlyCost(Number(form.cost), form.billingCycle) : null
  const fmt = v => formatCurrency(v, settings.currencySymbol)

  async function handleSubmit() {
    const data = {
      ...form,
      cost: Number(form.cost),
    }
    if (editSub) {
      await updateSubscription(editSub.id, data)
    } else {
      await addSubscription(data)
    }
    onClose()
  }

  const valid = form.name && form.cost

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editSub ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label="Name *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. MyMiniFactory Select, Cool Designer Patreon"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Platform"
              value={form.platform}
              onChange={e => set('platform', e.target.value)}
            >
              {PLATFORMS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Billing Cycle"
              value={form.billingCycle}
              onChange={e => set('billingCycle', e.target.value)}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="annual">Annual</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Cost *"
              type="number"
              value={form.cost}
              onChange={e => set('cost', e.target.value)}
              inputProps={{ min: 0, step: 0.5 }}
              InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>{settings.currencySymbol}</Typography> }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Renewal Date"
              type="date"
              value={form.renewalDate}
              onChange={e => set('renewalDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {monthlyCost !== null && form.billingCycle === 'annual' && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly equivalent: <strong>{fmt(monthlyCost)}/mo</strong>
                </Typography>
              </Box>
            </Grid>
          )}

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
          {editSub ? 'Save Changes' : 'Add Subscription'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
