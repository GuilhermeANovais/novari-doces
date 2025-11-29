import { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Paper, Alert, 
  FormControl, InputLabel, Select, MenuItem, Link as MuiLink 
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DELIVERY', // Valor padrão
    adminSecret: ''
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

    // Prepara os dados para envio
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      // Só envia o adminSecret se o cargo for ADMIN
      adminSecret: formData.role === 'ADMIN' ? formData.adminSecret : undefined
    };

    try {
      await api.post('/auth/register', payload);
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
          Criar Conta
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Confeitaria Heaven
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
            label="E-mail"
            name="email"
            type="email"
            fullWidth
            margin="normal"
            required
            value={formData.email}
            onChange={handleChange}
          />
          
          {/* Seletor de Cargo */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Setor / Função</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              label="Setor / Função"
              value={formData.role}
              onChange={handleChange}
            >
              <MenuItem value="DELIVERY">Delivery / Vendas</MenuItem>
              <MenuItem value="KITCHEN">Cozinha / Produção</MenuItem>
              <MenuItem value="ADMIN">Administrador (Gerência)</MenuItem>
            </Select>
          </FormControl>

          {/* Campo Extra para Admin */}
          {formData.role === 'ADMIN' && (
            <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1, mt: 1, border: '1px solid #ffe0b2' }}>
              <Typography variant="caption" color="warning.main" fontWeight="bold">
                🔒 Área Restrita
              </Typography>
              <TextField
                label="Chave de Administrador"
                name="adminSecret"
                type="password"
                fullWidth
                size="small"
                margin="dense"
                required
                value={formData.adminSecret}
                onChange={handleChange}
                placeholder="Digite a chave mestra"
              />
            </Box>
          )}

          <TextField
            label="Senha (Pessoal)"
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
            Registrar
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