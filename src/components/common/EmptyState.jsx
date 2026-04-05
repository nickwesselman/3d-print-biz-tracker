import { Box, Typography, Button } from '@mui/material'

export default function EmptyState({ icon, title, message, actionLabel, onAction }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
      {icon && (
        <Box sx={{ color: 'text.disabled', mb: 2, '& svg': { fontSize: 56 } }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
          {message}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
