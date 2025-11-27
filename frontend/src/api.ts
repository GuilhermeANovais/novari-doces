// frontend/src/api.ts
import axios from 'axios';

// Lê a URL do .env ou usa localhost como fallback
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: baseURL,
});

// 1. Intercetor de PEDIDOS (Requests)
// Adiciona o token antes de enviar qualquer coisa
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Intercetor de RESPOSTAS (Responses) -- A NOVIDADE AQUI
// Vigia se o backend devolve erros
api.interceptors.response.use(
  (response) => {
    // Se correr tudo bem, deixa passar
    return response;
  },
  (error) => {
    // Se o erro for 401 (Não autorizado / Token expirado)
    if (error.response && error.response.status === 401) {
      console.warn('Sessão expirada. A redirecionar para login...');
      
      // Limpa o lixo local
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Se tiveres dados do user guardados

      // Redireciona forçadamente para o login
      // Usamos window.location porque este ficheiro não é um componente React
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;