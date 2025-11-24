// src/components/ProductModal.tsx
import { Modal, Box, Typography, TextField, Button, IconButton, useTheme } from '@mui/material';
// 1. Ícone Lucide
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api';

// Interface
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

// Tipo para a prop do snackbar
type SnackbarSetter = (state: {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null) => void;

// Props
interface ProductModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void;
  productToEdit: Product | null;
  setSnackbar: SnackbarSetter;
}

export function ProductModal({ open, handleClose, onSave, productToEdit, setSnackbar }: ProductModalProps) {
  const theme = useTheme();
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>(''); // Permite string vazia para UX
  const [description, setDescription] = useState('');

  // Estilo do Modal (Clean UI)
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 3, // Bordas arredondadas
    boxShadow: theme.shadows[1], // Sombra suave
    p: 4,
    outline: 'none',
  };

  // UseEffect para preencher o formulário
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setPrice(productToEdit.price);
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setPrice('');
      setDescription('');
    }
  }, [productToEdit, open]);

  // HandleSubmit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); 

    const productData = {
      name: name,
      price: Number(price),
      description: description,
    };

    try {
      if (productToEdit) {
        // MODO EDITAR (PATCH)
        await api.patch(`/products/${productToEdit.id}`, productData);
      } else {
        // MODO CRIAR (POST)
        await api.post('/products', productData);
      }
      
      onSave();     
      handleClose();
      setSnackbar({ open: true, message: 'Produto salvo com sucesso!', severity: 'success' });

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setSnackbar({ open: true, message: 'Erro ao salvar produto.', severity: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        {/* Cabeçalho com Botão Fechar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {productToEdit ? 'Editar Produto' : 'Novo Produto'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <X size={24} strokeWidth={1.5} />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="dense"
            required
            fullWidth
            label="Nome do Produto"
            name="name"
            autoFocus
            value={name} 
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            required
            fullWidth
            label="Preço (R$)"
            name="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            fullWidth
            label="Descrição"
            name="description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ borderRadius: 2, py: 1.2 }}
          >
            Salvar Produto
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}