import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[]; // Novo: Lista de cargos permitidos
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // 1. Verifica se está logado
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // 2. Verifica se tem o cargo correto (se a rota exigir restrição)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Se tentar aceder a algo proibido, redireciona para a "casa" do cargo dele
    if (user.role === 'DELIVERY') return <Navigate to="/delivery" />;
    if (user.role === 'KITCHEN') return <Navigate to="/production" />;
    
    // Fallback para admin ou outros
    return <Navigate to="/" />;
  }

  return children;
}