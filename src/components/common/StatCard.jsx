import { Card, CardContent, Typography, Box } from '@mui/material'

export default function StatCard({ label, value, subtitle, icon, color = 'primary.light' }) {
  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ color, fontWeight: 700, lineHeight: 1.2, mt: 0.25 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.disabled">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color, opacity: 0.6, '& svg': { fontSize: 28 } }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
