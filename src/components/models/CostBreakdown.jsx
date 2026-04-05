import { Box, Typography, Divider, LinearProgress } from '@mui/material'
import { formatCurrency } from '../../utils/formatters'
import { computeFilamentCost, computeAmortizedSubscriptionCost, computeTotalModelCost, computeMargin, computeMonthlyCost, formatPrintTime } from '../../utils/calculations'

function Row({ label, value, currencySymbol, highlight }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" color={highlight ? 'text.primary' : 'text.secondary'} fontWeight={highlight ? 600 : 400}>
        {label}
      </Typography>
      <Typography variant="body2" color={highlight ? 'text.primary' : 'text.secondary'} fontWeight={highlight ? 600 : 400}>
        {value}
      </Typography>
    </Box>
  )
}

export default function CostBreakdown({ model, filamentRoll, subscription, modelCount, currencySymbol = '$' }) {
  const fmt = v => formatCurrency(v, currencySymbol)

  const costPerGram = filamentRoll ? filamentRoll.costPaid / filamentRoll.weightGrams : 0
  const filamentCost = computeFilamentCost(model.filamentGrams, costPerGram)
  const monthlyCost = subscription ? computeMonthlyCost(subscription.cost, subscription.billingCycle) : 0
  const amortized = subscription ? computeAmortizedSubscriptionCost(monthlyCost, modelCount || 1) : 0
  const totalCost = computeTotalModelCost(filamentCost, amortized)
  const margin = computeMargin(model.defaultSalePrice, totalCost)
  const profit = model.defaultSalePrice - totalCost

  const marginColor = margin >= 50 ? '#10b981' : margin >= 20 ? '#f59e0b' : '#ef4444'

  return (
    <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Cost Breakdown
      </Typography>

      <Row
        label={`Filament (${model.filamentGrams}g × ${currencySymbol}${costPerGram.toFixed(4)}/g)`}
        value={fmt(filamentCost)}
        currencySymbol={currencySymbol}
      />

      {subscription && (
        <Row
          label={`${subscription.name} (÷ ${modelCount || 1} models)`}
          value={fmt(amortized)}
          currencySymbol={currencySymbol}
        />
      )}

      <Divider sx={{ my: 0.5 }} />

      <Row label="Total Cost" value={fmt(totalCost)} currencySymbol={currencySymbol} highlight />
      <Row label="Sale Price" value={fmt(model.defaultSalePrice)} currencySymbol={currencySymbol} highlight />

      <Box sx={{ mt: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Margin</Typography>
          <Typography variant="body2" fontWeight={700} sx={{ color: marginColor }}>
            {margin.toFixed(1)}% ({fmt(profit)} profit)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(margin, 0), 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'background.paper',
            '& .MuiLinearProgress-bar': { bgcolor: marginColor, borderRadius: 3 },
          }}
        />
      </Box>

      {model.printTimeMinutes > 0 && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Print time: <strong>{formatPrintTime(model.printTimeMinutes)}</strong>
            <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
              (printer opportunity cost)
            </Typography>
          </Typography>
        </Box>
      )}
    </Box>
  )
}
