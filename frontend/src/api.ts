// src/api.ts
import axios from 'axios';

// 1. Crie a instância base do Axios
const api = axios.create({
  baseURL: 'http://localhost:3000', // A URL base do seu backend
});

// 2. Defina o Intercetor
// Isto corre ANTES de cada pedido ser enviado
api.interceptors.request.use(
  (config) => {
    // 3. Pegue o token do localStorage
    const token = localStorage.getItem('token');
    
    // 4. Se o token existir, adicione-o ao cabeçalho 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Em caso de erro no pedido
    return Promise.reject(error);
  }
);

export default api;