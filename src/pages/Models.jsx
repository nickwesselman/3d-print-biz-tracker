import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Fab, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { useModels } from '../hooks/useModels'
import { useFilamentRolls } from '../hooks/useFilamentRolls'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useSettings } from '../hooks/useSettings'
import ModelCard from '../components/models/ModelCard'
import ModelForm from '../components/models/ModelForm'
import EmptyState from '../components/common/EmptyState'

export default function Models() {
  const navigate = useNavigate()
  const models = useModels()
  const filamentRolls = useFilamentRolls()
  const subscriptions = useSubscriptions()
  const settings = useSettings()
  const [formOpen, setFormOpen] = useState(false)

  // Count models per subscription for amortization
  const modelsPerSub = {}
  for (const m of models) {
    if (m.subscriptionId) {
      modelsPerSub[m.subscriptionId] = (modelsPerSub[m.subscriptionId] || 0) + 1
    }
  }

  const rollMap = Object.fromEntries(filamentRolls.map(r => [r.id, r]))
  const subMap = Object.fromEntries(subscriptions.map(s => [s.id, s]))

  return (
    <Box sx={{ p: 2 }}>
      {models.length === 0 ? (
        <EmptyState
          icon={<ViewInArIcon />}
          title="No models yet"
          message="Add your first model to start tracking costs and margins."
          actionLabel="Add Model"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <Stack spacing={1.5}>
          {models.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              filamentRoll={rollMap[model.filamentRollId]}
              subscription={subMap[model.subscriptionId]}
              modelCount={modelsPerSub[model.subscriptionId] || 1}
              currencySymbol={settings.currencySymbol}
              onClick={() => navigate(`/models/${model.id}`)}
            />
          ))}
        </Stack>
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 20 }}
        onClick={() => setFormOpen(true)}
      >
        <AddIcon />
      </Fab>

      <ModelForm open={formOpen} onClose={() => setFormOpen(false)} editModel={null} />
    </Box>
  )
}
