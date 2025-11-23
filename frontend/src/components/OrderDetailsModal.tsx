import {
  Modal, Box, Typography, Divider, List, ListItem,
  ListItemText, Button, IconButton, CircularProgress, Tooltip
} from '@mui/material';
import { Close, Print, WhatsApp } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import api from '../api';
import { FullOrder } from '../types/entities'; // Certifique-se que este arquivo existe

interface OrderDetailsModalProps {
  orderId: number | null;
  open: boolean;
  handleClose: () => void;
}

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
  maxHeight: '90vh', // Garante que não ultrapasse a altura da tela
  overflowY: 'auto', // Adiciona scroll se necessário
};

export function OrderDetailsModal({ orderId, open, handleClose }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Busca os dados sempre que o ID mudar ou o modal abrir
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

    // Limpa o telefone (remove parênteses, traços, espaços)
    const phone = order.client.phone.replace(/\D/g, '');
    
    // Mensagem personalizada baseada no status
    let message = `Olá ${order.client.name}, aqui é da Confeitaria Heaven! 🍰\n`;
    message += `Estamos entrando em contato sobre o pedido #${order.id}.\n\n`;

    if (order.status === 'PENDENTE') {
      message += `Confirmamos o recebimento! Valor total: R$ ${order.total.toFixed(2)}.`;
      if (order.deliveryDate) {
        message += `\nPrevisão de entrega/retirada: ${new Date(order.deliveryDate).toLocaleString('pt-BR')}.`;
      }
    } else if (order.status === 'CONCLUÍDO') {
      message += `O seu pedido está pronto! 😋 Esperamos que goste.`;
    } else if (order.status === 'CANCELADO') {
      message += `O seu pedido foi cancelado. Caso tenha dúvidas, por favor responda a esta mensagem.`;
    }

    // Abre o link do WhatsApp Web/App
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
        {/* Cabeçalho Cliente + WhatsApp */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6">Cliente</Typography>
          
          {/* Botão WhatsApp só aparece se tiver telefone */}
          {order.client?.phone && (
            <Tooltip title="Enviar mensagem no WhatsApp">
              <Button 
                variant="outlined" 
                color="success" 
                size="small" 
                startIcon={<WhatsApp />}
                onClick={handleWhatsApp}
              >
                WhatsApp
              </Button>
            </Tooltip>
          )}
        </Box>

        {order.client ? (
          <Box sx={{ pl: 2, mt: 1 }}>
            <Typography><b>Nome:</b> {order.client.name}</Typography>
            <Typography><b>Telefone:</b> {order.client.phone || 'N/A'}</Typography>
            <Typography><b>Endereço:</b> {order.client.address || 'N/A'}</Typography>
          </Box>
        ) : (
          <Typography sx={{ pl: 2, fontStyle: 'italic' }}>Pedido interno (sem cliente associado)</Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Detalhes do Pedido */}
        <Typography variant="h6">Pedido</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography><b>Status:</b> {order.status}</Typography>
          
          {order.deliveryDate && (
             <Typography>
               <b>Data de Entrega:</b> {new Date(order.deliveryDate).toLocaleString('pt-BR')}
             </Typography>
          )}
          
          <Typography><b>Observações:</b> {order.observations || 'Nenhuma'}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Lista de Itens */}
        <Typography variant="h6">Itens Incluídos</Typography>
        <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1, mt: 1 }}>
          {order.items.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={`${item.quantity}x ${item.product.name}`}
                secondary={`R$ ${item.price.toFixed(2)} un.`}
              />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                R$ {(item.quantity * item.price).toFixed(2)}
              </Typography>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Total */}
        <Typography variant="h5" align="right" color="primary.dark" sx={{ fontWeight: 'bold' }}>
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
        </Typography>

        {/* Botão Exportar PDF */}
        <Button
          variant="contained"
          onClick={handlePrintPdf}
          startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <Print />}
          sx={{ mt: 3 }}
          fullWidth
          disabled={isPrinting}
        >
          {isPrinting ? 'Gerando PDF...' : 'Exportar para PDF'}
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
            Criado em: {new Date(order.createdAt).toLocaleString('pt-BR')}
          </Typography>
        )}
        
        {renderContent()}
      </Box>
    </Modal>
  );
}