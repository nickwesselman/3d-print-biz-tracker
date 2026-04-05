import { Chip } from '@mui/material'

export default function MarginChip({ margin }) {
  if (margin === null || margin === undefined) return null
  const pct = Number(margin).toFixed(0)
  const color = margin >= 50 ? 'success' : margin >= 20 ? 'warning' : 'error'
  return <Chip label={`${pct}% margin`} color={color} size="small" />
}
