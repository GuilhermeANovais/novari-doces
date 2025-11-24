// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Nossas cores
const verdeEscuro = '#1B5E20'; // Um verde escuro forte
const brancoGelo = '#F5F5F5'; // Um "off-white" / gelo

const theme = createTheme({
  palette: {
    // O "Verde Escuro" será nossa cor primária
    primary: {
      main: verdeEscuro,
    },
    // O "Branco Gelo" será o fundo
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF', // O fundo de "cartões", menus, etc.
    },
  },
});

export default theme;