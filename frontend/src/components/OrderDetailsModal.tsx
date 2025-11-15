// src/components/OrderDetailsModal.tsx
import {
  Modal, Box, Typography, Divider, List, ListItem,
  ListItemText, Button, IconButton, CircularProgress
} from '@mui/material';
import { Close, Print } from '@mui/icons-material';
import { useState } from 'react'; // 1. Importe o useState
import api from '../api'; // 2. Importe o 'api'

// --- Interfaces Detalhadas ---
// ... (Interfaces FullOrder, OrderItem, etc. - sem alterações) ...
interface OrderItemProduct {
  name: string;
}
interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: OrderItemProduct;
}
interface OrderClient {
  name: string;
  phone?: string | null;
  address?: string | null;
}
export interface FullOrder {
  id: number;
  status: string;
  total: number;
  observations?: string | null;
  createdAt: string;
  client?: OrderClient | null;
  items: OrderItem[];
}

// --- Props do Componente ---
interface OrderDetailsModalProps {
  open: boolean;
  handleClose: () => void;
  order: FullOrder | null;
  loading: boolean;
}

// --- Estilo do Modal ---
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export function OrderDetailsModal({ open, order, handleClose, loading }: OrderDetailsModalProps) {
  // 3. Crie um estado de 'loading' para o botão de PDF
  const [isPrinting, setIsPrinting] = useState(false);

  // 4. Implemente a lógica de download do PDF
  const handlePrintPdf = async () => {
    if (!order) return;

    setIsPrinting(true);
    try {
      // Chame o endpoint, esperando uma 'blob' (ficheiro) como resposta
      const response = await api.get(`/orders/${order.id}/pdf`, {
        responseType: 'blob',
      });

      // Crie uma URL temporária para o ficheiro 'blob'
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      // Crie um link 'fantasma' para forçar o download
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `pedido_${order.id}.pdf`); // Nome do ficheiro
      document.body.appendChild(link);
      
      link.click(); // Simule o clique

      // Limpe o link e a URL
      link.parentNode?.removeChild(link);
      URL.revokeObjectURL(fileURL);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      // Futuro: Adicionar um snackbar de erro aqui
    } finally {
      setIsPrinting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!order) {
      return <Typography>Não foi possível carregar os detalhes do pedido.</Typography>;
    }

    return (
      <>
        {/* ... (Detalhes do Cliente, Pedido, Itens, Total - sem alterações) ... */}
        <Typography variant="h6">Cliente</Typography>
        {order.client ? (
          <Box sx={{ pl: 2 }}>
            <Typography><b>Nome:</b> {order.client.name}</Typography>
            <Typography><b>Telefone:</b> {order.client.phone || 'N/A'}</Typography>
            <Typography><b>Endereço:</b> {order.client.address || 'N/A'}</Typography>
          </Box>
        ) : (
          <Typography sx={{ pl: 2 }}>Pedido interno (sem cliente associado)</Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Pedido</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography><b>Status:</b> {order.status}</Typography>
          <Typography><b>Observações:</b> {order.observations || 'Nenhuma'}</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Itens Incluídos</Typography>
        <List dense sx={{ maxHeight: 200, overflow: 'auto', backgroundColor: '#f9f9f9', borderRadius: 1 }}>
          {order.items.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={`${item.quantity}x ${item.product.name}`}
                secondary={`R$ ${item.price.toFixed(2)} (unid.)`}
              />
              <Typography variant="body2">
                <b>Subtotal: R$ {(item.quantity * item.price).toFixed(2)}</b>
              </Typography>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" align="right" color="primary.dark" sx={{ fontWeight: 'bold' }}>
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
        </Typography>

        {/* 5. Atualize o botão de PDF */}
        <Button
          variant="contained"
          onClick={handlePrintPdf}
          startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <Print />}
          sx={{ mt: 3 }}
          fullWidth
          disabled={isPrinting} // Desabilite enquanto gera o PDF
        >
          {isPrinting ? 'A gerar PDF...' : 'Exportar para PDF'}
        </Button>
      </>
    );
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        {/* ... (Cabeçalho do Modal - sem alterações) ... */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" component="h2" color="primary">
            Detalhes do Pedido #{order?.id}
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
        {order && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {new Date(order.createdAt).toLocaleString('pt-BR')}
          </Typography>
        )}
        
        {renderContent()}
      </Box>
    </Modal>
  );
}