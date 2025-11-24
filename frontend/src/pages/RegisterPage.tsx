// src/pages/RegisterPage.tsx
import { Box, Typography, TextField, Button, Container, CssBaseline, Paper, Alert, Grid, Link } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
// 1. Importe o ícone da Lucide
import { UserPlus } from 'lucide-react';

type RegisterFormInputs = {
  name: string;
  email: string;
  password: string;
};

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>();
  const navigate = useNavigate();
  
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      await axios.post('http://localhost:3000/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      setRegisterSuccess("Cadastro realizado com sucesso! Redirecionando...");
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error("Erro no registro:", error);
      if (axios.isAxiosError(error) && error.response) {
        const msg = error.response.data?.message || "E-mail já cadastrado ou dados inválidos.";
        // Se for array de erros (class-validator), junta eles
        setRegisterError(Array.isArray(msg) ? msg.join(', ') : msg);
      } else {
        setRegisterError("Erro ao tentar registrar. Tente novamente.");
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper 
        elevation={0} // Flat design
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
        {/* Ícone de Destaque */}
        <Box sx={{ 
          backgroundColor: '#e8f5e9', // Fundo verde claro
          p: 2, 
          borderRadius: '50%', 
          mb: 2,
          color: '#1B5E20' 
        }}>
          <UserPlus size={40} strokeWidth={1.5} />
        </Box>

        <Typography component="h1" variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Criar Nova Conta
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 3, width: '100%' }}>
          
          {registerError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {registerError}
            </Alert>
          )}
          {registerSuccess && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {registerSuccess}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                label="Nome Completo"
                autoFocus
                {...register("name", { required: "Nome é obrigatório" })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Endereço de E-mail"
                autoComplete="email"
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Senha"
                type="password"
                id="password"
                {...register("password", { 
                  required: "Senha é obrigatória",
                  minLength: {
                    value: 6,
                    message: "A senha deve ter pelo menos 6 caracteres"
                  }
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.2 }}
          >
            Cadastrar
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                Já tem uma conta? <b>Faça login</b>
              </Link>
            </Grid>
          </Grid>

        </Box>
      </Paper>
    </Container>
  );
}