import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Fab,
  Stack,
  IconButton,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useFailedPrints, deleteFailedPrint } from '../hooks/useFailedPrints'
import { useModels } from '../hooks/useModels'
import { useFilamentRolls } from '../hooks/useFilamentRolls'
import { useSettings } from '../hooks/useSettings'
import FailureForm from '../components/failures/FailureForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function FailedPrints() {
  const failures = useFailedPrints()
  const models = useModels()
  const filamentRolls = useFilamentRolls()
  const settings = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [editFailure, setEditFailure] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const modelMap = Object.fromEntries(models.map(m => [m.id, m]))
  const rollMap = Object.fromEntries(filamentRolls.map(r => [r.id, r]))
  const fmt = v => formatCurrency(v, settings.currencySymbol)

  const totalWaste = failures.reduce((sum, f) => sum + (f.wastedCost || 0), 0)
  const totalGrams = failures.reduce((sum, f) => sum + (f.filamentWastedGrams || 0), 0)

  function openEdit(failure) {
    setEditFailure(failure)
    setFormOpen(true)
  }

  function openAdd() {
    setEditFailure(null)
    setFormOpen(true)
  }

  return (
    <Box sx={{ p: 2 }}>
      {failures.length === 0 ? (
        <EmptyState
          icon={<WarningAmberIcon />}
          title="No failed prints logged"
          message="Track failed prints to understand your true waste costs."
          actionLabel="Log Failure"
          onAction={openAdd}
        />
      ) : (
        <>
          {/* Summary */}
          <Card sx={{ mb: 2, borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>Total Waste</Typography>
                  <Typography variant="h6" color="error.main">{fmt(totalWaste)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>Filament Lost</Typography>
                  <Typography variant="h6">{totalGrams}g</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase' }}>Failures</Typography>
                  <Typography variant="h6">{failures.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Stack spacing={1.5}>
            {failures.map(f => {
              const model = modelMap[f.modelId]
              const roll = rollMap[f.filamentRollId]
              return (
                <Card key={f.id}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {model?.name || 'Unknown model'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatDate(f.failedAt)}
                          {roll && ` · ${roll.brand} ${roll.color}`}
                        </Typography>
                        {f.failureReason && (
                          <Box sx={{ mt: 0.5 }}>
                            <Chip label={f.failureReason} size="small" color="warning" variant="outlined" />
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right', ml: 2, flexShrink: 0 }}>
                        <Typography variant="body2" color="error.main" fontWeight={600}>
                          -{fmt(f.wastedCost)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {f.filamentWastedGrams}g wasted
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(f)}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(f.id)}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </>
      )}

      <Fab color="warning" sx={{ position: 'fixed', bottom: 80, right: 20 }} onClick={openAdd}>
        <AddIcon />
      </Fab>

      <FailureForm open={formOpen} onClose={() => setFormOpen(false)} editFailure={editFailure} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Failure Record?"
        message="This failure log will be permanently removed."
        onConfirm={async () => { await deleteFailedPrint(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  )
}
