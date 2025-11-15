// src/pages/OrdersPage.tsx
import {
  Box, Typography, Button, CircularProgress, Select, MenuItem,
  SelectChangeEvent, Snackbar, Alert, IconButton
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete, Visibility } from '@mui/icons-material'; // 1. SUBSTITUA 'Edit' por 'Visibility'
import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
// 2. Importe o novo modal e a interface
import { OrderDetailsModal, FullOrder } from '../components/OrderDetailsModal'; 

// --- Interfaces (simplificadas, pois a 'FullOrder' está no modal) ---
interface Order {
  id: number;
  createdAt: string;
  status: string;
  total: number;
  user: { name: string | null; email: string; };
  items: any[]; // Apenas para 'length'
}
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

  // 3. Estados para o novo modal de detalhes
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ... (fetchOrders, handleStatusChange, handleCloseSnackbar, handleNewOrder, handleDeleteOrder - sem alterações) ...
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
  useEffect(() => {
    fetchOrders();
  }, []);
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      fetchOrders(); 
      setSnackbar({ open: true, message: 'Status atualizado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setSnackbar({ open: true, message: 'Erro ao atualizar status.', severity: 'error' });
    }
  };
  const handleCloseSnackbar = () => setSnackbar(null);
  const handleNewOrder = () => navigate('/orders/new');
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

  // 4. Funções para o novo modal
  const handleViewDetails = async (id: number) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      // O backend já está pronto para isto
      const response = await api.get<FullOrder>(`/orders/${id}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
      setSnackbar({ open: true, message: 'Erro ao buscar detalhes do pedido.', severity: 'error' });
      setDetailsModalOpen(false); // Fecha o modal se falhar
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedOrder(null);
  };


  // 5. Definição das Colunas (Atualize a coluna de Ações)
  const columns: GridColDef[] = [
    // ... (colunas id, userName, status, total, itemCount, createdAt - sem alterações) ...
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'clientName',
      headerName: 'Cliente',
      width: 200,
      valueGetter: (params) => params?.row?.client?.name || 'Pedido Interno',
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
      width: 240, // Aumente a largura
      sortable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Ícone de Ver Detalhes */}
            <IconButton
              color="default"
              size="small"
              onClick={() => handleViewDetails(params.row.id)}
            >
              <Visibility />
            </IconButton>
            {/* Seletor de Status */}
            <Select
              value={params.row.status}
              onChange={(e: SelectChangeEvent) => handleStatusChange(params.row.id, e.target.value)}
              size="small"
              sx={{ flexGrow: 1, mx: 1 }} // Margin (x-axis)
            >
              <MenuItem value="PENDENTE">Pendente</MenuItem>
              <MenuItem value="CONCLUÍDO">Concluído</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
              <MenuItem value="EM ANDAMENTO">Em Andamento</MenuItem>
              <MenuItem value="SINAL PAGO">Sinal Pago</MenuItem>
              
            </Select>
            {/* Ícone de Deletar */}
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
      {/* ... (Cabeçalho da Página - sem alterações) ... */}
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

      {/* ... (Tabela de Dados - sem alterações) ... */}
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

      {/* 6. Adicione o novo Modal */}
      <OrderDetailsModal
        open={detailsModalOpen}
        handleClose={handleCloseDetailsModal}
        order={selectedOrder}
        loading={detailsLoading}
      />

      {/* ... (Snackbar - sem alterações) ... */}
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