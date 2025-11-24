// src/pages/ProductsPage.tsx
import { Box, Typography, Button, IconButton, Snackbar, Alert, Paper } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
// 1. Novos ícones Lucide
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api';
import { ProductModal } from '../components/ProductModal';

// Interface
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [loading, setLoading] = useState(true);

  const handleOpenModal = (product: Product | null) => {
    setProductToEdit(product);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setProductToEdit(null);
  };

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setSnackbar({ open: true, message: 'Erro ao buscar produtos.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts(); 
        setSnackbar({ open: true, message: 'Produto deletado com sucesso!', severity: 'success' });
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        setSnackbar({ open: true, message: 'Erro ao deletar produto.', severity: 'error' });
      }
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nome', width: 200 },
    { 
      field: 'price', 
      headerName: 'Preço', 
      width: 130, 
      type: 'number',
      valueFormatter: (value) => {
        if (value == null) return '';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      }
    },
    { field: 'description', headerName: 'Descrição', flex: 1 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box>
            {/* Botão Editar */}
            <IconButton 
              onClick={() => handleOpenModal(params.row)}
              color="primary"
            >
              <Pencil size={18} strokeWidth={1.5} />
            </IconButton>
            
            {/* Botão Deletar */}
            <IconButton 
              onClick={() => handleDelete(params.row.id)} 
              color="error"
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
          Produtos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          // Ícone Plus
          startIcon={<Plus size={20} strokeWidth={1.5} />}
          onClick={() => handleOpenModal(null)}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Novo Produto
        </Button>
      </Box>

      {/* Container da Tabela com estilo Flat */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 500, 
          width: '100%', 
          backgroundColor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: 2 
        }}
      >
        <DataGrid
          rows={products}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 20]}
          sx={{ border: 'none' }} // Remove a borda interna da DataGrid para usar a do Paper
        />
      </Paper>

      <ProductModal
        open={openModal}
        handleClose={handleCloseModal}
        onSave={fetchProducts}
        productToEdit={productToEdit}
        setSnackbar={setSnackbar}
      />

      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}