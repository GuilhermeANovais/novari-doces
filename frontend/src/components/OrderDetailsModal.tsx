// src/components/OrderDetailsModal.tsx
import {
  Modal, Box, Typography, List, ListItem,
  ListItemText, Button, IconButton, CircularProgress, Tooltip, useTheme
} from '@mui/material';
import { X, Printer, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api';
import { FullOrder } from '../types/entities';

interface OrderDetailsModalProps {
  orderId: number | null;
  open: boolean;
  handleClose: () => void;
}

export function OrderDetailsModal({ orderId, open, handleClose }: OrderDetailsModalProps) {
  const theme = useTheme();
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Estilo do Modal (Clean UI)
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 600 },
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: theme.shadows[1],
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
    outline: 'none',
  };

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      setOrder(null);
      
      api.get<FullOrder>(`/orders/${orderId}`)
        .then(res => {
          setOrder(res.data);
        })
        .catch(err => {
          console.error("Erro ao buscar detalhes do pedido:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, orderId]);

  // --- Lógica de PDF ---
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

  // --- Lógica de WhatsApp ---
  const handleWhatsApp = () => {
    if (!order || !order.client || !order.client.phone) return;

    const phone = order.client.phone.replace(/\D/g, '');
    
    let message = `Olá ${order.client.name}, aqui é da Confeitaria Heaven! 🍰\n`;
    message += `Estamos a entrar em contacto sobre o pedido #${order.id}.\n\n`;

    if (order.status === 'PENDENTE') {
      // CORREÇÃO 1: Converter total para Number
      message += `Confirmamos a recepção! Valor total: R$ ${Number(order.total).toFixed(2)}.`;
      if (order.deliveryDate) {
        message += `\nPrevisão de entrega/retirada: ${new Date(order.deliveryDate).toLocaleString('pt-BR')}.`;
      }
    } else if (order.status === 'CONCLUÍDO') {
      message += `O seu pedido está pronto! 😋 Esperamos que goste.`;
    } else if (order.status === 'CANCELADO') {
      message += `O seu pedido foi cancelado. Caso tenha dúvidas, por favor responda a esta mensagem.`;
    }

    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!order) {
      return <Typography>Não foi possível carregar os detalhes do pedido.</Typography>;
    }

    return (
      <>
        {/* Header: Cliente e Ações */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Dados do Cliente</Typography>
          
          {order.client?.phone && (
            <Tooltip title="Enviar mensagem no WhatsApp">
              <Button 
                variant="outlined" 
                color="success" 
                size="small" 
                startIcon={<MessageCircle size={18} />}
                onClick={handleWhatsApp}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                WhatsApp
              </Button>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, mb: 3 }}>
          {order.client ? (
            <>
              <Typography variant="body1"><b>Nome:</b> {order.client.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}><b>Telefone:</b> {order.client.phone || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}><b>Endereço:</b> {order.client.address || 'N/A'}</Typography>
            </>
          ) : (
            <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Pedido interno (sem cliente associado)</Typography>
          )}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Detalhes do Pedido</Typography>
        
        <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2"><b>Status:</b> {order.status}</Typography>
          
          {order.deliveryDate && (
             <Typography variant="body2" sx={{ mt: 0.5 }}>
               <b>Data de Entrega:</b> {new Date(order.deliveryDate).toLocaleString('pt-BR')}
             </Typography>
          )}
          
          <Typography variant="body2" sx={{ mt: 0.5 }}><b>Observações:</b> {order.observations || 'Nenhuma'}</Typography>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Itens</Typography>
        
        <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          {order.items.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={<Typography fontWeight={500}>{item.product.name}</Typography>}
                // CORREÇÃO 2: Converter item.price para Number
                secondary={`${item.quantity}x R$ ${Number(item.price).toFixed(2)} un.`}
              />
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {/* CORREÇÃO 3: Converter item.price para Number antes da multiplicação */}
                R$ {(item.quantity * Number(item.price)).toFixed(2)}
              </Typography>
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 3 }}>
          <Typography variant="h5" color="primary.dark" sx={{ fontWeight: 'bold' }}>
            {/* CORREÇÃO 4: Converter order.total para Number */}
            Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.total))}
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={handlePrintPdf}
          startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <Printer size={20} />}
          fullWidth
          size="large"
          disabled={isPrinting}
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          {isPrinting ? 'A gerar PDF...' : 'Exportar para PDF'}
        </Button>
      </>
    );
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#1B5E20' }}>
            Pedido #{order?.id || orderId}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <X size={24} />
          </IconButton>
        </Box>
        
        {order && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Criado em: {new Date(order.createdAt).toLocaleString('pt-BR')}
          </Typography>
        )}
        
        {renderContent()}
      </Box>
    </Modal>
  );
}
