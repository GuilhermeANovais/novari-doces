import { 
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, 
  ListItemText, ListItemIcon, CssBaseline, ListItemButton, useTheme 
} from '@mui/material';
// 1. Ícones da Lucide
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  CalendarDays, 
  Users, 
  LogOut,
  ChefHat
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

const drawerWidth = 240;

/**
 * Componente do Layout Principal (Dashboard com menu lateral)
 */
function DashboardLayout() {
  const auth = useAuth();
  const location = useLocation(); // Para saber em qual página estamos
  const theme = useTheme();

  // Função auxiliar para verificar se o link está ativo
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Estilo base para os botões do menu
  const menuItemStyle = (path: string) => ({
    borderRadius: 2,
    mx: 1, // Margem horizontal para não colar na borda
    mb: 0.5, // Espaço entre itens
    backgroundColor: isActive(path) ? '#e8f5e9' : 'transparent', // Verde claro se ativo
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
      
      {/* Barra Superior (Flat Style) */}
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white', // Fundo Branco
          color: '#1a1a1a', // Texto Escuro
          boxShadow: 'none', // Sem sombra
          borderBottom: '1px solid #e0e0e0' // Borda sutil
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

      {/* Menu Lateral (Sidebar) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0', // Borda sutil
            backgroundColor: '#fff'
          },
        }}
      >
        <Toolbar /> {/* Espaçador para o AppBar */}
        
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
          
          {/* Lista de navegação principal */}
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

          </List>
          
          {/* Botão Sair (no fundo do menu) */}
          <List sx={{ marginTop: 'auto', mb: 1 }}>
            <ListItem key="Sair" disablePadding>
              <ListItemButton 
                onClick={() => auth.logout()}
                sx={{ 
                  borderRadius: 2, 
                  mx: 1,
                  color: '#d32f2f', // Vermelho para sair
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

      {/* Área de Conteúdo Principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet /> 
      </Box>
    </Box>
  );
}

/**
 * Componente Principal do App (Roteamento)
 */
function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Rotas Protegidas (Dentro do Layout) */}
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
      </Route>
    </Routes>
  );
}

export default App;