// src/App.tsx
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, CssBaseline } from '@mui/material';
import { Home, ShoppingCart } from '@mui/icons-material';
import { ProductsPage } from './pages/ProductsPage';

// Largura do nosso menu lateral
const drawerWidth = 240;

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Reseta o CSS padrão */}
      <CssBaseline />

      {/* --- BARRA SUPERIOR (APPBAR) --- */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} // Garante que fique acima do menu
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Heaven
          </Typography>
        </Toolbar>
      </AppBar>

      {/* --- MENU LATERAL (DRAWER) --- */}
      <Drawer
        variant="permanent" // Deixa o menu sempre visível
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* Espaçador para o menu não ficar embaixo do AppBar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button key="Dashboard">
              <ListItemIcon>
                <Home />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem button key="Produtos">
              <ListItemIcon>
                <ShoppingCart />
              </ListItemIcon>
              <ListItemText primary="Produtos" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Espaçador */}
        
        {/* 2. Substitua o "Bem-vindo" pela nossa página de produtos */}
        <ProductsPage />

      </Box>

    </Box>
  );
}

export default App;