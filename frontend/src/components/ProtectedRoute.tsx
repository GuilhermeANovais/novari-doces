// src/components/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation(); // Pega a localização atual

  if (!auth.isAuthenticated) {
    // redirecione para /login
    // 'replace' troca a rota no histórico (o usuário não pode "voltar" para cá)
    // 'state' guarda a página que ele tentou acessar
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}