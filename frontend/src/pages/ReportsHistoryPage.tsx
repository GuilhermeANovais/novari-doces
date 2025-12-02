import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem 
} from '@mui/material';
import { FileText, Download, PlusCircle } from 'lucide-react';
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
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);
  
  // Estado para o formulário de geração
  const [month, setMonth] = useState(new Date().getMonth()); // Mês atual (0-11 no JS, mas vamos usar 1-12)
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error("Erro ao buscar relatórios");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    try {
      // Envia mês (1-12) e ano
      await api.post('/reports/generate', { 
        month: Number(month), 
        year: Number(year) 
      });
      setOpen(false);
      fetchReports(); // Atualiza a lista
      alert('Relatório gerado com sucesso!');
    } catch (error) {
      alert('Erro ao gerar relatório.');
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
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {String(row.month).padStart(2, '0')}/{row.year}
                </TableCell>
                <TableCell align="right" sx={{ color: 'green' }}>
                  R$ {row.totalRevenue.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>
                  R$ {row.totalExpenses.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <Chip 
                    label={`R$ ${row.netProfit.toFixed(2)}`} 
                    color={row.netProfit >= 0 ? 'success' : 'error'} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" title="Baixar PDF">
                    <Download size={20} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Nenhum relatório encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE GERAÇÃO */}
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
          <Button onClick={handleGenerate} variant="contained" color="primary">
            Gerar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}