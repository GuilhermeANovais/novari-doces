// src/components/OrderDetailsModal.tsx
import {
  Modal, Box, Typography, Divider, List, ListItem,
  ListItemText, Button, IconButton, CircularProgress
} from '@mui/material';
import { Close, Print } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import api from '../api';
import { FullOrder } from '../types/entities'; // 1. Use o tipo centralizado

// --- Props do Componente (Simplificadas) ---
interface OrderDetailsModalProps {
  orderId: number | null; // Recebe apenas o ID
  open: boolean;
  handleClose: () => void;
}

// --- Estilo (Sem alteração) ---
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

export function OrderDetailsModal({ orderId, open, handleClose }: OrderDetailsModalProps) {
  // 2. O Modal agora gere o seu próprio estado
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // 3. Efeito para buscar os dados quando o ID mudar
  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      setOrder(null); // Limpa o pedido anterior
      
      api.get<FullOrder>(`/orders/${orderId}`)
        .then(response => {
          setOrder(response.data);
        })
        .catch(err => {
          console.error("Erro ao buscar detalhes do pedido:", err);
          // Opcional: mostrar um estado de erro
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, orderId]); // Roda sempre que o modal abrir ou o ID mudar

  // 4. Lógica de PDF (Sem alteração, mas agora usa o 'order' do estado local)
  const handlePrintPdf = async () => {
    if (!order) return;
    setIsPrinting(true);
    try {
      const response = await api.get(`/orders/${order.id}/pdf`, {
        responseType: 'blob',
      });
      const contentDisposition = response.headers['content-disposition'];
      let filename = `pedido_${order.id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
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
    // ... (O JSX para Cliente, Pedido, Itens, Total e Botão PDF é o mesmo de antes) ...
    return (
      <>
        {/* Detalhes do Cliente */}
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
        {/* Detalhes do Pedido */}
        <Typography variant="h6">Pedido</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography><b>Status:</b> {order.status}</Typography>
          <Typography><b>Observações:</b> {order.observations || 'Nenhuma'}</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        {/* Itens do Pedido */}
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
        {/* Total */}
        <Typography variant="h5" align="right" color="primary.dark" sx={{ fontWeight: 'bold' }}>
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
        </Typography>
        {/* Botão PDF */}
        <Button
          variant="contained"
          onClick={handlePrintPdf}
          startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <Print />}
          sx={{ mt: 3 }}
          fullWidth
          disabled={isPrinting}
        >
          {isPrinting ? 'A gerar PDF...' : 'Exportar para PDF'}
        </Button>
      </>
    );
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" component="h2" color="primary">
            Detalhes do Pedido #{order?.id || orderId}
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