// src/pages/AuditPage.tsx
import { Box, Typography, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
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

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { 
    field: 'action', 
    headerName: 'Ação', 
    width: 120,
    renderCell: (params) => {
      let color: any = 'default';
      if (params.value === 'CREATE') color = 'success';
      if (params.value === 'UPDATE') color = 'info';
      if (params.value === 'DELETE') color = 'error';
      // Usamos Chips simples, ficam bem com o design clean
      return <Chip label={params.value} color={color} size="small" variant="outlined" />;
    }
  },
  { field: 'entity', headerName: 'Entidade', width: 100 },
  { field: 'entityId', headerName: 'ID Ref.', width: 90 },
  { field: 'details', headerName: 'Detalhes', flex: 1 },
  { 
    field: 'userName', 
    headerName: 'Usuário', 
    width: 150,
    valueGetter: (_value, row) => row.user?.name || row.user?.email 
  },
  { 
    field: 'createdAt', 
    headerName: 'Data', 
    width: 180,
    valueFormatter: (value) => new Date(value).toLocaleString('pt-BR')
  },
];

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit')
      .then(res => setLogs(res.data))
      .catch(err => console.error("Erro ao buscar logs:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Typography variant="h4" gutterBottom>Logs de Auditoria</Typography>
      <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
          }}
          pageSizeOptions={[20, 50]}
        />
      </Box>
    </Box>
  );
}