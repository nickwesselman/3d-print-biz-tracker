import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import MenuIcon from '@mui/icons-material/Menu'
import SubscriptionsIcon from '@mui/icons-material/Subscriptions'
import InboxIcon from '@mui/icons-material/Inbox'
import SettingsIcon from '@mui/icons-material/Settings'
import CloseIcon from '@mui/icons-material/Close'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Models', icon: <ViewInArIcon />, path: '/models' },
  { label: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
  { label: 'Failures', icon: <WarningAmberIcon />, path: '/failures' },
  { label: 'More', icon: <MenuIcon />, path: null },
]

const DRAWER_ITEMS = [
  { label: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/subscriptions' },
  { label: 'Filament', icon: <InboxIcon />, path: '/filament' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/models': 'Models',
  '/sales': 'Sales',
  '/failures': 'Failed Prints',
  '/subscriptions': 'Subscriptions',
  '/filament': 'Filament',
  '/settings': 'Settings',
}

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const currentPath = location.pathname
  const pageTitle =
    PAGE_TITLES[currentPath] ||
    (currentPath.startsWith('/models/') ? 'Model Detail' : 'PrintBiz')

  const navValue = NAV_ITEMS.findIndex(item => item.path === currentPath)

  function handleNavChange(_, newValue) {
    const item = NAV_ITEMS[newValue]
    if (item.path === null) {
      setDrawerOpen(true)
    } else {
      navigate(item.path)
    }
  }

  function handleDrawerNav(path) {
    setDrawerOpen(false)
    navigate(path)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', bgcolor: 'background.default' }}>
      {/* Top AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 52 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.light', letterSpacing: '-0.5px' }}>
            {pageTitle}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 1 }}>
        <Outlet />
      </Box>

      {/* Bottom navigation */}
      <BottomNavigation value={navValue >= 0 ? navValue : false} onChange={handleNavChange} showLabels>
        {NAV_ITEMS.map(item => (
          <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>

      {/* More drawer */}
      <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, bgcolor: 'background.paper' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">More</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {DRAWER_ITEMS.map(item => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={() => handleDrawerNav(item.path)} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ color: 'primary.light', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ pb: 2 }} />
      </Drawer>
    </Box>
  )
}
