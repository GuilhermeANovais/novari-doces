// src/components/EditOrderModal.tsx
import { 
  Modal, Box, Typography, TextField, Button, FormControl, 
  InputLabel, Select, MenuItem, CircularProgress, IconButton, useTheme
} from '@mui/material';
// 1. Ícone Lucide
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import api from '../api';
import { OrderSummary } from '../types/entities';

interface EditOrderFormInputs {
  clientId: string | number;
  deliveryDate: string;
  observations: string;
}

interface EditOrderModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void;
  order: OrderSummary | null;
  setSnackbar: any;
}

export function EditOrderModal({ open, handleClose, onSave, order, setSnackbar }: EditOrderModalProps) {
  const theme = useTheme();
  const { register, handleSubmit, setValue } = useForm<EditOrderFormInputs>();
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Estilo do Modal (Clean UI)
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: theme.shadows[1],
    p: 4,
    outline: 'none',
  };

  // Carrega clientes e preenche formulário
  useEffect(() => {
    if (open && order) {
      setLoadingClients(true);
      api.get('/clients').then(res => {
        setClients(res.data);
      }).finally(() => setLoadingClients(false));

      setValue('clientId', order.client?.id || '');
      setValue('observations', (order as any).observations || '');
      
      if (order.deliveryDate) {
        const date = new Date(order.deliveryDate).toISOString().slice(0, 16);
        setValue('deliveryDate', date);
      } else {
        setValue('deliveryDate', '');
      }
    }
  }, [open, order, setValue]);

  const onSubmit: SubmitHandler<EditOrderFormInputs> = async (data) => {
    if (!order) return;

    const updateData = {
      clientId: data.clientId ? Number(data.clientId) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString() : null,
      observations: data.observations,
    };

    try {
      await api.patch(`/orders/${order.id}`, updateData);
      setSnackbar({ open: true, message: 'Pedido atualizado com sucesso!', severity: 'success' });
      onSave();
      handleClose();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setSnackbar({ open: true, message: 'Erro ao atualizar pedido.', severity: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        {/* Cabeçalho com Fechar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            Editar Pedido #{order?.id}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <X size={24} strokeWidth={1.5} />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          
          <FormControl fullWidth margin="normal">
            <InputLabel shrink>Cliente</InputLabel>
            <Select
              label="Cliente"
              native
              defaultValue=""
              disabled={loadingClients}
              {...register("clientId")}
              sx={{ borderRadius: 1 }}
            >
              <option value="">Sem Cliente (Interno)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            fullWidth
            label="Data de Entrega"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            {...register("deliveryDate")}
            sx={{ borderRadius: 1 }}
          />

          <TextField
            margin="normal"
            fullWidth
            label="Observações"
            multiline
            rows={3}
            {...register("observations")}
            sx={{ borderRadius: 1 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, borderRadius: 2, py: 1.2 }}
          >
            Salvar Alterações
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}