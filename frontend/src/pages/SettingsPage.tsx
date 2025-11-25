import { Box, Typography, TextField, Button, Paper, Snackbar, Alert, Divider } from '@mui/material';
import { Save, UserCog } from 'lucide-react'; // Ícones
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import api from '../api';

type SettingsFormInputs = {
  name: string;
  password?: string;
  confirmPassword?: string;
};

export function SettingsPage() {
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<SettingsFormInputs>();
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);

  const onSubmit: SubmitHandler<SettingsFormInputs> = async (data) => {
    // Validação de senha
    if (data.password && data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'As senhas não coincidem' });
      return;
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.password) updateData.password = data.password;

    try {
      await api.patch('/users/profile', updateData);
      setSnackbar({ open: true, message: 'Perfil atualizado com sucesso!', severity: 'success' });
      reset({ name: data.name, password: '', confirmPassword: '' }); // Limpa senhas
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setSnackbar({ open: true, message: 'Erro ao atualizar perfil.', severity: 'error' });
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a', mb: 4 }}>
        Configurações
      </Typography>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: 'white' }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: '50%', color: '#1B5E20' }}>
            <UserCog size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>Perfil do Usuário</Typography>
            <Typography variant="body2" color="text.secondary">Atualize suas informações de acesso</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Novo Nome (Opcional)"
            fullWidth
            margin="normal"
            {...register("name")}
            helperText="Deixe em branco para manter o atual"
          />

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, color: '#374151' }}>
            Alterar Senha
          </Typography>

          <TextField
            label="Nova Senha"
            type="password"
            fullWidth
            margin="normal"
            {...register("password", { minLength: { value: 6, message: "Mínimo de 6 caracteres" } })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <TextField
            label="Confirmar Nova Senha"
            type="password"
            fullWidth
            margin="normal"
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            startIcon={<Save size={20} />}
            sx={{ mt: 4, borderRadius: 2, py: 1.5 }}
          >
            Salvar Alterações
          </Button>
        </Box>
      </Paper>

      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}