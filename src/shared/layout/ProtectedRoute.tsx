import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../app/store/auth.store';
import { votifyApi } from '../facade/VotifyApiFacade';
import Spinner from '../components/ui/Spinner';
import { UserRole } from '../../shared/types/domain';

type Props = { requiredRole: UserRole };

export function ProtectedRoute({ requiredRole }: Props) {
  const userId = useAuthStore((state) => state.userId);
  const perfil = useAuthStore((state) => state.perfil);
  const roles = useAuthStore((state) => state.roles);
  const setSession = useAuthStore((state) => state.setSession);
  const [cargando, setCargando] = useState(Boolean(userId && (!perfil || roles.length === 0)));

  useEffect(() => {
    if (!userId || (perfil && roles.length > 0)) {
      setCargando(false);
      return;
    }

    votifyApi.me(userId)
      .then((data: any) => setSession({ userId, perfil: data.perfil, roles: data.roles ?? [] }))
      .catch(() => undefined)
      .finally(() => setCargando(false));
  }, [userId, perfil, roles, setSession]);

  if (!userId) return <Navigate to="/login" replace />;

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!roles.includes(requiredRole)) return <Navigate to="/acceso" replace />;

  return <Outlet />;
}
