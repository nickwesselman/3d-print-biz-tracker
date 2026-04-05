import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import { useSettings } from '../hooks/useSettings'
import StatCard from '../components/common/StatCard'
import { formatCurrency } from '../utils/formatters'

export default function Dashboard() {
  const data = useDashboard()
  const settings = useSettings()
  const navigate = useNavigate()

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const fmt = v => formatCurrency(v, settings.currencySymbol)

  const {
    totalRevenue,
    netProfit,
    totalWasteCost,
    monthlySubCosts,
    monthlyData,
    topModels,
    totalSales,
    totalModels,
    totalFailures,
  } = data

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {/* Stat cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <StatCard
            label="Revenue"
            value={fmt(totalRevenue)}
            subtitle={`${totalSales} sales`}
            icon={<AttachMoneyIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            label="Net Profit"
            value={fmt(netProfit)}
            subtitle="after costs"
            icon={<TrendingUpIcon />}
            color={netProfit >= 0 ? 'secondary.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            label="Sub Costs"
            value={fmt(monthlySubCosts)}
            subtitle="per month"
            icon={<AccountBalanceWalletIcon />}
            color="primary.light"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            label="Waste"
            value={fmt(totalWasteCost)}
            subtitle={`${totalFailures} failures`}
            icon={<WarningAmberIcon />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Monthly chart */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Last 6 Months
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                formatter={(value) => [fmt(value)]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top models */}
      {topModels.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Top Models by Profit
            </Typography>
            <Stack spacing={1.5}>
              {topModels.map((m, i) => (
                <Box
                  key={m.id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                  onClick={() => navigate(`/models/${m.id}`)}
                >
                  <Typography variant="caption" color="text.disabled" sx={{ width: 16, textAlign: 'center' }}>
                    {i + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>{m.name}</Typography>
                    <Typography variant="caption" color="text.disabled">
                      {m.salesCount} sold
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="body2" color="secondary.main" fontWeight={600}>
                      {fmt(m.profit)}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {fmt(m.revenue)} rev
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Catalog
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="h6">{totalModels}</Typography>
              <Typography variant="caption" color="text.disabled">Models</Typography>
            </Box>
            <Box>
              <Typography variant="h6">{totalSales}</Typography>
              <Typography variant="caption" color="text.disabled">Sales</Typography>
            </Box>
            <Box>
              <Typography variant="h6" color={totalFailures > 0 ? 'warning.main' : 'text.primary'}>
                {totalFailures}
              </Typography>
              <Typography variant="caption" color="text.disabled">Failures</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
