import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Divider,
  Avatar,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import { useModel, deleteModel } from '../hooks/useModels'
import { useFilamentRoll } from '../hooks/useFilamentRolls'
import { useSubscription, useSubscriptions } from '../hooks/useSubscriptions'
import { useModels } from '../hooks/useModels'
import { useSalesByModel } from '../hooks/useSales'
import { useSettings } from '../hooks/useSettings'
import CostBreakdown from '../components/models/CostBreakdown'
import ModelForm from '../components/models/ModelForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import SaleForm from '../components/sales/SaleForm'
import { formatCurrency, formatDatetime } from '../utils/formatters'
import { computeFilamentCost, computeAmortizedSubscriptionCost, computeTotalModelCost, computeMonthlyCost, computeProfit } from '../utils/calculations'

export default function ModelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const model = useModel(id)
  const settings = useSettings()
  const filamentRoll = useFilamentRoll(model?.filamentRollId)
  const subscription = useSubscription(model?.subscriptionId)
  const allModels = useModels()
  const sales = useSalesByModel(model?.id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)

  if (!model) return null

  // Count models per subscription
  const modelsPerSub = allModels.filter(m => m.subscriptionId === model.subscriptionId).length || 1

  const costPerGram = filamentRoll ? filamentRoll.costPaid / filamentRoll.weightGrams : 0
  const filamentCost = computeFilamentCost(model.filamentGrams, costPerGram)
  const monthlyCost = subscription ? computeMonthlyCost(subscription.cost, subscription.billingCycle) : 0
  const amortized = subscription ? computeAmortizedSubscriptionCost(monthlyCost, modelsPerSub) : 0
  const totalCost = computeTotalModelCost(filamentCost, amortized)

  const fmt = v => formatCurrency(v, settings.currencySymbol)

  async function handleDelete() {
    await deleteModel(model.id)
    navigate('/models')
  }

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {/* Back + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate('/models')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={() => setEditOpen(true)} size="small">
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => setDeleteOpen(true)} size="small" color="error">
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Hero image + title */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3 }}>
        {model.imageDataUrl ? (
          <Box
            component="img"
            src={model.imageDataUrl}
            sx={{ width: 100, height: 100, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Avatar variant="rounded" sx={{ width: 100, height: 100, bgcolor: 'background.paper', fontSize: 40 }}>
            🖨️
          </Avatar>
        )}
        <Box>
          <Typography variant="h6">{model.name}</Typography>
          {model.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {model.description}
            </Typography>
          )}
          {filamentRoll && (
            <Chip
              label={`${filamentRoll.brand} ${filamentRoll.color} ${filamentRoll.material}`}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      </Box>

      {/* Cost breakdown */}
      <CostBreakdown
        model={model}
        filamentRoll={filamentRoll}
        subscription={subscription}
        modelCount={modelsPerSub}
        currencySymbol={settings.currencySymbol}
      />

      {/* Log a sale button */}
      <Button
        variant="contained"
        fullWidth
        startIcon={<PointOfSaleIcon />}
        sx={{ mt: 2 }}
        onClick={() => setSaleOpen(true)}
      >
        Log a Sale
      </Button>

      {/* Sales history */}
      {sales.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sales ({sales.length})
          </Typography>
          <Stack spacing={1}>
            {sales.map(sale => {
              const profit = computeProfit(sale.salePrice, totalCost)
              return (
                <Card key={sale.id}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2">{formatDatetime(sale.saleDatetime)}</Typography>
                        {sale.platform && (
                          <Typography variant="caption" color="text.disabled">{sale.platform}</Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={600}>{fmt(sale.salePrice)}</Typography>
                        <Typography variant="caption" color={profit >= 0 ? 'secondary.main' : 'error.main'}>
                          {profit >= 0 ? '+' : ''}{fmt(profit)} profit
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </Box>
      )}

      <ModelForm open={editOpen} onClose={() => setEditOpen(false)} editModel={model} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Model?"
        message={`Delete "${model.name}"? This will also delete all sales for this model.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <SaleForm open={saleOpen} onClose={() => setSaleOpen(false)} preselectedModelId={model.id} />
    </Box>
  )
}
