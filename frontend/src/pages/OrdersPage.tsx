// src/pages/OrdersPage.tsx
import {
  Box, Typography, Button, CircularProgress, Select, MenuItem,
  SelectChangeEvent, Snackbar, Alert, IconButton
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete, Visibility } from '@mui/icons-material';
import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { OrderDetailsModal } from '../components/OrderDetailsModal'; 
import { OrderSummary } from '../types/entities';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const navigate = useNavigate();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<OrderSummary[]>('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setSnackbar({ open: true, message: 'Erro ao buscar pedidos.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = useCallback(async (id: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      fetchOrders(); 
      setSnackbar({ open: true, message: 'Status atualizado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setSnackbar({ open: true, message: 'Erro ao atualizar status.', severity: 'error' });
    }
  }, [fetchOrders]);

  const handleDeleteOrder = useCallback(async (id: number) => {
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
  }, [fetchOrders]);

  const handleViewDetails = (id: number) => setSelectedOrderId(id);
  const handleCloseDetailsModal = () => setSelectedOrderId(null);
  const handleCloseSnackbar = () => setSnackbar(null);
  const handleNewOrder = () => navigate('/orders/new');

  // --- DEFINIÇÃO DAS COLUNAS CORRIGIDA (MUI v7) ---
  const columns = useMemo((): GridColDef<OrderSummary>[] => [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'clientName',
      headerName: 'Cliente',
      width: 200,
      // CORREÇÃO: Usar (value, row) em vez de (params)
      valueGetter: (_value, row) => row.client?.name || 'Pedido Interno',
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
      valueFormatter: (value) => {
        if (value == null) return ''; 
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      },
    },
    {
      field: 'itemCount',
      headerName: 'Itens',
      type: 'number',
      width: 90,
      // CORREÇÃO: Usar (value, row) em vez de (params)
      valueGetter: (_value, row) => row.items?.length || 0,
    },
    {
      field: 'createdAt',
      headerName: 'Data',
      width: 180,
      valueFormatter: (value) => {
        if (value == null) return '';
        return new Date(value).toLocaleString('pt-BR');
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 240,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton
              color="default"
              size="small"
              onClick={() => handleViewDetails(params.row.id)}
            >
              <Visibility />
            </IconButton>
            <Select
              value={params.row.status}
              onChange={(e: SelectChangeEvent) => handleStatusChange(params.row.id, e.target.value)}
              size="small"
              sx={{ flexGrow: 1, mx: 1 }}
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
  ], [handleStatusChange, handleDeleteOrder]);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
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

      <OrderDetailsModal
        open={selectedOrderId !== null}
        handleClose={handleCloseDetailsModal}
        orderId={selectedOrderId}
      />

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