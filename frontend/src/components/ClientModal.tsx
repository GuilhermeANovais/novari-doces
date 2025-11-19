// src/components/ClientModal.tsx
import { Modal, Box, Typography, TextField, Button, Grid } from '@mui/material';
import { useState, useEffect } from 'react';
import api from '../api';
import { useForm, SubmitHandler } from 'react-hook-form';

interface ClientFormInputs {
  name: string;
  phone: string;
  address: string;
  birthday: string; // Novo campo
}

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  birthday?: string;
}

// Callback opcional para quando um cliente é criado com sucesso (útil para o Pedido)
type OnSuccessCallback = (newClient: Client) => void;

interface ClientModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void; // Recarrega a lista
  clientToEdit: Client | null;
  setSnackbar: any;
  onSuccess?: OnSuccessCallback; // Novo callback opcional
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export function ClientModal({ open, handleClose, onSave, clientToEdit, setSnackbar, onSuccess }: ClientModalProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ClientFormInputs>();

  useEffect(() => {
    if (clientToEdit) {
      setValue('name', clientToEdit.name);
      setValue('phone', clientToEdit.phone || '');
      setValue('address', clientToEdit.address || '');
      // Formata a data para o input type="date" (YYYY-MM-DD)
      if (clientToEdit.birthday) {
        const date = new Date(clientToEdit.birthday).toISOString().split('T')[0];
        setValue('birthday', date);
      }
    } else {
      reset({ name: '', phone: '', address: '', birthday: '' });
    }
  }, [clientToEdit, open, setValue, reset]);

const onSubmit: SubmitHandler<ClientFormInputs> = async (data) => {
    // 1. Preparação robusta dos dados
    // Se o campo estiver vazio ou for apenas espaços, envia undefined
    const clientData = {
      name: data.name,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      // Só tenta converter se existir data real
      birthday: data.birthday ? new Date(data.birthday).toISOString() : undefined,
    };

    console.log("Enviando dados:", clientData); // Log para debug

    try {
      let response;
      if (clientToEdit) {
        response = await api.patch(`/clients/${clientToEdit.id}`, clientData);
      } else {
        response = await api.post('/clients', clientData);
      }
      
      onSave(); 
      
      if (onSuccess && response.data) {
        onSuccess(response.data);
      }

      handleClose();
      setSnackbar({ open: true, message: 'Cliente salvo com sucesso!', severity: 'success' });

    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      
      // 2. Captura a mensagem de erro específica do Backend (NestJS)
      const serverMessage = error.response?.data?.message;
      
      // Se for um array de erros (comum no class-validator), junta eles
      const errorMessage = Array.isArray(serverMessage) 
        ? serverMessage.join(', ') 
        : (serverMessage || 'Erro desconhecido ao salvar.');

      console.log("MOTIVO DO ERRO:", errorMessage); // OLHE O CONSOLE DO NAVEGADOR

      setSnackbar({ open: true, message: `Erro: ${errorMessage}`, severity: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nome Completo"
            autoFocus
            {...register("name", { required: "Nome é obrigatório" })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Telefone"
            {...register("phone")}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Endereço"
            {...register("address")}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Data de Aniversário"
            type="date"
            InputLabelProps={{ shrink: true }} // Necessário para inputs de data
            {...register("birthday")}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}