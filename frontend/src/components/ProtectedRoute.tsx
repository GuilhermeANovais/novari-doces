// src/components/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  // Se não estiver autenticado, redireciona para o login
  if (!auth.isAuthenticated) {
    // 'replace' impede que o usuário volte para a rota protegida usando o botão "Voltar"
    // 'state' guarda a origem para redirecionar de volta após o login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se estiver autenticado, renderiza o conteúdo (DashboardLayout)
  return <>{children}</>;
}