import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useIsAdmin } from '../hooks/useAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * 管理员路由保护组件
 * 只有管理员可以访问
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const isAdmin = useIsAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
