import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { GoogleOAuthProvider } from '@react-oauth/google'
import theme from './theme'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Models from './pages/Models'
import ModelDetail from './pages/ModelDetail'
import Sales from './pages/Sales'
import FailedPrints from './pages/FailedPrints'
import Subscriptions from './pages/Subscriptions'
import Filament from './pages/Filament'
import Settings from './pages/Settings'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/models" element={<Models />} />
              <Route path="/models/:id" element={<ModelDetail />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/failures" element={<FailedPrints />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/filament" element={<Filament />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
