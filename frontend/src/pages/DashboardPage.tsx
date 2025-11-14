// src/pages/DashboardPage.tsx
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api'; // 1. Importe o nosso 'api' (Axios com o token)

// 2. Defina a "forma" dos dados que esperamos
interface Stats {
  productCount: number;
  userCount: number;
}

// 3. Um componente de "Card" reutilizável
interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Grid item xs={12} sm={6} md={4}> {/* Responsivo */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          backgroundColor: 'white',
          color: 'primary.dark',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="p">
          {value}
        </Typography>
      </Paper>
    </Grid>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Principal
      </Typography>
      
      <Grid container spacing={3}>
        <StatCard title="Total de Produtos" value={stats?.productCount || 0} />
        <StatCard title="Total de Usuários" value={stats?.userCount || 0} />
        {/* Você pode adicionar mais cards aqui no futuro */}
      </Grid>
    </Box>
  );
}