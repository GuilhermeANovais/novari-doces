import { 
  Box, Typography, Grid, Paper, CircularProgress, 
  Alert, AlertTitle, List, ListItem, ListItemText, Chip,
  LinearProgress, Button 
} from '@mui/material';
import { 
  TriangleAlert, Package, Users, DollarSign, Timer, 
  TrendingDown, Wallet, Crown 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; 
import api from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { NoticeBoard } from '../components/NoticeBoard';

// --- Interfaces ---
interface ChartData { date: string; amount: number; }
interface TopProduct { name: string; value: number; }
interface UpcomingOrder {
  id: number;
  deliveryDate: string;
  client?: { name: string };
  total: number;
}

interface Stats {
  productCount: number;
  userCount: number;
  salesData: ChartData[];
  expensesData: ChartData[];
  topProducts: TopProduct[];
  upcomingOrders: UpcomingOrder[];
  
  // Financeiro (nomes iguais ao backend)
  revenue: number;
  expenses: number;
  profit: number;

  // Plano SaaS
  plan: 'FREE' | 'PRO';
  usage: number;
  limit: number | string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon: React.ElementType;
  isCurrency?: boolean;
}

function StatCard({ title, value, color = '#1976d2', icon: Icon, isCurrency }: StatCardProps) {
  return (
    <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%', borderRadius: 3 }}>
      <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}15`, mr: 2 }}>
        <Icon size={28} color={color} />
      </Box>
      <Box>
        <Typography variant="body2" color="textSecondary" fontWeight={500}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#2c3e50' }}>
          {isCurrency 
            ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : value
          }
        </Typography>
      </Box>
    </Paper>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
    refetchInterval: 30000, 
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          <AlertTitle>Erro</AlertTitle>
          Não foi possível carregar os dados do dashboard.
        </Alert>
      </Box>
    );
  }

  const statCards = [
    { title: 'Faturamento', value: stats?.revenue || 0, icon: DollarSign, color: '#2e7d32', isCurrency: true },
    { title: 'Despesas', value: stats?.expenses || 0, icon: TrendingDown, color: '#d32f2f', isCurrency: true },
    { title: 'Lucro Líquido', value: stats?.profit || 0, icon: Wallet, color: (stats?.profit || 0) >= 0 ? '#1565c0' : '#c62828', isCurrency: true },
    { title: 'Produtos Ativos', value: stats?.productCount || 0, icon: Package, color: '#ed6c02' },
    { title: 'Clientes/Users', value: stats?.userCount || 0, icon: Users, color: '#0288d1' },
    { title: 'Pedidos Próx.', value: stats?.upcomingOrders.length || 0, icon: Timer, color: '#9c27b0' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="#1a1a1a">
          Visão Geral
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Acompanhe o desempenho da sua confeitaria em tempo real.
        </Typography>
      </Box>

      {/* --- ALERTA DE PLANO FREE --- */}
      {stats?.plan === 'FREE' && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: '#fff8e1', 
            border: '1px solid #ffecb3', 
            borderRadius: 2 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ p: 1, bgcolor: '#ffecb3', borderRadius: '50%', mr: 2 }}>
               <Crown size={24} color="#f57c00" />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="#e65100">
                Plano Grátis
              </Typography>
              <Typography variant="body2" color="#bf360c">
                Você utilizou <b>{stats.usage}</b> de <b>{stats.limit}</b> pedidos mensais gratuitos.
              </Typography>
            </Box>
            <Button variant="contained" color="warning" sx={{ fontWeight: 'bold' }}>
              Fazer Upgrade
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((stats.usage / 30) * 100, 100)} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5, 
                    bgcolor: '#ffecb3',
                    '& .MuiLinearProgress-bar': { bgcolor: '#f57c00' }
                  }} 
                />
             </Box>
             <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
               {Math.round((stats.usage / 30) * 100)}%
             </Typography>
          </Box>
        </Paper>
      )}

      {/* Grid de Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* GRÁFICO DE FATURAMENTO */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Faturamento vs. Despesas (6 meses)
            </Typography>
            {/* Placeholder para gráfico real - usando dados mockados se vazio */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesData.length ? stats.salesData : [{date: 'Jan', amount: 0}]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#2e7d32" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* TOP PRODUTOS E MURAL */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            
            {/* TOP PRODUTOS */}
            <Grid item>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Top 5 Produtos
                </Typography>
                <List>
                  {stats?.topProducts?.length ? (
                    stats.topProducts.map((product, index) => (
                      <ListItem 
                        key={index} 
                        disableGutters 
                        sx={{ borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none', py: 1.5 }}
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: '50%', 
                            bgcolor: index < 3 ? '#e8f5e9' : '#f5f5f5', 
                            color: index < 3 ? '#1B5E20' : '#757575',
                            mr: 2, fontWeight: 'bold', fontSize: '0.875rem'
                          }}
                        >
                          {index + 1}
                        </Box>
                        <ListItemText 
                          primary={product.name} 
                          primaryTypographyProps={{ fontWeight: 500, color: '#333' }}
                        />
                        <Chip 
                          label={`${Number(product.value)} un.`} 
                          size="small" 
                          sx={{ fontWeight: 'bold', bgcolor: '#f0fdf4', color: '#166534', borderRadius: 1.5 }} 
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                      Nenhum dado de vendas.
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>
            
            {/* MURAL DE AVISOS */}
            <Grid item>
               <Box sx={{ height: 400 }}>
                 <NoticeBoard />
               </Box>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
