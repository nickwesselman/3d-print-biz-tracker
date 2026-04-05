import { Card, CardContent, CardActionArea, Box, Typography, Avatar } from '@mui/material'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { computeFilamentCost, computeAmortizedSubscriptionCost, computeTotalModelCost, computeMargin, computeMonthlyCost, formatPrintTime } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import MarginChip from '../common/MarginChip'

export default function ModelCard({ model, filamentRoll, subscription, modelCount, currencySymbol, onClick }) {
  const costPerGram = filamentRoll ? filamentRoll.costPaid / filamentRoll.weightGrams : 0
  const filamentCost = computeFilamentCost(model.filamentGrams, costPerGram)
  const monthlyCost = subscription ? computeMonthlyCost(subscription.cost, subscription.billingCycle) : 0
  const amortized = subscription ? computeAmortizedSubscriptionCost(monthlyCost, modelCount || 1) : 0
  const totalCost = computeTotalModelCost(filamentCost, amortized)
  const margin = computeMargin(model.defaultSalePrice, totalCost)

  const fmt = v => formatCurrency(v, currencySymbol)

  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar
              src={model.imageDataUrl || undefined}
              variant="rounded"
              sx={{ width: 56, height: 56, bgcolor: 'background.default', flexShrink: 0 }}
            >
              <ViewInArIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="subtitle1" noWrap>{model.name}</Typography>
                <MarginChip margin={margin} />
              </Box>
              {model.description && (
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                  {model.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.disabled">Cost</Typography>
                  <Typography variant="body2">{fmt(totalCost)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled">Sale</Typography>
                  <Typography variant="body2">{fmt(model.defaultSalePrice)}</Typography>
                </Box>
                {model.printTimeMinutes > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.disabled">Print time</Typography>
                    <Typography variant="body2">{formatPrintTime(model.printTimeMinutes)}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
