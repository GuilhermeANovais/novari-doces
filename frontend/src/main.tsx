import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Fontes
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Estilos Globais
import './index.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Contextos
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { BrowserRouter } from 'react-router-dom';

// --- Imports do React Query ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// --- Configuração do Tema "Clean UI" ---
const theme = createTheme(
  {
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: { fontWeight: 600, letterSpacing: '-0.5px', color: '#111827' },
      h5: { fontWeight: 600, letterSpacing: '-0.5px', color: '#111827' },
      h6: { fontWeight: 600, letterSpacing: '-0.5px', color: '#111827' },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    palette: {
      primary: {
        main: '#1b5e20ff',
        light: '#4c8c4a',
        dark: '#003300',
        contrastText: '#ffffff',
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      text: {
        primary: '#111827',
        secondary: '#6b7280',
      },
      divider: '#e5e7eb',
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation0: { border: '1px solid #e5e7eb' },
          elevation1: {
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: '6px',
            paddingTop: '8px',
            paddingBottom: '8px',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: { '& .MuiOutlinedInput-root': { borderRadius: '6px' } },
        },
      },
    },
  },
  ptBR,
);

// --- Criação do Cliente React Query ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita recarregar dados sempre que muda de janela
      staleTime: 1000 * 60 * 5, // Dados são considerados "frescos" por 5 minutos
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
      {/* DevTools ajudam a visualizar o estado do cache (apenas em dev) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
