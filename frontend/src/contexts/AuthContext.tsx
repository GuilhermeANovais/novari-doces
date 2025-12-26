import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types/entities'; 

interface AuthContextType {
  token: string | null;
  user: User | null; // <--- NOVO: Guardamos o utilizador completo
  login: (token: string, user: User) => void; // <--- NOVO: Recebe user no login
  logout: () => void;
  isAuthenticated: boolean;
}

// O '!' diz ao TypeScript que vamos fornecer um valor (via Provider)
const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 1. Inicializa o token do localStorage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  
  // 2. Inicializa o user do localStorage (se existir)
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Função de Login: salva token e user no estado E no localStorage
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Função de Logout: limpa tudo
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token;

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
