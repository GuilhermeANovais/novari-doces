// src/components/ClientModal.tsx
import { 
  Modal, Box, Typography, TextField, Button, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, useTheme
} from '@mui/material';
// 1. Importe o ícone X da Lucide
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api';
import { useForm, SubmitHandler } from 'react-hook-form';

// Interfaces
interface ClientFormInputs {
  name: string;
  phone: string;
  address: string;
  birthday: string;
  notes: string;
}

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  birthday?: string;
  notes?: string;
}

interface ClientWithOrders extends Client {
  orders: {
    id: number;
    createdAt: string;
    total: number;
    status: string;
    items: {
      product: { name: string };
      quantity: number;
    }[];
  }[];
}

type SnackbarSetter = (state: {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null) => void;

interface ClientModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void;
  clientToEdit: Client | null;
  setSnackbar: SnackbarSetter;
  onSuccess?: (newClient: Client) => void;
}

export function ClientModal({ open, handleClose, onSave, clientToEdit, setSnackbar, onSuccess }: ClientModalProps) {
  const theme = useTheme();
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ClientFormInputs>();
  const [history, setHistory] = useState<ClientWithOrders | null>(null);

  // Estilo atualizado para o Modal (Sombra suave, bordas arredondadas)
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 600 },
    bgcolor: 'background.paper',
    borderRadius: 3, // Bordas mais arredondadas
    boxShadow: theme.shadows[1], // Sombra muito suave (definida no main.tsx)
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
    outline: 'none', // Remove a linha azul de foco do navegador
  };

  useEffect(() => {
    if (open && clientToEdit) {
      setValue('name', clientToEdit.name);
      setValue('phone', clientToEdit.phone || '');
      setValue('address', clientToEdit.address || '');
      setValue('notes', clientToEdit.notes || '');
      if (clientToEdit.birthday) {
        const date = new Date(clientToEdit.birthday).toISOString().split('T')[0];
        setValue('birthday', date);
      }

      api.get<ClientWithOrders>(`/clients/${clientToEdit.id}`)
        .then(res => setHistory(res.data))
        .catch(err => console.error("Erro ao buscar histórico:", err));

    } else {
      reset({ name: '', phone: '', address: '', birthday: '', notes: '' });
      setHistory(null);
    }
  }, [clientToEdit, open, setValue, reset]);

  const onSubmit: SubmitHandler<ClientFormInputs> = async (data) => {
    const clientData = {
      name: data.name,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      birthday: data.birthday ? new Date(data.birthday).toISOString() : undefined,
      notes: data.notes?.trim() || undefined,
    };

    try {
      let response;
      if (clientToEdit) {
        response = await api.patch(`/clients/${clientToEdit.id}`, clientData);
      } else {
        response = await api.post('/clients', clientData);
      }
      
      onSave();
      if (onSuccess && response.data) onSuccess(response.data);

      handleClose();
      setSnackbar({ open: true, message: 'Cliente salvo com sucesso!', severity: 'success' });
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setSnackbar({ open: true, message: 'Erro ao salvar cliente.', severity: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        {/* Cabeçalho do Modal com Ícone X */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {clientToEdit ? `Editar Cliente` : 'Novo Cliente'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <X size={24} strokeWidth={1.5} />
          </IconButton>
        </Box>

        {/* FORMULÁRIO */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            margin="dense" label="Nome Completo" fullWidth required
            {...register("name", { required: "Nome é obrigatório" })}
            error={!!errors.name} helperText={errors.name?.message}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense" label="Telefone" fullWidth
              {...register("phone")}
            />
            <TextField
              margin="dense" label="Aniversário" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              {...register("birthday")}
            />
          </Box>

          <TextField
            margin="dense" label="Endereço" fullWidth
            {...register("address")}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense" label="Preferências / Notas" fullWidth multiline rows={3}
            placeholder="Ex: Gosta de bolo menos doce; Alérgico a amendoim..."
            {...register("notes")}
            sx={{ mb: 3 }}
          />

          <Button type="submit" variant="contained" size="large" fullWidth sx={{ borderRadius: 2, py: 1.2 }}>
            Salvar Dados
          </Button>
        </Box>

        {/* HISTÓRICO DE PEDIDOS */}
        {clientToEdit && history && history.orders.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Histórico de Pedidos ({history.orders.length})
            </Typography>
            
            {/* Tabela com visual mais limpo */}
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 250, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600 }}>Resumo</TableCell>
                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Typography variant="body2" noWrap>
                          {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={order.status === 'CONCLUÍDO' ? 'success' : order.status === 'CANCELADO' ? 'error' : 'warning'} 
                          variant="outlined"
                          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        
        {clientToEdit && history && history.orders.length === 0 && (
           <Typography variant="body2" sx={{ mt: 3, fontStyle: 'italic', color: 'text.secondary', textAlign: 'center' }}>
             Este cliente ainda não realizou nenhum pedido.
           </Typography>
        )}
      </Box>
    </Modal>
  );
}