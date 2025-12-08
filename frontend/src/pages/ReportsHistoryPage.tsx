import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert } from '@mui/material';
import { Download, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <--- React Query
import api from '../api';

interface Report {
  id: number;
  month: number;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  createdAt: string;
}

export function ReportsHistoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // 1. FETCHING (React Query)
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['monthly-reports'],
    queryFn: async () => {
      const response = await api.get<Report[]>('/reports');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // Cache de 10 minutos (relatórios mudam pouco)
  });

  // 2. MUTATION: GERAR RELATÓRIO
  const generateReportMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      await api.post('/reports/generate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-reports'] });
      setOpen(false);
      setSnackbarMessage('Relatório gerado com sucesso!');
    },
    onError: () => {
      setSnackbarMessage('Erro ao gerar relatório. Verifique se já existe.');
    }
  });

  const handleGenerate = () => {
    generateReportMutation.mutate({ month: Number(month), year: Number(year) });
  };

  // Função de Download (Ação direta sem cache)
  const handleDownload = async (reportId: number, fileName: string) => {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro download:', error);
      setSnackbarMessage('Erro ao baixar o PDF.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Histórico de Relatórios</Typography>
        <Button 
          variant="contained" 
          startIcon={<PlusCircle size={20} />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: '#1B5E20' }}
        >
          Gerar Relatório Manual
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell>Período</TableCell>
              <TableCell align="right">Faturamento</TableCell>
              <TableCell align="right">Despesas</TableCell>
              <TableCell align="right">Lucro Líquido</TableCell>
              <TableCell align="right">Gerado em</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>{String(row.month).padStart(2, '0')}/{row.year}</TableCell>
                <TableCell align="right" sx={{ color: 'green' }}>R$ {Number(row.totalRevenue).toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>R$ {Number(row.totalExpenses).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Chip 
                    label={`R$ ${Number(row.netProfit).toFixed(2)}`} 
                    color={row.netProfit >= 0 ? 'success' : 'error'} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="primary" 
                    title="Baixar PDF"
                    onClick={() => handleDownload(row.id, `relatorio_${row.month}_${row.year}.pdf`)}
                  >
                    <Download size={20} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Nenhum relatório encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Gerar Relatório Passado</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 300 }}>
          <Box display="flex" gap={2} mt={1}>
            <TextField
              select
              label="Mês"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              fullWidth
            >
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Ano"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} variant="contained" color="primary" disabled={generateReportMutation.isPending}>
            {generateReportMutation.isPending ? 'Gerando...' : 'Gerar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbarMessage?.includes('Erro') ? 'error' : 'success'}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
