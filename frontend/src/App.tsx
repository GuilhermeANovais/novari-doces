import { useState } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, 
  ListItemText, ListItemIcon, CssBaseline, ListItemButton, IconButton 
} from '@mui/material';
import { 
  LayoutDashboard, ShoppingBag, Receipt, CalendarDays, Users, LogOut,
  ChefHat, History, Wallet, FileText, KanbanSquare, Settings, Menu as MenuIcon 
} from 'lucide-react';
import { Routes, Route, Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalSearch } from './components/GlobalSearch'; 

// --- PÁGINAS ---
import { LandingPage } from './pages/LandingPage'; // Nova Landing Page
import { ProductsPage } from './pages/ProductsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OrdersPage } from './pages/OrdersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { ClientsPage } from './pages/ClientsPage';
import { OrderCalendarPage } from './pages/OrderCalendarPage';
import { AuditPage } from './pages/AuditPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsHistoryPage } from './pages/ReportsHistoryPage';
import { KanbanPage } from './pages/KanbanPage';
import { SettingsPage } from './pages/SettingsPage';

const drawerWidth = 240;

function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Componente Auxiliar para itens do menu com verificação de Role
  const MenuLink = ({ to, icon, text, roles }: { to: string, icon: any, text: string, roles: string[] }) => {
    // Se não houver utilizador ou o cargo não for permitido, não renderiza
    if (user && !roles.includes(user.role)) return null;

    return (
      <ListItem disablePadding>
        <ListItemButton 
          component={Link} 
          to={to} 
          onClick={() => setMobileOpen(false)}
          sx={{
            borderRadius: 2, mx: 1, mb: 0.5,
            backgroundColor: isActive(to) ? '#e8f5e9' : 'transparent',
            color: isActive(to) ? '#1B5E20' : '#4b5563',
            '&:hover': {
              backgroundColor: isActive(to) ? '#c8e6c9' : '#f3f4f6', 
            },
          }}
        >
          <ListItemIcon sx={{ color: isActive(to) ? '#1B5E20' : '#9ca3af', minWidth: 40 }}>
            {icon}
          </ListItemIcon>
          <ListItemText primary={text} primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.9rem' }} />
        </ListItemButton>
      </ListItem>
    );
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
      <List>
        {/* --- MENU BASEADO EM CARGOS (ROLES) --- */}
        
        {/* Dashboard: Apenas Admin */}
        <MenuLink to="/" text="Dashboard" icon={<LayoutDashboard size={20} />} roles={['ADMIN']} />

        {/* Produção: Admin e Kitchen */}
        <MenuLink to="/production" text="Produção" icon={<KanbanSquare size={20} />} roles={['ADMIN', 'KITCHEN']} />

        {/* Pedidos e Calendário: Admin e Delivery */}
        <MenuLink to="/orders" text="Pedidos" icon={<Receipt size={20} />} roles={['ADMIN', 'DELIVERY']} />
        <MenuLink to="/calendar" text="Calendário" icon={<CalendarDays size={20} />} roles={['ADMIN', 'DELIVERY']} />

        {/* Gestão (Admin Only) */}
        <MenuLink to="/products" text="Produtos" icon={<ShoppingBag size={20} />} roles={['ADMIN']} />
        <MenuLink to="/clients" text="Clientes" icon={<Users size={20} />} roles={['ADMIN', 'DELIVERY']} />
        <MenuLink to="/expenses" text="Despesas" icon={<Wallet size={20} />} roles={['ADMIN']} />
        <MenuLink to="/history" text="Histórico" icon={<FileText size={20} />} roles={['ADMIN']} />
        <MenuLink to="/audit" text="Auditoria" icon={<History size={20} />} roles={['ADMIN']} />
      </List>
      
      <List sx={{ marginTop: 'auto', mb: 1 }}>
        <MenuLink to="/settings" text="Configurações" icon={<Settings size={20} />} roles={['ADMIN']} />
        
        <ListItem disablePadding>
          <ListItemButton 
            onClick={logout} 
            sx={{ 
              borderRadius: 2, mx: 1, color: '#d32f2f', 
              '&:hover': { backgroundColor: '#fee2e2' } 
            }}
          >
            <ListItemIcon sx={{ color: '#d32f2f', minWidth: 40 }}><LogOut size={20} /></ListItemIcon>
            <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'medium' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb' }}> 
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', color: '#1a1a1a', boxShadow: 'none', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: '#1B5E20', color: 'white', p: 0.5, borderRadius: 1, display: 'flex' }}><ChefHat size={24} strokeWidth={1.5} /></Box>
              <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', letterSpacing: '-0.5px', color: '#111827', display: { xs: 'none', md: 'block' } }}>
                Confeitaria Heaven
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', maxWidth: 500 }}>
            <GlobalSearch />
          </Box>
          <Box sx={{ minWidth: 40 }} />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          <Toolbar /> {drawerContent}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e5e7eb' } }} open>
          <Toolbar /> {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, overflowX: 'hidden' }}>
        <Toolbar /> 
        <Outlet /> 
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      {/* --- ROTAS PÚBLICAS --- */}
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* --- ROTAS PROTEGIDAS (APP) --- */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        
        {/* ROTA PRINCIPAL: Dashboard (Só Admin) */}
        <Route index element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* ROTAS COZINHA (Admin + Kitchen) */}
        <Route path="production" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'KITCHEN']}>
            <KanbanPage />
          </ProtectedRoute>
        } />

        {/* ROTAS COMUNS (Pedidos, Clientes) */}
        <Route path="orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'DELIVERY']}><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'DELIVERY']}><NewOrderPage /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute allowedRoles={['ADMIN', 'DELIVERY']}><ClientsPage /></ProtectedRoute>} />
        <Route path="calendar" element={<ProtectedRoute allowedRoles={['ADMIN', 'DELIVERY']}><OrderCalendarPage /></ProtectedRoute>} />

        {/* ROTAS ADMIN (Produtos, Financeiro, Auditoria) */}
        <Route path="products" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProductsPage /></ProtectedRoute>} />
        <Route path="expenses" element={<ProtectedRoute allowedRoles={['ADMIN']}><ExpensesPage /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportsHistoryPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
      </Route>

      {/* --- CATCH ALL: Redireciona para a Landing Page se a rota não existir --- */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
