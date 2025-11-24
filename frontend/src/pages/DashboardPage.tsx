import { 
  Box, Typography, Grid, Paper, CircularProgress, 
  Alert, AlertTitle, List, ListItem, ListItemText, Chip 
} from '@mui/material';
import { 
  TriangleAlert, 
  Package, 
  Users, 
  DollarSign, 
  Timer 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// --- Interfaces ---
interface SalesData {
  date: string;
  amount: number;
}

interface TopProduct {
  name: string;
  value: number;
}

interface UpcomingOrder {
  id: number;
  deliveryDate: string;
  client?: { name: string };
  total: number;
}

interface Stats {
  productCount: number;
  userCount: number;
  salesData: SalesData[];
  topProducts: TopProduct[];
  upcomingOrders: UpcomingOrder[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  icon: React.ReactNode;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// --- COMPONENTE STATCARD ---
function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          backgroundColor: 'white',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          borderLeft: `5px solid ${color || '#1B5E20'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center', // Centralizado verticalmente
          height: '100%' 
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography 
            variant="subtitle2" 
            color="textSecondary" 
            gutterBottom 
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              mb: 0 
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            component="p" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#333',
              lineHeight: 1.2 
            }}
          >
            {value}
          </Typography>
        </Box>
        
        {/* Ícone */}
        <Box sx={{ 
          color: color || '#1B5E20', 
          opacity: 0.9,
          width: 45,
          height: 45,
          borderRadius: '50%',
          backgroundColor: `${color}15`, 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0 
        }}>
          {icon}
        </Box>
      </Paper>
    </Grid>
  );
}

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalSales = stats?.salesData.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#1a1a1a' }}>
        Visão Geral
      </Typography>

      {/* Notificações */}
      {stats?.upcomingOrders && stats.upcomingOrders.length > 0 && (
        <Paper elevation={0} sx={{ mb: 4, overflow: 'hidden', border: '1px solid #ed6c02', borderRadius: 2 }}>
          <Alert 
            severity="warning" 
            icon={<TriangleAlert size={24} />}
            sx={{ backgroundColor: '#fff3e0' }}
          >
            <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              Atenção: {stats.upcomingOrders.length} Pedido(s) para entregar em breve!
            </AlertTitle>
            <List dense>
              {stats.upcomingOrders.map((order) => (
                <ListItem 
                  key={order.id}
                  button
                  onClick={() => navigate('/calendar')}
                  sx={{ 
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2">
                        <b>Pedido #{order.id}</b> - {order.client?.name || 'Cliente Balcão'}
                      </Typography>
                    }
                    secondary={`Entrega: ${new Date(order.deliveryDate).toLocaleString('pt-BR')}`}
                  />
                  <Chip label="Pendente" color="warning" size="small" variant="outlined" />
                </ListItem>
              ))}
            </List>
          </Alert>
        </Paper>
      )}

      {/* Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard 
          title="Produtos" 
          value={stats?.productCount || 0} 
          color="#1976d2" 
          icon={<Package size={20} strokeWidth={2} />} 
        />
        <StatCard 
          title="Usuários" 
          value={stats?.userCount || 0} 
          color="#ed6c02" 
          icon={<Users size={20} strokeWidth={2} />} 
        />
        <StatCard 
          title="Vendas (7 dias)" 
          value={`R$ ${totalSales.toFixed(2)}`} 
          color="#2e7d32" 
          icon={<DollarSign size={20} strokeWidth={2} />} 
        />
        <StatCard 
          title="Entregas Próximas" 
          value={stats?.upcomingOrders.length || 0} 
          color="#d32f2f" 
          icon={<Timer size={20} strokeWidth={2} />} 
        />
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        
        {/* 1. Gráfico de Linha (Ocupa 8 colunas - Mais largo) */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, height: 400, width: 800, border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Faturamento (Últimos 7 dias)
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart
                data={stats?.salesData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                   formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                   contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} 
                  dot={{ fill: '#16a34a', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 2. Gráfico de Pizza (Ocupa 4 colunas - Menor e Compacto) */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, height: 400, width: 700, border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Produtos com mais saída
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={stats?.topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // Raio interno menor
                  outerRadius={80} // Raio externo reduzido para não cortar
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  // Label removida para evitar cortes e sobreposição
                >
                  {stats?.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                /> 
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}