import { useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton 
} from '@mui/material';
import { Building2, Trash2, Ban } from 'lucide-react';
import api from '../api';

interface Company {
  id: string;
  name: string;
  createdAt: string;
  adminName: string;
  adminEmail: string;
  stats: {
    users: number;
    orders: number;
    products: number;
  };
}

export function BackofficePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const response = await api.get('/backoffice/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      alert('Erro ao carregar lista de empresas.');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Isso apagaria todos os dados desta empresa.')) {
      api.delete(`/backoffice/companies/${id}`)
        .then((res) => alert(res.data.message))
        .catch((err) => alert('Erro ao apagar.'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, bgcolor: '#1a1a1a', color: '#ffd700', borderRadius: 2 }}>
          <Building2 size={28} />
        </Box>
        <div>
          <Typography variant="h4" fontWeight="bold" color="#1a1a1a">
            Master Backoffice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão Global de Clientes SaaS
          </Typography>
        </div>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>Empresa (Loja)</b></TableCell>
              <TableCell><b>Admin Responsável</b></TableCell>
              <TableCell align="center"><b>Métricas</b></TableCell>
              <TableCell><b>Data Registo</b></TableCell>
              <TableCell align="right"><b>Ações</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((comp) => (
              <TableRow key={comp.id} hover>
                <TableCell>
                  <Typography fontWeight="medium">{comp.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    ID: {comp.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{comp.adminName}</Typography>
                  <Typography variant="caption" color="text.secondary">{comp.adminEmail}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Chip label={`${comp.stats.orders} Pedidos`} size="small" color="primary" variant="outlined" />
                    <Chip label={`${comp.stats.products} Prods`} size="small" />
                    <Chip label={`${comp.stats.users} Users`} size="small" />
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(comp.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="warning" title="Suspender (Simulação)">
                    <Ban size={18} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDelete(comp.id)}
                    title="Apagar Empresa"
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhuma empresa registada além da Admin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
