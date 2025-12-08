// src/pages/AuditPage.tsx
import { Box, Typography, Chip, Paper, Alert, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query'; // <--- React Query
import api from '../api';

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  details: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

// Configuração das colunas
const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { 
    field: 'action', 
    headerName: 'Ação', 
    width: 120,
    renderCell: (params) => {
      let color: 'default' | 'success' | 'info' | 'error' | 'warning' = 'default';
      if (params.value === 'CREATE') color = 'success';
      if (params.value === 'UPDATE') color = 'info';
      if (params.value === 'DELETE') color = 'error';
      if (params.value === 'DELETE_ALL') color = 'warning'; // Novo tipo de log da SettingsPage
      
      return (
        <Chip 
          label={params.value} 
          color={color} 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
  },
  { field: 'entity', headerName: 'Entidade', width: 100 },
  { field: 'entityId', headerName: 'ID Ref.', width: 90 },
  { field: 'details', headerName: 'Detalhes', flex: 1 },
  { 
    field: 'userName', 
    headerName: 'Usuário', 
    width: 180,
    valueGetter: (_value, row) => row.user?.name || row.user?.email || 'Sistema'
  },
  { 
    field: 'createdAt', 
    headerName: 'Data', 
    width: 180,
    valueFormatter: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleString('pt-BR');
    }
  },
];

export function AuditPage() {
  // --- REFACTOR REACT QUERY ---
  // Substitui useState e useEffect
  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await api.get<AuditLog[]>('/audit');
      return response.data;
    },
    // Cache de 1 minuto, já que logs não mudam tão freneticamente quanto pedidos
    staleTime: 60000, 
  });

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Erro ao carregar o registo de auditoria.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
          Logs de Auditoria
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Registo de todas as ações importantes realizadas no sistema.
        </Typography>
      </Box>

      {/* Tabela com Estilo Unificado */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 600, 
          width: '100%', 
          bgcolor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: 2 
        }}
      >
        <DataGrid
          rows={logs}
          columns={columns}
          loading={isLoading}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] }, // Ordenar por mais recente
          }}
          pageSizeOptions={[20, 50, 100]}
          sx={{ border: 'none' }}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}
