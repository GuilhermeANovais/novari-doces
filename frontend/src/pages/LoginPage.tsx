// src/pages/LoginPage.tsx
import { Box, Typography, TextField, Button, Container, CssBaseline, Paper, Alert } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { AxiosError } from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Grid, Link } from '@mui/material';
// 1. Importe o ícone temático
import { ChefHat } from 'lucide-react';

type LoginFormInputs = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  
  const [loginError, setLoginError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || "/";

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoginError(null);
    
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const token = response.data.access_token;
      auth.login(token);

      navigate(from, { replace: true });

    } catch (error) {
      console.error("Erro no login:", error);
      if (error instanceof AxiosError && error.response) {
        setLoginError("E-mail ou senha inválidos.");
      } else {
        setLoginError("Erro ao tentar fazer login. Tente novamente.");
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper 
        elevation={0} // Flat style
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0', // Borda sutil
          borderRadius: 3
        }}
      >
        {/* Ícone de destaque */}
        <Box sx={{ 
          backgroundColor: '#e8f5e9', // Fundo verde claro
          p: 2, 
          borderRadius: '50%', 
          mb: 2,
          color: '#1B5E20' 
        }}>
          <ChefHat size={40} strokeWidth={1.5} />
        </Box>

        <Typography component="h1" variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Acesso ao Sistema
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1, width: '100%' }}>
          
          {loginError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de E-mail"
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
            color="primary"
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.2 }}
          >
            Entrar
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2" sx={{ textDecoration: 'none' }}>
                Não tem uma conta? <b>Cadastre-se</b>
              </Link>
            </Grid>
          </Grid>

        </Box>
      </Paper>
    </Container>
  );
}