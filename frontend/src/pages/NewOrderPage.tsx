import {
  Box, Typography, Grid, Paper, List, ListItem, ListItemText, Button,
  CircularProgress, Divider, IconButton, Snackbar, Alert,
  TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Tooltip
} from '@mui/material';
import { Plus, Minus, Trash2, UserPlus, CreditCard } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ClientModal } from '../components/ClientModal';

// --- Interfaces ---
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Client {
  id: number;
  name: string;
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;

export function NewOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [observations, setObservations] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // CORREÇÃO 1: Ajustado valor inicial para bater com o Enum do Backend (DINHEIRO)
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const navigate = useNavigate();

  const fetchClients = useCallback(async () => {
    try {
      const clientResponse = await api.get('/clients');
      setClients(clientResponse.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const productResponse = await api.get('/products');
        setProducts(productResponse.data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
      fetchClients();
    }
    init();
  }, [fetchClients]);

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
    // CORREÇÃO 2: Converter price para Number antes de multiplicar
    return cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  }, [cart]);

  const handleFinishOrder = async () => {
    setIsSubmitting(true);
    setSnackbar(null);

    const orderData = {
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      clientId: selectedClientId || undefined,
      observations: observations || undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      paymentMethod: paymentMethod,
    };

    try {
      await api.post('/orders', orderData);
      setSnackbar({ open: true, message: 'Pedido criado com sucesso!', severity: 'success' });
      setCart([]);
      setObservations('');
      setSelectedClientId('');
      setDeliveryDate('');
      setPaymentMethod('DINHEIRO');

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

  const handleClientCreated = (newClient: any) => {
    fetchClients();
    setSelectedClientId(newClient.id);
  };

  const handleCloseSnackbar = () => setSnackbar(null);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
        Criar Novo Pedido
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={7}>
          <Paper
            elevation={0}
            sx={{ p: 2, backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 2 }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Produtos Disponíveis
            </Typography>
            {loadingProducts ? (
              <CircularProgress />
            ) : (
              <List sx={{ maxHeight: '65vh', overflow: 'auto' }}>
                {products.map((product) => (
                  <ListItem
                    key={product.id}
                    divider
                    secondaryAction={
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => handleAddToCart(product)}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Adicionar
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={product.name}
                      // CORREÇÃO 3: Converter para Number() aqui
                      secondary={`R$ ${Number(product.price).toFixed(2)}`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={12} lg={5}>
          <Paper
            elevation={0}
            sx={{ p: 3, backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 2 }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Detalhes do Pedido
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="client-select-label">Cliente (Opcional)</InputLabel>
                <Select
                  labelId="client-select-label"
                  value={selectedClientId}
                  label="Cliente (Opcional)"
                  onChange={(e: SelectChangeEvent<number | ''>) => setSelectedClientId(e.target.value)}
                  disabled={loadingClients}
                >
                  <MenuItem value="">
                    <em>Nenhum (Pedido interno)</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Tooltip title="Cadastrar Novo Cliente">
                <Button
                  variant="outlined"
                  sx={{ height: '56px', minWidth: '56px', borderRadius: 1 }}
                  onClick={() => setClientModalOpen(true)}
                >
                  <UserPlus size={24} strokeWidth={1.5} />
                </Button>
              </Tooltip>
            </Box>

            <TextField
              label="Data de Entrega/Retirada"
              type="datetime-local"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="payment-method-label">Forma de Pagamento</InputLabel>
              <Select
                labelId="payment-method-label"
                value={paymentMethod}
                label="Forma de Pagamento"
                onChange={(e) => setPaymentMethod(e.target.value)}
                startAdornment={
                  <Box sx={{ mr: 1, color: 'action.active', display: 'flex', alignItems: 'center' }}>
                    <CreditCard size={20} />
                  </Box>
                }
              >
                <MenuItem value="DINHEIRO">Dinheiro</MenuItem>
                <MenuItem value="PIX">PIX</MenuItem>
                <MenuItem value="CARTAO">Cartão</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Observações (Opcional)"
              multiline
              rows={2}
              fullWidth
              margin="normal"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />

            <Divider sx={{ mt: 3, mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Carrinho
            </Typography>

            <List sx={{ maxHeight: '30vh', overflow: 'auto' }}>
              {cart.length === 0 ? (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', py: 2, textAlign: 'center' }}>
                  O carrinho está vazio. Adicione produtos ao lado.
                </Typography>
              ) : (
                cart.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={item.name}
                      // CORREÇÃO 5: Converter para Number() no carrinho
                      secondary={`Qtd: ${item.quantity} x R$ ${Number(item.price).toFixed(2)}`}
                    />
                    <IconButton size="small" onClick={() => handleAddToCart(item)}>
                      <Plus size={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRemoveFromCart(item.id)}>
                      <Minus size={16} />
                    </IconButton>
                    <IconButton size="small" edge="end" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 size={18} color="#d32f2f" />
                    </IconButton>
                  </ListItem>
                ))
              )}
            </List>

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {/* CORREÇÃO 6: Converter o total para Number() */}
                R$ {Number(total).toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 1, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleFinishOrder}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Finalizar Pedido"}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <ClientModal
        open={clientModalOpen}
        handleClose={() => setClientModalOpen(false)}
        onSave={() => { }}
        onSuccess={handleClientCreated}
        clientToEdit={null}
        setSnackbar={setSnackbar}
      />

      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
