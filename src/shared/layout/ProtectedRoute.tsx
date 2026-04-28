import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../app/store/auth.store';
import { votifyApi } from '../facade/VotifyApiFacade';
import Spinner from '../components/ui/Spinner';

export function ProtectedRoute() {
  const userId = useAuthStore((state) => state.userId);
  const perfil = useAuthStore((state) => state.perfil);
  const rol = useAuthStore((state) => state.rol);
  const setSession = useAuthStore((state) => state.setSession);
  const [cargando, setCargando] = useState(Boolean(userId && (!perfil || !rol)));

  useEffect(() => {
    if (!userId || (perfil && rol)) {
      setCargando(false);
      return;
    }

    votifyApi.me(userId)
      .then((data: any) => setSession({ userId, perfil: data.perfil, rol: data.rol }))
      .catch(() => undefined)
      .finally(() => setCargando(false));
  }, [userId, perfil, rol, setSession]);

  if (!userId) return <Navigate to="/login" replace />;

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <Outlet />;
}
