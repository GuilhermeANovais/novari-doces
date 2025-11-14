// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Defina a "forma" do nosso contexto
interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// 2. Crie o Contexto
// O '!' diz ao TypeScript que vamos fornecer um valor (via Provider)
const AuthContext = createContext<AuthContextType>(null!);

// 3. Crie um Hook customizado para facilitar o uso
export function useAuth() {
  return useContext(AuthContext);
}

// 4. Crie o "Provedor"
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 5. Tente pegar o token salvo no localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));

  // 6. Crie os valores que o contexto irá fornecer
  
  // Função de Login: salva o token no estado E no localStorage
  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  // Função de Logout: limpa o estado E o localStorage
  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  // Valor booleano para facilitar a checagem
  const isAuthenticated = !!token;

  const value = {
    token,
    login,
    logout,
    isAuthenticated,
  };

  // 7. Retorne o Provedor com os valores
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}