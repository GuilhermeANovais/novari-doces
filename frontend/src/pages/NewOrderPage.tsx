// src/pages/NewOrderPage.tsx
import {
  Box, Typography, Grid, Paper, List, ListItem, ListItemText, Button,
  CircularProgress, Divider, IconButton, Snackbar, Alert
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Interface Product
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

// Interface CartItem
interface CartItem extends Product {
  quantity: number;
}

// Tipo para o estado do snackbar
type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;

export function NewOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para o botão de finalizar
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const navigate = useNavigate();

  // Buscar produtos
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // --- LÓGICA DO CARRINHO ---
  // (handleAddToCart, handleRemoveFromCart, handleDeleteItem, total - sem alterações)
  const handleAddToCart = (productToAdd: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productToAdd.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...productToAdd, quantity: 1 }];
      }
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (!existingItem) return prevCart;
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const handleDeleteItem = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);
  
  // --- SUBMISSÃO DO PEDIDO ---

  // 1. IMPLEMENTE O handleFinishOrder
  const handleFinishOrder = async () => {
    setIsSubmitting(true);
    setSnackbar(null);

    // 2. Transforme o carrinho para o formato do DTO do backend
    const orderData = {
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      // 3. Envie para o backend
      await api.post('/orders', orderData);
      
      setSnackbar({ open: true, message: 'Pedido criado com sucesso!', severity: 'success' });
      setCart([]); // Limpe o carrinho
      
      // Redirecione para a lista de pedidos após 2 segundos
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      setSnackbar({ open: true, message: 'Erro ao finalizar pedido.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Função para fechar o snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  // --- JSX ---
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Criar Novo Pedido
      </Typography>
      
      <Grid container spacing={3}>
        {/* Coluna da Esquerda: Lista de Produtos */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white' }}>
            {/* ... (Lista de Produtos - sem alteração) ... */}
            <Typography variant="h6" gutterBottom>Produtos Disponíveis</Typography>
            {loadingProducts ? (
              <CircularProgress />
            ) : (
              <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {products.map((product) => (
                  <ListItem 
                    key={product.id}
                    divider
                    secondaryAction={
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleAddToCart(product)}
                      >
                        Adicionar
                      </Button>
                    }
                  >
                    <ListItemText 
                      primary={product.name}
                      secondary={`R$ ${product.price.toFixed(2)}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Coluna da Direita: Carrinho */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" gutterBottom>Carrinho</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* ... (Lista de Itens no Carrinho - sem alteração) ... */}
            <List sx={{ maxHeight: '40vh', overflow: 'auto' }}>
              {cart.length === 0 ? (
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  O carrinho está vazio.
                </Typography>
              ) : (
                cart.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText 
                      primary={item.name}
                      secondary={`Qtd: ${item.quantity} x R$ ${item.price.toFixed(2)}`}
                    />
                    <IconButton size="small" onClick={() => handleAddToCart(item)}>
                      <Add />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRemoveFromCart(item.id)}>
                      <Remove />
                    </IconButton>
                    <IconButton size="small" edge="end" onClick={() => handleDeleteItem(item.id)}>
                      <Delete color="error" />
                    </IconButton>
                  </ListItem>
                ))
              )}
            </List>

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Typography variant="h5">
              Total: R$ {total.toFixed(2)}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={cart.length === 0 || isSubmitting} // 5. Atualize o 'disabled'
              onClick={handleFinishOrder}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Finalizar Pedido"}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* 6. Adicione o Snackbar */}
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}