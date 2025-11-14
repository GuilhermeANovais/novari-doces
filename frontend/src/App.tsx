// src/App.tsx
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, CssBaseline, ListItemButton } from '@mui/material';
import { Home, ShoppingCart } from '@mui/icons-material';
import { Routes, Route, Link, Outlet } from 'react-router-dom'; // 1. Importe Outlet

// Importe as páginas
import { ProductsPage } from './pages/ProductsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage'; // 2. Importe a LoginPage
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const drawerWidth = 240;

/**
 * Componente do Layout Principal (Dashboard com menu)
 */
function DashboardLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Confeitaria
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem key="Dashboard" disablePadding>
              <ListItemButton component={Link} to="/">
                <ListItemIcon><Home /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Produtos" disablePadding>
              <ListItemButton component={Link} to="/products">
                <ListItemIcon><ShoppingCart /></ListItemIcon>
                <ListItemText primary="Produtos" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {/* 3. O Outlet renderiza a rota "filha" (Dashboard ou Produtos) */}
        <Outlet /> 
      </Box>
    </Box>
  );
}


/**
 * Componente Principal do App
 */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} /> {/* 2. Adicione a rota */}
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
