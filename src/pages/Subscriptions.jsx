import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Fab,
  Stack,
  IconButton,
  Chip,
  Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SubscriptionsIcon from '@mui/icons-material/Subscriptions'
import { useSubscriptions, deleteSubscription } from '../hooks/useSubscriptions'
import { useModels } from '../hooks/useModels'
import { useSettings } from '../hooks/useSettings'
import SubscriptionForm from '../components/subscriptions/SubscriptionForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { computeMonthlyCost, computeAmortizedSubscriptionCost } from '../utils/calculations'

export default function Subscriptions() {
  const subscriptions = useSubscriptions()
  const models = useModels()
  const settings = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const fmt = v => formatCurrency(v, settings.currencySymbol)

  // Count models per subscription
  const modelsPerSub = {}
  for (const m of models) {
    if (m.subscriptionId) {
      modelsPerSub[m.subscriptionId] = (modelsPerSub[m.subscriptionId] || 0) + 1
    }
  }

  const totalMonthly = subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + computeMonthlyCost(s.cost, s.billingCycle), 0)

  function openEdit(sub) {
    setEditSub(sub)
    setFormOpen(true)
  }

  function openAdd() {
    setEditSub(null)
    setFormOpen(true)
  }

  // Check if renewal within 7 days
  function isRenewingSoon(sub) {
    if (!sub.renewalDate) return false
    const diff = (new Date(sub.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }

  return (
    <Box sx={{ p: 2 }}>
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<SubscriptionsIcon />}
          title="No subscriptions yet"
          message="Add designer subscriptions to include their costs in your model pricing."
          actionLabel="Add Subscription"
          onAction={openAdd}
        />
      ) : (
        <>
          {/* Monthly summary */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>
                Total Monthly Subscriptions
              </Typography>
              <Typography variant="h6" color="primary.light">{fmt(totalMonthly)}/mo</Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {subscriptions.map(sub => {
              const monthlyCost = computeMonthlyCost(sub.cost, sub.billingCycle)
              const modelCount = modelsPerSub[sub.id] || 0
              const amortized = modelCount > 0
                ? computeAmortizedSubscriptionCost(monthlyCost, modelCount)
                : null
              const renewingSoon = isRenewingSoon(sub)

              return (
                <Grid item xs={12} key={sub.id}>
                  <Card sx={renewingSoon ? { borderColor: 'warning.main', borderWidth: 1, borderStyle: 'solid' } : {}}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1">{sub.name}</Typography>
                            <Chip label={sub.platform} size="small" variant="outlined" />
                            {renewingSoon && (
                              <Chip label="Renewing soon!" size="small" color="warning" />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                            <Box>
                              <Typography variant="caption" color="text.disabled">Cost</Typography>
                              <Typography variant="body2">
                                {fmt(sub.cost)}/{sub.billingCycle === 'annual' ? 'yr' : 'mo'}
                              </Typography>
                            </Box>
                            {sub.billingCycle === 'annual' && (
                              <Box>
                                <Typography variant="caption" color="text.disabled">Monthly</Typography>
                                <Typography variant="body2">{fmt(monthlyCost)}/mo</Typography>
                              </Box>
                            )}
                            <Box>
                              <Typography variant="caption" color="text.disabled">Models</Typography>
                              <Typography variant="body2">{modelCount}</Typography>
                            </Box>
                            {amortized !== null && (
                              <Box>
                                <Typography variant="caption" color="text.disabled">Per Model</Typography>
                                <Typography variant="body2" color="primary.light">{fmt(amortized)}</Typography>
                              </Box>
                            )}
                            {sub.renewalDate && (
                              <Box>
                                <Typography variant="caption" color="text.disabled">Renews</Typography>
                                <Typography variant="body2">{formatDate(sub.renewalDate)}</Typography>
                              </Box>
                            )}
                          </Box>
                          {sub.notes && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                              {sub.notes}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => openEdit(sub)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(sub.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 20 }} onClick={openAdd}>
        <AddIcon />
      </Fab>

      <SubscriptionForm open={formOpen} onClose={() => setFormOpen(false)} editSub={editSub} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Subscription?"
        message="This will remove the subscription from all associated models."
        onConfirm={async () => { await deleteSubscription(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  )
}
