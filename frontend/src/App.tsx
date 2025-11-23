// src/App.tsx
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, CssBaseline, ListItemButton } from '@mui/material';
import { Home, ShoppingCart, Logout, ReceiptLong, People, CalendarMonth, Security } from '@mui/icons-material';
import { OrderCalendarPage } from './pages/OrderCalendarPage';
import { Routes, Route, Link, Outlet } from 'react-router-dom';
import { ProductsPage } from './pages/ProductsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { OrdersPage } from './pages/OrdersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { ClientsPage } from './pages/ClientsPage';
import { AuditPage } from './pages/AuditPage';

const drawerWidth = 240;

/**
 * Componente do Layout Principal (Dashboard com menu)
 */
function DashboardLayout() {
  const auth = useAuth(); // 3. CHAME o hook de autenticação

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
          {/* Lista de navegação principal */}
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
            <ListItem key="Pedidos" disablePadding>
              <ListItemButton component={Link} to="/orders">
                <ListItemIcon>
                  <ReceiptLong />
                </ListItemIcon>
                <ListItemText primary="Pedidos" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Calendário" disablePadding>
              <ListItemButton component={Link} to="/calendar">
                <ListItemIcon><CalendarMonth /></ListItemIcon>
                <ListItemText primary="Calendário" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Clientes" disablePadding>
              <ListItemButton component={Link} to="/clients">
                <ListItemIcon>
                  <People />
                </ListItemIcon>
                <ListItemText primary="Clientes" />
              </ListItemButton>
            </ListItem>
            <ListItem key="Auditoria" disablePadding>
              <ListItemButton component={Link} to="/audit">
                <ListItemIcon>
                  <People />
                </ListItemIcon>
                <ListItemText primary="Auditoria" />
              </ListItemButton>
            </ListItem>
          </List>
          
          {/* Lista de Ações (Sair) */}
          <List sx={{ marginTop: 'auto' }}> {/* Empurra para o fundo */}
            <ListItem key="Sair" disablePadding>
              {/* 4. ADICIONE o botão Sair que chama auth.logout() */}
              <ListItemButton onClick={() => auth.logout()}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
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
      <Route path="/register" element={<RegisterPage />} />
      
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
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<NewOrderPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="calendar" element={<OrderCalendarPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}

export default App;
