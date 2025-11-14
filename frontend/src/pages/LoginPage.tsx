// src/pages/LoginPage.tsx
import { Box, Typography, TextField, Button, Container, CssBaseline, Paper, Alert, Grid, Link } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { AxiosError } from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Tipos do formulário
type LoginFormInputs = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  
  // Estado para erros de login
  const [loginError, setLoginError] = useState<string | null>(null);

  // Descobre para onde redirecionar após o login
  const from = location.state?.from?.pathname || "/";

  // Função de envio
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoginError(null); // Limpe erros antigos
    
    try {
      // Chame a API de backend
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      // Se correu bem, pegue o token e chame o login do context
      const token = response.data.access_token;
      auth.login(token);

      // Redirecione para a página anterior (ou dashboard)
      navigate(from, { replace: true });

    } catch (error) {
      console.error("Erro no login:", error);
      // Se o backend der um erro (ex: 401 Não Autorizado)
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
      <Paper elevation={3} sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
        backgroundColor: 'white',
      }}>
        <Typography component="h1" variant="h5" color="primary">
          Login
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
          
          {/* Mostre o Alert se houver um erro de login */}
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
            sx={{ mt: 3, mb: 2 }}
          >
            
            Entrar
          </Button>

          {/* 3. ADICIONE ESTE BLOCO */}
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                Não tem uma conta? Cadastre-se
              </Link>
            </Grid>
          </Grid>
          
        </Box>
      </Paper>
    </Container>
  );
}