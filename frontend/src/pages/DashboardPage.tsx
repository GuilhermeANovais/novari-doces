// src/pages/DashboardPage.tsx
import { Box, Typography, Grid, Paper, CircularProgress, useTheme, Alert, AlertTitle, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// --- Interfaces ---

interface UpcomingOrder {
  id: number;
  deliveryDate: string;
  client?: { name: string };
  total: number;
}

interface SalesData {
  date: string;
  amount: number;
}

interface TopProduct {
  name: string;
  value: number;
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
  value: number | string; // Pode ser string (R$)
  color?: string;
}

// --- Cores para o Gráfico de Pizza ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          backgroundColor: 'white',
          borderRadius: 2,
          borderLeft: `5px solid ${color || '#1B5E20'}`,
        }}
      >
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: '#333' }}>
          {value}
        </Typography>
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

  // Calcula o total de vendas somando o gráfico (opcional, só para exibir num card)
  const totalSales = stats?.salesData.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Visão Geral
      </Typography>

      {stats?.upcomingOrders && stats.upcomingOrders.length > 0 && (
        <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden', borderLeft: '6px solid #ed6c02' }}>
          <Alert 
            severity="warning" 
            icon={<Warning fontSize="inherit" />}
            sx={{ backgroundColor: '#fff3e0' }} // Fundo laranja claro
          >
            <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              Atenção: {stats.upcomingOrders.length} Pedido(s) para entregar em breve!
            </AlertTitle>
            <List dense>
              {stats.upcomingOrders.map((order) => (
                <ListItem 
                  key={order.id}
                  button
                  onClick={() => navigate('/calendar')} // Leva ao calendário (ou /orders)
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

      {/* --- CARDS SUPERIORES --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* ... (Cards existentes: Produtos, Usuários, Vendas) ... */}
        <StatCard title="Produtos Cadastrados" value={stats?.productCount || 0} color="#1976d2" />
        <StatCard title="Total de Usuários" value={stats?.userCount || 0} color="#ed6c02" />
        <StatCard title="Vendas (7 dias)" value={`R$ ${totalSales.toFixed(2)}`} color="#2e7d32" />
        <StatCard 
          title="Entregas Urgentes" 
          value={stats?.upcomingOrders.length || 0} 
          color="#d32f2f" 
        />
      </Grid>

      {/* --- GRÁFICOS --- */}
      <Grid container spacing={3}>
        
        {/* Gráfico de Linha: Vendas */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>Faturamento (Últimos 7 dias)</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats?.salesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                   formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#1B5E20" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Pizza: Top Produtos */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>Top Produtos (Qtd)</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // Faz virar um gráfico de "Rosca" (Donut)
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}