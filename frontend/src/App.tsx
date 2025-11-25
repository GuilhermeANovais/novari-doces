import { 
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, 
  ListItemText, ListItemIcon, CssBaseline, ListItemButton
} from '@mui/material';
// 1. Adicionei o ícone 'History'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  CalendarDays, 
  Users, 
  LogOut,
  ChefHat,
  History,
  KanbanSquare,
  Wallet,
} from 'lucide-react';
import { Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importe as páginas
import { ProductsPage } from './pages/ProductsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OrdersPage } from './pages/OrdersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { ClientsPage } from './pages/ClientsPage';
import { OrderCalendarPage } from './pages/OrderCalendarPage';
import { AuditPage } from './pages/AuditPage'; 
import { KanbanPage } from './pages/KanbanPage';
import { ExpensesPage } from './pages/ExpensesPage';

const drawerWidth = 240;

function DashboardLayout() {
  const auth = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItemStyle = (path: string) => ({
    borderRadius: 2,
    mx: 1, 
    mb: 0.5, 
    backgroundColor: isActive(path) ? '#e8f5e9' : 'transparent',
    color: isActive(path) ? '#1B5E20' : 'inherit',
    '&:hover': {
      backgroundColor: isActive(path) ? '#c8e6c9' : '#f5f5f5',
    },
  });

  const iconStyle = (path: string) => ({
    color: isActive(path) ? '#1B5E20' : '#757575',
    minWidth: 40,
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white', 
          color: '#1a1a1a', 
          boxShadow: 'none', 
          borderBottom: '1px solid #e0e0e0' 
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              bgcolor: '#1B5E20', 
              color: 'white', 
              p: 0.5, 
              borderRadius: 1, 
              display: 'flex' 
            }}>
              <ChefHat size={24} strokeWidth={1.5} />
            </Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', letterSpacing: '-0.5px' }}>
              Confeitaria Heaven
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#fff'
          },
        }}
      >
        <Toolbar /> 
        
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
          
          <List>
            
            {/* Dashboard */}
            <ListItem key="Dashboard" disablePadding>
              <ListItemButton component={Link} to="/" sx={menuItemStyle('/')}>
                <ListItemIcon sx={iconStyle('/')}>
                  <LayoutDashboard size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Dashboard" 
                  primaryTypographyProps={{ fontWeight: isActive('/') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>
            
            {/* Pedidos */}
            <ListItem key="Pedidos" disablePadding>
              <ListItemButton component={Link} to="/orders" sx={menuItemStyle('/orders')}>
                <ListItemIcon sx={iconStyle('/orders')}>
                  <Receipt size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Pedidos" 
                  primaryTypographyProps={{ fontWeight: isActive('/orders') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>

            {/* Calendário */}
            <ListItem key="Calendário" disablePadding>
              <ListItemButton component={Link} to="/calendar" sx={menuItemStyle('/calendar')}>
                <ListItemIcon sx={iconStyle('/calendar')}>
                  <CalendarDays size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Calendário" 
                  primaryTypographyProps={{ fontWeight: isActive('/calendar') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>

            {/* Produtos */}
            <ListItem key="Produtos" disablePadding>
              <ListItemButton component={Link} to="/products" sx={menuItemStyle('/products')}>
                <ListItemIcon sx={iconStyle('/products')}>
                  <ShoppingBag size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Produtos" 
                  primaryTypographyProps={{ fontWeight: isActive('/products') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>

            {/* Clientes */}
            <ListItem key="Clientes" disablePadding>
              <ListItemButton component={Link} to="/clients" sx={menuItemStyle('/clients')}>
                <ListItemIcon sx={iconStyle('/clients')}>
                  <Users size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Clientes" 
                  primaryTypographyProps={{ fontWeight: isActive('/clients') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>

            {/* 3. Auditoria (Link Restaurado) */}
            <ListItem key="Auditoria" disablePadding>
              <ListItemButton component={Link} to="/audit" sx={menuItemStyle('/audit')}>
                <ListItemIcon sx={iconStyle('/audit')}>
                  <History size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Auditoria" 
                  primaryTypographyProps={{ fontWeight: isActive('/audit') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>
            <ListItem key="Produção" disablePadding>
              <ListItemButton component={Link} to="/production" sx={menuItemStyle('/production')}>
                <ListItemIcon sx={iconStyle('/production')}>
                  <KanbanSquare size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText 
                  primary="Produção" 
                  primaryTypographyProps={{ fontWeight: isActive('/production') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
                />
              </ListItemButton>
            </ListItem>
            {/* Despesas */}
        <ListItem key="Despesas" disablePadding>
          <ListItemButton component={Link} to="/expenses" sx={menuItemStyle('/expenses')}>
            <ListItemIcon sx={iconStyle('/expenses')}>
              <Wallet size={20} strokeWidth={1.5} />
            </ListItemIcon>
            <ListItemText 
              primary="Despesas" 
              primaryTypographyProps={{ fontWeight: isActive('/expenses') ? 'bold' : 'medium', fontSize: '0.9rem' }} 
            />
          </ListItemButton>
        </ListItem>

          </List>
          
          {/* Botão Sair */}
          <List sx={{ marginTop: 'auto', mb: 1 }}>
            <ListItem key="Sair" disablePadding>
              <ListItemButton 
                onClick={() => auth.logout()}
                sx={{ 
                  borderRadius: 2, 
                  mx: 1,
                  color: '#d32f2f', 
                  '&:hover': { backgroundColor: '#ffebee' }
                }}
              >
                <ListItemIcon sx={{ color: '#d32f2f', minWidth: 40 }}>
                  <LogOut size={20} strokeWidth={1.5} />
                </ListItemIcon>
                <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'medium' }} />
              </ListItemButton>
            </ListItem>
          </List>

        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet /> 
      </Box>
    </Box>
  );
}

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
        <Route path="production" element={<KanbanPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
      </Route>
    </Routes>
  );
}

export default App;