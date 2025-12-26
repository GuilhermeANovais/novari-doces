import { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Paper, Alert, Link as MuiLink 
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '', // <--- Novo Campo
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // O backend agora espera companyName e define o role como ADMIN automaticamente
      await api.post('/auth/register', formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao criar conta.');
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#f3f4f6' 
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="bold" align="center" gutterBottom sx={{ color: '#1B5E20' }}>
          Comece Gratuitamente
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Crie a sua loja e comece a gerir os seus pedidos.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Conta criada! Redirecionando...</Alert>}

        <form onSubmit={handleRegister}>
          <TextField
            label="Nome Completo"
            name="name"
            fullWidth
            margin="normal"
            required
            value={formData.name}
            onChange={handleChange}
          />
          
          <TextField
            label="Nome da Sua Loja / Empresa"
            name="companyName"
            fullWidth
            margin="normal"
            required
            placeholder="Ex: Doces da Maria"
            value={formData.companyName}
            onChange={handleChange}
            helperText="Este será o nome da sua organização no sistema"
          />

          <TextField
            label="E-mail Profissional"
            name="email"
            type="email"
            fullWidth
            margin="normal"
            required
            value={formData.email}
            onChange={handleChange}
          />

          <TextField
            label="Senha"
            name="password"
            type="password"
            fullWidth
            margin="normal"
            required
            value={formData.password}
            onChange={handleChange}
          />

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
            sx={{ mt: 3, mb: 2, bgcolor: '#1B5E20', '&:hover': { bgcolor: '#144418' } }}
          >
            Criar Minha Loja
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Já tem conta?{' '}
              <MuiLink component={Link} to="/login" underline="hover" sx={{ fontWeight: 'bold', color: '#1B5E20' }}>
                Entrar
              </MuiLink>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
