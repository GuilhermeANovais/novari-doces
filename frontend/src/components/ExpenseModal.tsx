import { Modal, Box, Typography, TextField, Button, IconButton, useTheme, MenuItem } from '@mui/material';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api';
import { useForm, SubmitHandler } from 'react-hook-form';

interface ExpenseFormInputs {
  description: string;
  amount: number | string;
  category: string;
  date: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category?: string;
  date: string;
}

type SnackbarSetter = (state: {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null) => void;

interface ExpenseModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void;
  expenseToEdit: Expense | null;
  setSnackbar: SnackbarSetter;
}

export function ExpenseModal({ open, handleClose, onSave, expenseToEdit, setSnackbar }: ExpenseModalProps) {
  const theme = useTheme();
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ExpenseFormInputs>();

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

  useEffect(() => {
    if (open && expenseToEdit) {
      setValue('description', expenseToEdit.description);
      setValue('amount', expenseToEdit.amount);
      setValue('category', expenseToEdit.category || '');
      // Formata data para input (YYYY-MM-DD)
      const date = new Date(expenseToEdit.date).toISOString().split('T')[0];
      setValue('date', date);
    } else {
      reset({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
    }
  }, [expenseToEdit, open, setValue, reset]);

  const onSubmit: SubmitHandler<ExpenseFormInputs> = async (data) => {
    const expenseData = {
      description: data.description,
      amount: Number(data.amount),
      category: data.category,
      date: new Date(data.date).toISOString(),
    };

    try {
      if (expenseToEdit) {
        await api.patch(`/expenses/${expenseToEdit.id}`, expenseData);
      } else {
        await api.post('/expenses', expenseData);
      }
      
      onSave();
      handleClose();
      setSnackbar({ open: true, message: 'Despesa salva com sucesso!', severity: 'success' });

    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      setSnackbar({ open: true, message: 'Erro ao salvar despesa.', severity: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <X size={24} strokeWidth={1.5} />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            margin="dense"
            required
            fullWidth
            label="Descrição"
            {...register("description", { required: "Descrição é obrigatória" })}
            error={!!errors.description}
            helperText={errors.description?.message}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            required
            fullWidth
            label="Valor (R$)"
            type="number"
            {...register("amount", { required: "Valor é obrigatório", min: 0 })}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            select
            fullWidth
            label="Categoria"
            defaultValue=""
            inputProps={register("category")}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Ingredientes">Ingredientes</MenuItem>
            <MenuItem value="Embalagens">Embalagens</MenuItem>
            <MenuItem value="Contas Fixas">Contas Fixas (Luz/Água)</MenuItem>
            <MenuItem value="Equipamentos">Equipamentos</MenuItem>
            <MenuItem value="Outros">Outros</MenuItem>
          </TextField>

          <TextField
            margin="dense"
            fullWidth
            label="Data"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("date")}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ borderRadius: 2, py: 1.2 }}
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}