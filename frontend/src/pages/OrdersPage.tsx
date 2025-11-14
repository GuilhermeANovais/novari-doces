// src/pages/OrdersPage.tsx
import {
  Box, Typography, Button, CircularProgress, Select, MenuItem,
  SelectChangeEvent, Snackbar, Alert, IconButton
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

// Interface para um item de pedido (aninhado)
interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

// Interface para o usuário (aninhado)
interface OrderUser {
  name: string | null;
  email: string;
}

// Interface principal do Pedido
interface Order {
  id: number;
  createdAt: string;
  status: string;
  total: number;
  user: OrderUser;
  items: OrderItem[];
}

// Tipo para o estado do snackbar
type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;


export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const navigate = useNavigate();

  // Função para buscar os pedidos
  async function fetchOrders() {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setSnackbar({ open: true, message: 'Erro ao buscar pedidos.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Buscar pedidos ao carregar a página
  useEffect(() => {
    fetchOrders();
  }, []);

  // Função para atualizar o status
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      fetchOrders(); // Recarrega a tabela
      setSnackbar({ open: true, message: 'Status atualizado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setSnackbar({ open: true, message: 'Erro ao atualizar status.', severity: 'error' });
    }
  };

  // Função para fechar o snackbar
  const handleCloseSnackbar = () => setSnackbar(null);
  
  // Função para navegar para a página de novo pedido
  const handleNewOrder = () => navigate('/orders/new');

  // Função para deletar um pedido
  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este pedido? Esta ação não pode ser desfeita.')) {
      try {
        await api.delete(`/orders/${id}`);
        fetchOrders();
        setSnackbar({ open: true, message: 'Pedido deletado com sucesso!', severity: 'success' });
      } catch (error) {
        console.error("Erro ao deletar pedido:", error);
        setSnackbar({ open: true, message: 'Erro ao deletar pedido.', severity: 'error' });
      }
    }
  };

  // Definição das Colunas
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'userName',
      headerName: 'Cliente',
      width: 200,
      valueGetter: (params) => params?.row?.user?.name || params?.row?.user.email || '',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        let color = 'default';
        if (params.value === 'CONCLUÍDO') color = 'success';
        if (params.value === 'CANCELADO') color = 'error';
        return <Typography color={color}>{params.value}</Typography>;
      }
    },
    {
      field: 'total',
      headerName: 'Total',
      type: 'number',
      width: 120,
      valueFormatter: (params) => {
        if (params.value == null) return ''; 
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
      },
    },
    {
      field: 'itemCount',
      headerName: 'Itens',
      type: 'number',
      width: 90,
      valueGetter: (params) => params?.row?.items?.length || 0,
    },
    {
      field: 'createdAt',
      headerName: 'Data',
      width: 180,
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return new Date(params.value).toLocaleString('pt-BR');
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Select
              value={params.row.status}
              onChange={(e: SelectChangeEvent) => handleStatusChange(params.row.id, e.target.value)}
              size="small"
              sx={{ flexGrow: 1, mr: 1 }} // Ocupa o espaço
            >
              <MenuItem value="PENDENTE">Pendente</MenuItem>
              <MenuItem value="CONCLUÍDO">Concluído</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
            </Select>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteOrder(params.row.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Pedidos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleNewOrder}
        >
          Novo Pedido
        </Button>
      </Box>

      {/* --- TABELA DE DADOS --- */}
      <Box sx={{ height: 500, width: '100%', backgroundColor: 'white' }}>
        <DataGrid
          rows={orders}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 20]}
        />
      </Box>

      {/* --- SNACKBAR --- */}
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}