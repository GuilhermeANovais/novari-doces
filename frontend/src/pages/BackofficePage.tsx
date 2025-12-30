import { useEffect, useState } from 'react';
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip 
} from '@mui/material';
import { Building2, Trash2, Ban, Crown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'; // Novos Ícones
import api from '../api';

interface Company {
  id: string;
  name: string;
  createdAt: string;
  plan: 'FREE' | 'PRO'; // <--- Adicionar o tipo do plano
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

  // --- NOVA FUNÇÃO: Mudar Plano ---
  const handleTogglePlan = async (company: Company) => {
    const newPlan = company.plan === 'FREE' ? 'PRO' : 'FREE';
    const actionName = newPlan === 'PRO' ? 'PROMOVER' : 'REBAIXAR';

    if (!confirm(`Deseja ${actionName} a empresa "${company.name}" para o plano ${newPlan}?`)) return;

    try {
      await api.patch(`/backoffice/companies/${company.id}/plan`, { plan: newPlan });
      
      // Atualiza a lista localmente para refletir a mudança instantaneamente
      setCompanies(prev => prev.map(c => 
        c.id === company.id ? { ...c, plan: newPlan } : c
      ));
    } catch (error) {
      alert('Erro ao alterar plano.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Isso apagaria todos os dados desta empresa.')) {
      api.delete(`/backoffice/companies/${id}`)
        .then((res) => alert(res.data.message))
        .catch(() => alert('Erro ao apagar.'));
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
              <TableCell><b>Empresa</b></TableCell>
              <TableCell><b>Plano</b></TableCell> {/* Nova Coluna */}
              <TableCell><b>Admin</b></TableCell>
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
                
                {/* --- COLUNA DO PLANO --- */}
                <TableCell>
                  <Chip 
                    icon={comp.plan === 'PRO' ? <Crown size={14} /> : undefined}
                    label={comp.plan} 
                    color={comp.plan === 'PRO' ? 'warning' : 'default'} 
                    size="small"
                    variant={comp.plan === 'PRO' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{comp.adminName}</Typography>
                  <Typography variant="caption" color="text.secondary">{comp.adminEmail}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Chip label={`${comp.stats.orders} Ped`} size="small" variant="outlined" />
                    <Chip label={`${comp.stats.products} Prod`} size="small" variant="outlined" />
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(comp.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  
                  {/* --- BOTÃO DE MUDAR PLANO --- */}
                  <Tooltip title={comp.plan === 'FREE' ? "Promover para PRO" : "Rebaixar para FREE"}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleTogglePlan(comp)}
                      color={comp.plan === 'FREE' ? 'success' : 'default'}
                    >
                      {comp.plan === 'FREE' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </IconButton>
                  </Tooltip>

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
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
