import { 
  Box, Typography, Grid, Paper, CircularProgress, 
  Alert, AlertTitle, List, ListItem, ListItemText, Chip 
} from '@mui/material';
import { 
  TriangleAlert, Package, Users, DollarSign, Timer, 
  TrendingDown, Wallet 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';

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
  revenueMonth: number;
  expensesMonth: number;
  netProfit: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5, backgroundColor: 'white', borderRadius: 2,
          border: '1px solid #e0e0e0', borderLeft: `5px solid ${color || '#1B5E20'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' 
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', mb: 0 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: color || '#1B5E20', opacity: 0.9, width: 45, height: 45, borderRadius: '50%', backgroundColor: `${color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </Box>
      </Paper>
    </Grid>
  );
}

// Formatador de Moeda
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#1a1a1a' }}>
        Visão Geral
      </Typography>

      {/* Alertas */}
      {stats?.upcomingOrders && stats.upcomingOrders.length > 0 && (
        <Paper elevation={0} sx={{ mb: 4, overflow: 'hidden', border: '1px solid #ed6c02', borderRadius: 2 }}>
          <Alert severity="warning" icon={<TriangleAlert size={24} />} sx={{ backgroundColor: '#fff3e0' }}>
            <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              Atenção: {stats.upcomingOrders.length} Pedido(s) para entregar em breve!
            </AlertTitle>
            <List dense>
              {stats.upcomingOrders.map((order) => (
                <ListItem key={order.id} button onClick={() => navigate('/calendar')} sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', '&:last-child': { borderBottom: 'none' } }}>
                  <ListItemText primary={<Typography variant="subtitle2"><b>Pedido #{order.id}</b> - {order.client?.name || 'Cliente Balcão'}</Typography>} secondary={`Entrega: ${new Date(order.deliveryDate).toLocaleString('pt-BR')}`} />
                  <Chip label="Pendente" color="warning" size="small" variant="outlined" />
                </ListItem>
              ))}
            </List>
          </Alert>
        </Paper>
      )}

      {/* --- LINHA 1: KPIs Operacionais --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard title="Entregas Urgentes" value={stats?.upcomingOrders.length || 0} color="#d32f2f" icon={<Timer size={20} strokeWidth={2} />} />
        <StatCard title="Produtos" value={stats?.productCount || 0} color="#1976d2" icon={<Package size={20} strokeWidth={2} />} />
        <StatCard title="Usuários" value={stats?.userCount || 0} color="#ed6c02" icon={<Users size={20} strokeWidth={2} />} />
      </Grid>

      {/* --- LINHA 2: KPIs Financeiros do Mês --- */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
        Financeiro
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard title="Faturamento" value={formatCurrency(stats?.revenueMonth || 0)} color="#16a34a" icon={<DollarSign size={20} strokeWidth={2} />} />
        <StatCard title="Despesas" value={formatCurrency(stats?.expensesMonth || 0)} color="#dc2626" icon={<TrendingDown size={20} strokeWidth={2} />} />
        <StatCard 
          title="Lucro Líquido" 
          value={formatCurrency(stats?.netProfit || 0)} 
          color={stats && stats.netProfit >= 0 ? "#00c7ceff" : "#dc2626"} // Verde se positivo, Vermelho se negativo
          icon={<Wallet size={20} strokeWidth={2} />} 
        />
      </Grid>

      {/* --- LINHA 3: Gráficos e Listas --- */}
      <Grid container spacing={3}>
        
        {/* Gráfico de Vendas */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, height: 400, width: 750, border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>Faturamento (7 Dias)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={stats?.salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Vendas']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, width: '100%', border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>Top Produtos Mais Vendidos</Typography>
            <List disablePadding>
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <ListItem 
                    key={index} 
                    divider={index < stats.topProducts.length - 1}
                    sx={{ px: 1, py: 1.5 }}
                  >
                    {/* Ranking Number */}
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
                      label={`${product.value} un.`} 
                      size="small" 
                      sx={{ fontWeight: 'bold', bgcolor: '#f0fdf4', color: '#166534', borderRadius: 1.5 }} 
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Nenhum dado de vendas disponível.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Gráfico de Despesas */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, height: 400, width: 750, border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>Despesas (30 Dias)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={stats?.expensesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Despesas']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="amount" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Lista de Top Produtos (Substituindo o Gráfico de Pizza) */}
        

      </Grid>
    </Box>
  );
}