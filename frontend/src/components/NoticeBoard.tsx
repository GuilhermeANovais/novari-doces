import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, IconButton, List, ListItem, 
  ListItemText, Divider, TextField, Button, Chip, CircularProgress 
} from '@mui/material';
import { Bell, Trash2, Send, Pin } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

interface Notice {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export function NoticeBoard() {
  const { user } = useAuth(); // Para saber se posso apagar (opcional)
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form de novo aviso
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices');
      setNotices(response.data);
    } catch (error) {
      console.error("Erro ao buscar avisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    // Atualiza a cada 30 segundos para pegar recados novos
    const interval = setInterval(fetchNotices, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/notices', { title, content });
      setTitle('');
      setContent('');
      fetchNotices(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao postar aviso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apagar este aviso?")) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Erro ao apagar");
    }
  };

  // Função para dar cor ao cargo
  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'error';
    if (role === 'KITCHEN') return 'warning';
    return 'success'; // DELIVERY
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Pin size={18} color="#f59e0b" fill="#f59e0b" />
        <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
          Mural de Avisos
        </Typography>
      </Box>

      {/* Lista de Avisos */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0, bgcolor: 'white' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24}/></Box>
        ) : notices.length === 0 ? (
          <Box textAlign="center" p={4} color="text.disabled">
            <Bell size={32} style={{ marginBottom: 8, opacity: 0.2 }} />
            <Typography variant="body2">Nenhum aviso recente.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notices.map((notice) => (
              <Box key={notice.id}>
                <ListItem alignItems="flex-start" 
                  secondaryAction={
                    // Só mostra lixeira para Admin ou dono do post (opcional)
                    (user?.role === 'ADMIN' || user?.name === notice.user.name) && (
                      <IconButton edge="end" size="small" onClick={() => handleDelete(notice.id)}>
                        <Trash2 size={14} color="#9ca3af" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {notice.title}
                        </Typography>
                        <Chip 
                          label={notice.user.name.split(' ')[0]} 
                          size="small" 
                          variant="outlined"
                          color={getRoleColor(notice.user.role) as any}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notice.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                        {notice.content}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))}
          </List>
        )}
      </Box>

      {/* Área de Escrever */}
      <Box component="form" onSubmit={handlePost} sx={{ p: 2, bgcolor: '#f9fafb', borderTop: '1px solid #eee' }}>
        <TextField
          placeholder="Título"
          variant="standard"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          inputProps={{ maxLength: 50 }}
          sx={{ mb: 1 }}
        />
        <Box display="flex" gap={1}>
          <TextField
            placeholder="Escreva um aviso para a equipe..."
            variant="outlined"
            size="small"
            fullWidth
            multiline
            maxRows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            inputProps={{ maxLength: 200 }}
            sx={{ bgcolor: 'white' }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={!title || !content || isSubmitting}
            sx={{ minWidth: 40, px: 0, borderRadius: 1 }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit"/> : <Send size={18} />}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}