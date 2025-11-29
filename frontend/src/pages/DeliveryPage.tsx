import { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Button,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert,
} from '@mui/material';
import { 
  RefreshCw, Package, CreditCard, Banknote, QrCode, 
  ArrowRightLeft, PlusCircle 
} from 'lucide-react';
import api from '../api';
import { NoticeBoard } from '../components/NoticeBoard';

// Interfaces
interface DeliveryData {
  inventory: { 
    id: number; 
    name: string; 
    stockKitchen: number; 
    stockDelivery: number; 
  }[];
  orders: {
    id: number;
    total: number;
    paymentMethod: 'PIX' | 'DINHEIRO' | 'CARTAO';
    createdAt: string;
  }[];
}

export function DeliveryPage() {
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal de Stock
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'TRANSFER' | 'MANUAL_ENTRY'>('TRANSFER');
  const [selectedProduct, setSelectedProduct] = useState<{id: number, name: string} | null>(null);
  const [amount, setAmount] = useState<string>('');

  const fetchData = async () => {
    try {
      const response = await api.get('/orders/delivery/daily');
      setData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = (product: any, type: 'TRANSFER' | 'MANUAL_ENTRY') => {
    setSelectedProduct(product);
    setModalType(type);
    setAmount('');
    setModalOpen(true);
  };

  const handleSubmitStock = async () => {
    if (!selectedProduct || !amount) return;
    try {
      if (modalType === 'TRANSFER') {
        // Tira da Cozinha -> Põe no Delivery
        await api.post(`/products/${selectedProduct.id}/transfer`, { amount: parseInt(amount) });
      } else {
        // NOVA ROTA: Adiciona direto no Delivery (Compra)
        await api.post(`/products/${selectedProduct.id}/delivery-add`, { amount: parseInt(amount) });
      }
      
      setModalOpen(false);
      fetchData(); 
    } catch (error) {
      alert('Erro ao atualizar estoque.');
    }
  };

  const ordersByMethod = {
    PIX: data?.orders.filter(o => o.paymentMethod === 'PIX') || [],
    DINHEIRO: data?.orders.filter(o => o.paymentMethod === 'DINHEIRO') || [],
    CARTAO: data?.orders.filter(o => o.paymentMethod === 'CARTAO') || [],
  };

  const calculateTotal = (orders: any[]) => orders.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Setor de Delivery</Typography>
        <IconButton onClick={fetchData} color="primary" sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        
        {/* COLUNA 1: ESTOQUE E AÇÕES */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 1 }}>
              <Package size={20} />
              <Typography fontWeight="bold">Gestão de Estoque</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: '60vh' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#fff3e0', color: '#e65100' }}>Cozinha</TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#e8f5e9', color: '#1b5e20' }}>Delivery</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.inventory.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                      
                      {/* Estoque Cozinha */}
                      <TableCell align="center" sx={{ bgcolor: '#fff8e1', fontWeight: 'bold' }}>
                        {item.stockKitchen}
                      </TableCell>
                      
                      {/* Estoque Delivery (Disponível Venda) */}
                      <TableCell align="center" sx={{ bgcolor: '#f1f8e9', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {item.stockDelivery}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {/* BOTÃO 1: Entrada Manual (Compra Externa) */}
                          <IconButton 
                            size="small" 
                            sx={{ color: '#2e7d32', bgcolor: '#e8f5e9' }}
                            title="Entrada Manual (Compra Externa)"
                            onClick={() => handleOpenModal(item, 'MANUAL_ENTRY')}
                          >
                            <PlusCircle size={18} />
                          </IconButton>
                          
                          {/* BOTÃO 2: Transferir da Cozinha */}
                          <IconButton 
                            size="small" 
                            color="primary" 
                            title="Transferir da Cozinha"
                            onClick={() => handleOpenModal(item, 'TRANSFER')}
                          >
                            <ArrowRightLeft size={18} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* COLUNA 2: ESTATÍSTICAS E MURAL */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2} direction="column">
            
            {/* Cards de Vendas */}
            <Grid item><PaymentCard title="PIX" icon={<QrCode />} color="#00b8c5" orders={ordersByMethod.PIX} total={calculateTotal(ordersByMethod.PIX)} /></Grid>
            <Grid item><PaymentCard title="DINHEIRO" icon={<Banknote />} color="#16a34a" orders={ordersByMethod.DINHEIRO} total={calculateTotal(ordersByMethod.DINHEIRO)} /></Grid>
            <Grid item><PaymentCard title="CARTÃO" icon={<CreditCard />} color="#d32f2f" orders={ordersByMethod.CARTAO} total={calculateTotal(ordersByMethod.CARTAO)} /></Grid>
            
            {/* Mural de Avisos na Página de Delivery */}
            <Grid item sx={{ flexGrow: 1 }}>
               <Box sx={{ height: 350 }}>
                 <NoticeBoard />
               </Box>
            </Grid>

          </Grid>
        </Grid>

      </Grid>

      {/* MODAL DE AÇÕES */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle sx={{ bgcolor: modalType === 'TRANSFER' ? '#e3f2fd' : '#e8f5e9' }}>
          {modalType === 'TRANSFER' ? 'Puxar da Cozinha' : 'Entrada Manual (Compra)'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Produto: <b>{selectedProduct?.name}</b>
          </Typography>
          
          {modalType === 'TRANSFER' && (
             <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
               Isso irá diminuir o estoque da Cozinha e aumentar no Delivery.
             </Alert>
          )}
          {modalType === 'MANUAL_ENTRY' && (
             <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }}>
               Entrada direta no Delivery (não afeta Cozinha). Ex: Refrigerantes.
             </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Quantidade"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmitStock} variant="contained" color={modalType === 'TRANSFER' ? 'primary' : 'success'}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Componente visual dos cards
function PaymentCard({ title, icon, color, orders, total }: any) {
  return (
    <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', mb: 0 }}>
      <Box sx={{ p: 1.5, bgcolor: `${color}15`, borderBottom: `2px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: color }}>
          {icon} <Typography fontWeight="bold" variant="subtitle2">{title}</Typography>
        </Box>
        <Typography fontWeight="bold" variant="subtitle1" color={color}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </Typography>
      </Box>
    </Paper>
  );
}