// src/components/ClientModal.tsx
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import api from '../api';
import { useForm, SubmitHandler } from 'react-hook-form';

// Interface para os dados do formulário
interface ClientFormInputs {
  name: string;
  phone: string;
  address: string;
}

// Interface para o nosso Cliente (do backend)
interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

// Tipo para a prop do snackbar
type SnackbarSetter = (state: {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null) => void;

// Props
interface ClientModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void;
  clientToEdit: Client | null;
  setSnackbar: SnackbarSetter;
}

// Estilo
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

export function ClientModal({ open, handleClose, onSave, clientToEdit, setSnackbar }: ClientModalProps) {
  // Configuração do react-hook-form
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ClientFormInputs>();

  // Efeito para preencher o formulário ao editar
  useEffect(() => {
    if (clientToEdit) {
      // Preencha os campos com os dados do cliente
      setValue('name', clientToEdit.name);
      setValue('phone', clientToEdit.phone || '');
      setValue('address', clientToEdit.address || '');
    } else {
      // Limpe os campos ao criar um novo
      reset({ name: '', phone: '', address: '' });
    }
  }, [clientToEdit, open, setValue, reset]);

  // Função de envio
  const onSubmit: SubmitHandler<ClientFormInputs> = async (data) => {
    const clientData = {
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
    };

    try {
      if (clientToEdit) {
        // MODO EDITAR (PATCH)
        await api.patch(`/clients/${clientToEdit.id}`, clientData);
      } else {
        // MODO CRIAR (POST)
        await api.post('/clients', clientData);
      }
      
      onSave();     // Recarrega a tabela
      handleClose();  // Fecha o modal
      setSnackbar({ open: true, message: 'Cliente salvo com sucesso!', severity: 'success' });

    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      setSnackbar({ open: true, message: 'Erro ao salvar cliente.', severity: 'error' });
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