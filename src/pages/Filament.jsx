import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Fab,
  Chip,
  Grid,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InboxIcon from '@mui/icons-material/Inbox'
import { useFilamentRolls, deleteFilamentRoll } from '../hooks/useFilamentRolls'
import FilamentRollForm from '../components/filament/FilamentRollForm'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { useSettings } from '../hooks/useSettings'
import { formatCurrency } from '../utils/formatters'

export default function Filament() {
  const rolls = useFilamentRolls()
  const settings = useSettings()
  const [formOpen, setFormOpen] = useState(false)
  const [editRoll, setEditRoll] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  function openAdd() {
    setEditRoll(null)
    setFormOpen(true)
  }

  function openEdit(roll) {
    setEditRoll(roll)
    setFormOpen(true)
  }

  async function confirmDelete() {
    await deleteFilamentRoll(deleteId)
    setDeleteId(null)
  }

  return (
    <Box sx={{ p: 2 }}>
      {rolls.length === 0 ? (
        <EmptyState
          icon={<InboxIcon />}
          title="No filament rolls yet"
          message="Add your first roll to start calculating print costs."
          actionLabel="Add Roll"
          onAction={openAdd}
        />
      ) : (
        <Grid container spacing={2}>
          {rolls.map(roll => {
            const cpg = roll.weightGrams ? (roll.costPaid / roll.weightGrams).toFixed(4) : null
            return (
              <Grid item xs={12} sm={6} key={roll.id}>
                <Card>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1">{roll.brand}</Typography>
                        <Typography variant="body2" color="text.secondary">{roll.color}</Typography>
                      </Box>
                      <Chip label={roll.material} size="small" color="primary" variant="outlined" />
                    </Box>
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.disabled">Roll Weight</Typography>
                        <Typography variant="body2">{roll.weightGrams}g</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled">Cost Paid</Typography>
                        <Typography variant="body2">{formatCurrency(roll.costPaid, settings.currencySymbol)}</Typography>
                      </Box>
                      {cpg && (
                        <Box>
                          <Typography variant="caption" color="text.disabled">Per Gram</Typography>
                          <Typography variant="body2">{settings.currencySymbol}{cpg}/g</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => openEdit(roll)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(roll.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 20 }}
        onClick={openAdd}
      >
        <AddIcon />
      </Fab>

      <FilamentRollForm open={formOpen} onClose={() => setFormOpen(false)} editRoll={editRoll} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Filament Roll?"
        message="This will not delete any models, but their cost calculations will be affected."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  )
}
