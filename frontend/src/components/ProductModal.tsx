// src/components/ProductModal.tsx
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { useState, useEffect } from 'react'; // 1. IMPORTE o useEffect
import api from '../api';

// Interface
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
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

// 2. ATUALIZE AS PROPS
interface ProductModalProps {
  open: boolean;
  handleClose: () => void;
  onSave: () => void;
  productToEdit: Product | null; // Aceite o produto para editar
}

export function ProductModal({ open, handleClose, onSave, productToEdit }: ProductModalProps) {
  // Estados do formulário
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');

  // 3. USE O useEffect PARA PREENCHER O FORMULÁRIO
  useEffect(() => {
    if (productToEdit) {
      // Se estamos editando, preencha os campos
      setName(productToEdit.name);
      setPrice(productToEdit.price);
      setDescription(productToEdit.description || ''); // (|| '') para evitar 'null'
    } else {
      // Se estamos criando, limpe os campos
      setName('');
      setPrice(0);
      setDescription('');
    }
  }, [productToEdit, open]); // Execute quando o modal abrir ou o produto mudar

  // 4. ATUALIZE O handleSubmit
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
      
      onSave();     // Avise a página para recarregar
      handleClose();  // Feche o modal
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        {/* 5. TÍTULO DINÂMICO */}
        <Typography variant="h6" component="h2">
          {productToEdit ? 'Editar Produto' : 'Novo Produto'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nome do Produto"
            name="name"
            autoFocus
            value={name} 
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Preço"
            name="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Descrição"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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