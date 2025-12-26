import { Box, Typography, TextField, Button, Container, CssBaseline, Paper, Alert, Grid, Link } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat } from 'lucide-react';

type LoginFormInputs = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth(); // Importamos o contexto
  
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoginError(null);
    
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      // 1. Extraímos o token e o user da resposta do Backend
      const { access_token, user } = response.data;

      // 2. Passamos AMBOS para o contexto
      auth.login(access_token, user);

      // Redireciona para onde o utilizador queria ir ou para o Dashboard
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });

    } catch (error: any) {
      console.error('Erro no login:', error);
      // Tenta pegar a mensagem de erro da API ou usa uma genérica
      const message = error.response?.data?.message || 'Falha ao entrar. Verifique suas credenciais.';
      setLoginError(message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          
          {/* Cabeçalho com Ícone */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: '50%', mb: 2 }}>
               <ChefHat size={32} color="#2e7d32" />
            </Box>
            <Typography component="h1" variant="h5" fontWeight="bold" color="#1b5e20">
              Confeitaria Heaven
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestão de Pedidos
            </Typography>
          </Box>

          {/* Mensagem de Erro */}
          {loginError && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {loginError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              autoComplete="email"
              autoFocus
              {...register("email", { 
                required: "E-mail é obrigatório",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Endereço de e-mail inválido"
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register("password", { 
                required: "Senha é obrigatória" 
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.2,
                bgcolor: '#2e7d32',
                '&:hover': {
                  bgcolor: '#1b5e20',
                }
              }}
            >
              Entrar
            </Button>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2" sx={{ textDecoration: 'none', color: '#2e7d32', fontWeight: 500 }}>
                  Não tem uma conta? <span style={{ fontWeight: 'bold' }}>Crie a sua Loja</span>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Novari Doces v2.0
        </Typography>
      </Box>
    </Container>
  );
}
