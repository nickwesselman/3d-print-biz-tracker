import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Fab,
  Stack,
  IconButton,
  Divider,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import { useSales, deleteSale } from '../hooks/useSales'
import { useModels } from '../hooks/useModels'
import { useFilamentRolls } from '../hooks/useFilamentRolls'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useSettings } from '../hooks/useSettings'
import SaleForm from '../components/sales/SaleForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters'
import { computeFilamentCost, computeAmortizedSubscriptionCost, computeTotalModelCost, computeMonthlyCost, computeProfit } from '../utils/calculations'

export default function Sales() {
  const sales = useSales()
  const models = useModels()
  const filamentRolls = useFilamentRolls()
  const subscriptions = useSubscriptions()
  const settings = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [editSale, setEditSale] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const rollMap = Object.fromEntries(filamentRolls.map(r => [r.id, r]))
  const subMap = Object.fromEntries(subscriptions.map(s => [s.id, s]))
  const modelMap = Object.fromEntries(models.map(m => [m.id, m]))

  // Count models per subscription for amortization
  const modelsPerSub = {}
  for (const m of models) {
    if (m.subscriptionId) {
      modelsPerSub[m.subscriptionId] = (modelsPerSub[m.subscriptionId] || 0) + 1
    }
  }

  function getModelCost(modelId) {
    const model = modelMap[modelId]
    if (!model) return 0
    const roll = rollMap[model.filamentRollId]
    const costPerGram = roll ? roll.costPaid / roll.weightGrams : 0
    const filamentCost = computeFilamentCost(model.filamentGrams, costPerGram)
    const sub = subMap[model.subscriptionId]
    const monthlyCost = sub ? computeMonthlyCost(sub.cost, sub.billingCycle) : 0
    const amortized = sub ? computeAmortizedSubscriptionCost(monthlyCost, modelsPerSub[model.subscriptionId] || 1) : 0
    return computeTotalModelCost(filamentCost, amortized)
  }

  const fmt = v => formatCurrency(v, settings.currencySymbol)

  // Group by month
  const grouped = {}
  for (const sale of sales) {
    const key = formatMonthYear(sale.saleDatetime)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(sale)
  }

  function openEdit(sale) {
    setEditSale(sale)
    setFormOpen(true)
  }

  function openAdd() {
    setEditSale(null)
    setFormOpen(true)
  }

  const totalRevenue = sales.reduce((sum, s) => sum + (s.salePrice || 0), 0)
  const totalProfit = sales.reduce((sum, s) => sum + computeProfit(s.salePrice, getModelCost(s.modelId)), 0)

  return (
    <Box sx={{ p: 2 }}>
      {sales.length === 0 ? (
        <EmptyState
          icon={<PointOfSaleIcon />}
          title="No sales yet"
          message="Log your first sale to start tracking revenue and profit."
          actionLabel="Log Sale"
          onAction={openAdd}
        />
      ) : (
        <>
          {/* Summary */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>Revenue</Typography>
                  <Typography variant="h6" color="secondary.main">{fmt(totalRevenue)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>Profit</Typography>
                  <Typography variant="h6" color={totalProfit >= 0 ? 'secondary.main' : 'error.main'}>{fmt(totalProfit)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>Sales</Typography>
                  <Typography variant="h6">{sales.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Monthly groups */}
          {Object.entries(grouped).map(([month, monthSales]) => {
            const monthRevenue = monthSales.reduce((sum, s) => sum + (s.salePrice || 0), 0)
            return (
              <Box key={month} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {month}
                  </Typography>
                  <Typography variant="caption" color="secondary.main" fontWeight={600}>
                    {fmt(monthRevenue)}
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {monthSales.map(sale => {
                    const modelCost = getModelCost(sale.modelId)
                    const profit = computeProfit(sale.salePrice, modelCost)
                    const model = modelMap[sale.modelId]
                    return (
                      <Card key={sale.id}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={500} noWrap>
                                {model?.name || 'Unknown model'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.disabled">
                                  {formatDate(sale.saleDatetime)}
                                </Typography>
                                {sale.platform && (
                                  <Chip label={sale.platform} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                                )}
                              </Box>
                              {sale.notes && (
                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                                  {sale.notes}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ textAlign: 'right', ml: 2, flexShrink: 0 }}>
                              <Typography variant="body2" fontWeight={600}>{fmt(sale.salePrice)}</Typography>
                              <Typography variant="caption" color={profit >= 0 ? 'secondary.main' : 'error.main'}>
                                {profit >= 0 ? '+' : ''}{fmt(profit)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                            <IconButton size="small" onClick={() => openEdit(sale)}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setDeleteId(sale.id)}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    )
                  })}
                </Stack>
              </Box>
            )
          })}
        </>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 20 }} onClick={openAdd}>
        <AddIcon />
      </Fab>

      <SaleForm open={formOpen} onClose={() => setFormOpen(false)} editSale={editSale} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Sale?"
        message="This sale record will be permanently removed."
        onConfirm={async () => { await deleteSale(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  )
}
