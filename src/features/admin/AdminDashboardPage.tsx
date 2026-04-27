import { Calendar, MapPin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Button } from '../../shared/components/ui/Button';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import { EventSummary } from '../../shared/types/domain';

export function AdminDashboardPage() {
  const userId = useAuthStore((state) => state.userId);
  const [eventos, setEventos] = useState<EventSummary[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarEventos() {
      if (!userId) return;
      try {
        setEventos(await votifyApi.getAdminEvents(userId));
      } catch {
        toast.error('Error al cargar eventos');
      } finally {
        setCargando(false);
      }
    }

    cargarEventos();
  }, [userId]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis eventos</h1>
        <Link to="/admin/eventos/nuevo">
          <Button>
            <Plus size={16} />
            Nuevo evento
          </Button>
        </Link>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tienes eventos aún</p>
          <p className="text-sm mt-1">Crea tu primer evento para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => (
            <Link
              key={evento.id}
              to={`/admin/eventos/${evento.id}/editar`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900 mb-2">{evento.nombre}</h2>
              {evento.lugar && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                  <MapPin size={14} />
                  {evento.lugar}
                </p>
              )}
              {evento.descripcion && <p className="text-sm text-gray-500 line-clamp-2 mt-2">{evento.descripcion}</p>}
              {evento.created_at && (
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(evento.created_at).toLocaleDateString('es-ES')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
