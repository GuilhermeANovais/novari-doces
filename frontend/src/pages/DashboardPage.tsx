// src/pages/DashboardPage.tsx
import { 
  Box, Typography, Grid, Paper, CircularProgress, 
  Alert, AlertTitle, List, ListItem, ListItemText, Chip 
} from '@mui/material';
// 1. Importe os ícones da Lucide
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
  icon: React.ReactNode; // Adicionamos suporte a ícone no card
}

// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Componente de Card Atualizado com Ícone
function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper
        elevation={0} // Flat design (sem sombra excessiva)
        sx={{
          p: 3,
          backgroundColor: 'white',
          borderRadius: 2,
          border: '1px solid #e0e0e0', // Borda sutil
          borderLeft: `5px solid ${color || '#1B5E20'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: '#333' }}>
            {value}
          </Typography>
        </Box>
        {/* Ícone decorativo à direita */}
        <Box sx={{ color: color || '#1B5E20', opacity: 0.8 }}>
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
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#1a1a1a' }}>
        Visão Geral
      </Typography>

      {/* --- SECÇÃO DE NOTIFICAÇÕES URGENTES --- */}
      {stats?.upcomingOrders && stats.upcomingOrders.length > 0 && (
        <Paper elevation={0} sx={{ mb: 4, overflow: 'hidden', border: '1px solid #ed6c02', borderRadius: 2 }}>
          <Alert 
            severity="warning" 
            // Ícone Lucide personalizado para o alerta
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
                  <Chip 
                    label="Pendente" 
                    color="warning" 
                    size="small" 
                    variant="outlined" 
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        </Paper>
      )}

      {/* --- CARDS SUPERIORES COM ÍCONES --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard 
          title="Produtos" 
          value={stats?.productCount || 0} 
          color="#1976d2" 
          icon={<Package size={32} strokeWidth={1.5} />} 
        />
        <StatCard 
          title="Usuários" 
          value={stats?.userCount || 0} 
          color="#ed6c02" 
          icon={<Users size={32} strokeWidth={1.5} />} 
        />
        <StatCard 
          title="Vendas (7 dias)" 
          value={`R$ ${totalSales.toFixed(2)}`} 
          color="#2e7d32" 
          icon={<DollarSign size={32} strokeWidth={1.5} />} 
        />
        <StatCard 
          title="Entregas Urgentes" 
          value={stats?.upcomingOrders.length || 0} 
          color="#d32f2f" 
          icon={<Timer size={32} strokeWidth={1.5} />} 
        />
      </Grid>

      {/* --- GRÁFICOS --- */}
      <Grid container spacing={3}>
        
        {/* Gráfico de Linha */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, height: 400, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Faturamento (Últimos 7 dias)
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats?.salesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
                <YAxis tick={{ fill: '#666' }} axisLine={{ stroke: '#e0e0e0' }} />
                <Tooltip 
                   formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#1B5E20" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: '#1B5E20', stroke: '#fff', strokeWidth: 2 }} 
                  dot={{ fill: '#1B5E20', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Pizza */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, height: 400, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Top Produtos (Qtd)
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}