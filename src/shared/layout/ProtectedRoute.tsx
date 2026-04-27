import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';

export function ProtectedRoute() {
  const userId = useAuthStore((state) => state.userId);
  return userId ? <Outlet /> : <Navigate to="/login" replace />;
}
