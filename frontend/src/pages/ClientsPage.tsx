// src/pages/ClientsPage.tsx
import { Box, Typography, Button, IconButton, Snackbar, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api';
import { ClientModal } from '../components/ClientModal'; // Importe o novo modal

// Interface para o Cliente
interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

// Tipo para o estado do snackbar
type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} | null;

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);

  // Funções do Modal
  const handleOpenModal = (client: Client | null) => {
    setClientToEdit(client);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setClientToEdit(null);
  };

  // Função para buscar os dados
  async function fetchClients() {
    setLoading(true);
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setSnackbar({ open: true, message: 'Erro ao buscar clientes.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Função de deletar
  async function handleDelete(id: number) {
    if (window.confirm("Tem certeza que deseja deletar este cliente?")) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients(); // Recarrega a tabela
        setSnackbar({ open: true, message: 'Cliente deletado com sucesso!', severity: 'success' });
      } catch (error) {
        console.error("Erro ao deletar cliente:", error);
        setSnackbar({ open: true, message: 'Erro ao deletar cliente.', severity: 'error' });
      }
    }
  }

  // Função de fechar o snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  // Definição das Colunas
  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nome', width: 250 },
    { field: 'phone', headerName: 'Telefone', width: 150 },
    { field: 'address', headerName: 'Endereço', flex: 1 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box>
            <IconButton onClick={() => handleOpenModal(params.row)} color="primary">
              <Edit />
            </IconButton>
            <IconButton onClick={() => handleDelete(params.row.id)} color="error">
              <Delete />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  // useEffect
  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Clientes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenModal(null)} // "null" significa "Novo Cliente"
        >
          Novo Cliente
        </Button>
      </Box>

      {/* --- TABELA DE DADOS --- */}
      <Box sx={{ height: 500, width: '100%', backgroundColor: 'white' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 20]}
        />
      </Box>

      {/* --- MODAL --- */}
      <ClientModal
        open={openModal}
        handleClose={handleCloseModal}
        onSave={fetchClients}
        clientToEdit={clientToEdit}
        setSnackbar={setSnackbar}
      />

      {/* --- SNACKBAR --- */}
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}