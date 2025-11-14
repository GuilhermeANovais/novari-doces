// src/pages/RegisterPage.tsx
import { Box, Typography, TextField, Button, Container, CssBaseline, Paper, Alert, Grid, Link } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // 1. Importe Link
import axios, { AxiosError } from 'axios';

// 2. Defina os tipos de dados do formulário (com "name")
type RegisterFormInputs = {
  name: string;
  email: string;
  password: string;
};

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>();
  const navigate = useNavigate();
  
  // Estados para sucesso e erro
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      // 3. Chame o endpoint de registro
      await axios.post('http://localhost:3000/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // 4. Se correu bem, mostre sucesso e redirecione
      setRegisterSuccess("Cadastro realizado com sucesso! Redirecionando para o login...");
      
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Aguarda 2 segundos antes de redirecionar

    } catch (error) {
      console.error("Erro no registro:", error);
      if (axios.isAxiosError(error) && error.response) {
        // Tenta pegar uma mensagem mais específica (ex: email já existe)
        const msg = error.response.data?.message || "E-mail já cadastrado ou dados inválidos.";
        setRegisterError(msg);
      } else {
        setRegisterError("Erro ao tentar registrar. Tente novamente.");
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
          Cadastrar
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
          
          {/* Alertas de Erro ou Sucesso */}
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

          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome Completo"
            autoFocus
            {...register("name", { required: "Nome é obrigatório" })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          
          <TextField
            margin="normal"
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

          <TextField
            margin="normal"
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
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Cadastrar
          </Button>
          
          {/* Link para voltar ao Login */}
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Já tem uma conta? Faça login
              </Link>
            </Grid>
          </Grid>

        </Box>
      </Paper>
    </Container>
  );
}