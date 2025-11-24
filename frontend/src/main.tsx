import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 1. Importação das Fontes (Inter)
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css'; // Adicionado peso 600 para semibold
import '@fontsource/inter/700.css';

// 2. Importação de Estilos Globais
import './index.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 3. Importações do Material UI e Contextos
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// --- Configuração do Tema "Clean UI" ---
const theme = createTheme(
  {
    typography: {
      // Define Inter como a fonte principal
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
      // Ajustes de tipografia para títulos
      h4: { fontWeight: 600, letterSpacing: '-0.5px', color: '#111827' },
      h5: { fontWeight: 600, letterSpacing: '-0.5px', color: '#111827' },
      h6: { fontWeight: 600, letterSpacing: '-0.5px', color: '#111827' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 500 }, // Remove caixa alta dos botões
    },
    palette: {
      primary: {
        main: '#1B5E20', // Verde Institucional
        light: '#4c8c4a',
        dark: '#003300',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#1a1a1a',
      },
      background: {
        default: '#ffffff', // Fundo Branco Puro (Estilo SaaS)
        paper: '#ffffff',
      },
      text: {
        primary: '#111827', // Preto suave (Cool Gray 900)
        secondary: '#6b7280', // Cinza médio (Cool Gray 500)
      },
      divider: '#e5e7eb', // Cinza muito claro para bordas
    },
    shape: {
      borderRadius: 8, // Bordas arredondadas globais (8px)
    },
    // --- Overrides (A Mágica do Flat Design) ---
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove gradientes
          },
          // Quando elevation={0}, adiciona uma borda sutil em vez de sombra
          elevation0: {
            border: '1px solid #e5e7eb', 
          },
          // Sombra muito suave e moderna para Modais e Dropdowns
          elevation1: {
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb', // Mantém uma borda leve mesmo com sombra
          },
          elevation3: {
             boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0, // AppBar sempre flat
        },
        styleOverrides: {
          root: {
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true, // Botões sem sombra por padrão
        },
        styleOverrides: {
          root: {
            borderRadius: '6px',
            paddingTop: '8px',
            paddingBottom: '8px',
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#144a18',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '6px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            color: '#374151',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          },
          root: {
            borderBottom: '1px solid #f3f4f6',
          },
        },
      },
    },
  },
  ptBR, // Configuração de localidade (DataGrid, etc)
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);