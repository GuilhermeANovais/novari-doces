// src/pages/OrdersPage.tsx
import {
  Box, Typography, Button, Select, MenuItem,
  SelectChangeEvent, Snackbar, Alert, IconButton, Paper
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Plus, Eye, Trash2, Pencil, Printer, ChefHat } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { EditOrderModal } from '../components/EditOrderModal';
import { OrderSummary } from '../types/entities';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;

// Interface estendida localmente caso entities.ts não tenha deliveryDate
interface OrderWithDelivery extends OrderSummary {
  deliveryDate?: string | null;
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const navigate = useNavigate();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Estados para edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrderWithDelivery | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<OrderWithDelivery[]>('/orders');
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

  // --- Função de Impressão (Atualizada para suportar tipos) ---
  const handlePrint = async (id: number, type: 'receipt' | 'kitchen') => {
    try {
      // 1. Pede o PDF como BLOB, passando o tipo na Query String
      const response = await api.get(`/orders/${id}/pdf?type=${type}`, { responseType: 'blob' });
      
      // 2. Cria um URL temporário
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // 3. Cria um iframe invisível para processar a impressão
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      // 4. Manda imprimir assim que carregar
      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
        
        // Limpeza após 1 minuto
        setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
        }, 60000); 
      };

    } catch (error) {
      console.error("Erro ao imprimir:", error);
      setSnackbar({ open: true, message: 'Erro ao gerar impressão.', severity: 'error' });
    }
  };

  const handleViewDetails = (id: number) => setSelectedOrderId(id);
  const handleCloseDetailsModal = () => setSelectedOrderId(null);
  
  const handleEditOrder = (order: OrderWithDelivery) => {
    setOrderToEdit(order);
    setEditModalOpen(true);
  };

  const handleCloseSnackbar = () => setSnackbar(null);
  const handleNewOrder = () => navigate('/orders/new');

  // --- Colunas ---
  const columns = useMemo((): GridColDef<OrderWithDelivery>[] => [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'clientName',
      headerName: 'Cliente',
      width: 180,
      valueGetter: (_value, row) => row.client?.name || 'Pedido Interno',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => {
        let color = 'default';
        if (params.value === 'CONCLUÍDO') color = 'success';
        if (params.value === 'CANCELADO') color = 'error';
        return <Typography color={color} variant="body2" fontWeight="medium">{params.value}</Typography>;
      }
    },
    {
      field: 'deliveryDate',
      headerName: 'Entrega',
      width: 160,
      valueGetter: (value, row) => value || row.deliveryDate,
      valueFormatter: (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
      },
    },
    {
      field: 'total',
      headerName: 'Total',
      type: 'number',
      width: 110,
      valueFormatter: (value) => {
        if (value == null) return ''; 
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      },
    },
    {
      field: 'itemCount',
      headerName: 'Itens',
      type: 'number',
      width: 80,
      valueGetter: (_value, row) => row.items?.length || 0,
    },
    {
      field: 'createdAt',
      headerName: 'Criado em',
      width: 160,
      valueFormatter: (value) => {
        if (value == null) return '';
        return new Date(value).toLocaleString('pt-BR');
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 280, // Largura aumentada para caber 2 botões de print + outros
      sortable: false,
      renderCell: (params) => {
        const statusValue = ['PENDENTE', 'CONCLUÍDO', 'CANCELADO', 'SINAL PAGO'].includes(params.row.status) ? params.row.status : 'PENDENTE';
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
             
             {/* 1. Botão Cupom (Térmica - 80mm) */}
             <IconButton
              color="primary"
              size="small"
              onClick={() => handlePrint(params.row.id, 'receipt')}
              title="Cupom (80mm)"
            >
              <Printer size={18} strokeWidth={1.5} />
            </IconButton>

            {/* 2. Botão Cozinha (A4 Completo) */}
            <IconButton
              size="small"
              sx={{ color: '#e65100' }} // Cor Laranja
              onClick={() => handlePrint(params.row.id, 'kitchen')}
              title="Pedido Completo (A4 - Cozinha)"
            >
              <ChefHat size={18} strokeWidth={1.5} />
            </IconButton>

            {/* Ver Detalhes */}
            <IconButton
              color="default"
              size="small"
              onClick={() => handleViewDetails(params.row.id)}
            >
              <Eye size={18} strokeWidth={1.5} />
            </IconButton>

            {/* Editar */}
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEditOrder(params.row)}
            >
              <Pencil size={18} strokeWidth={1.5} />
            </IconButton>

            {/* Select Rápido de Status */}
            <Select
              value={statusValue}
              onChange={(e: SelectChangeEvent) => handleStatusChange(params.row.id, e.target.value)}
              size="small"
              sx={{ height: 30, fontSize: '0.8rem', width: 90 }}
            >
              <MenuItem value="PENDENTE">Pend.</MenuItem>
              <MenuItem value="CONCLUÍDO">Conc.</MenuItem>
              <MenuItem value="CANCELADO">Canc.</MenuItem>
            </Select>

            {/* Deletar */}
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteOrder(params.row.id)}
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </IconButton>
          </Box>
        );
      },
    },
  ], [handleStatusChange, handleDeleteOrder]);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
          Pedidos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus size={20} strokeWidth={1.5} />}
          onClick={handleNewOrder}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Novo Pedido
        </Button>
      </Box>

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
          rows={orders}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 20]}
          sx={{ border: 'none' }}
        />
      </Paper>

      <OrderDetailsModal
        open={selectedOrderId !== null}
        handleClose={handleCloseDetailsModal}
        orderId={selectedOrderId}
      />

      <EditOrderModal 
        open={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        onSave={fetchOrders}
        order={orderToEdit}
        setSnackbar={setSnackbar}
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