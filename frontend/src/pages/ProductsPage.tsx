// src/pages/ProductsPage.tsx
import { Box, Typography, Button, IconButton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete, Edit } from '@mui/icons-material'; // 1. IMPORTE O Edit
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ProductModal } from '../components/ProductModal';

// Interface
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openModal, setOpenModal] = useState(false);

  // 2. CRIE O ESTADO PARA GUARDAR O PRODUTO A SER EDITADO
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // 3. ATUALIZE AS FUNÇÕES DE ABRIR/FECHAR MODAL
  const handleOpenModal = (product: Product | null) => {
    setProductToEdit(product); // Se for null, é um "Novo Produto"
    setOpenModal(true);      // Se for um produto, é "Editar Produto"
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setProductToEdit(null); // Limpa a seleção ao fechar
  };

  // Função para buscar os dados
  async function fetchProducts() {
    try {
      const response = await axios.get('http://localhost:3000/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }

  // Função de deletar
  async function handleDelete(id: number) {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await axios.delete(`http://localhost:3000/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
      }
    }
  }

  // 4. ATUALIZE AS COLUNAS
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Nome', width: 200 },
    { field: 'price', headerName: 'Preço', width: 130, type: 'number' },
    { field: 'description', headerName: 'Descrição', flex: 1 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120, // Aumente a largura
      sortable: false,
      renderCell: (params) => {
        return (
          <Box>
            {/* Botão de Editar */}
            <IconButton 
              onClick={() => handleOpenModal(params.row)} // Passa o produto
              color="primary"
            >
              <Edit />
            </IconButton>
            {/* Botão de Deletar */}
            <IconButton 
              onClick={() => handleDelete(params.row.id)} 
              color="error"
            >
              <Delete />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  // useEffect
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Produtos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenModal(null)} // "null" significa "Novo Produto"
        >
          Novo Produto
        </Button>
      </Box>

      {/* --- TABELA DE DADOS --- */}
      <Box sx={{ height: 400, width: '100%', backgroundColor: 'white' }}>
        <DataGrid
          rows={products}
          columns={columns}
          pageSizeOptions={[5, 10]}
        />
      </Box>

      {/* 5. PASSE O NOVO ESTADO PARA O MODAL */}
      <ProductModal
        open={openModal}
        handleClose={handleCloseModal}
        onSave={fetchProducts}
        productToEdit={productToEdit} // Passe o produto para o modal
      />
    </Box>
  );
}