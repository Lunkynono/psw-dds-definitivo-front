import { Calendar, ChevronRight, MapPin, Plus, Trophy } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis eventos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tus competiciones y encuestas</p>
        </div>
        <Link to="/admin/eventos/nuevo">
          <Button>
            <Plus size={16} />
            Nuevo evento
          </Button>
        </Link>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-indigo-400" />
          </div>
          <p className="font-semibold text-gray-700">No tienes eventos aún</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Crea tu primer evento para empezar</p>
          <Link to="/admin/eventos/nuevo">
            <Button size="sm">
              <Plus size={14} /> Crear evento
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => (
            <Link
              key={evento.id}
              to={`/admin/eventos/${evento.id}/editar`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:border-gray-200 transition-all duration-200"
            >
              {evento.imagen_url ? (
                <img src={evento.imagen_url} alt={evento.nombre} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                  <Calendar size={32} className="text-indigo-200" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug">
                    {evento.nombre}
                  </h2>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
                </div>

                {evento.lugar && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                    <MapPin size={12} />
                    {evento.lugar}
                  </p>
                )}
                {evento.descripcion && (
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1.5">{evento.descripcion}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  {(evento as any).competicion?.[0]?.count != null ? (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Trophy size={10} />
                      {(evento as any).competicion[0].count} {(evento as any).competicion[0].count === 1 ? 'competición' : 'competiciones'}
                    </span>
                  ) : <span />}
                  {evento.created_at && (
                    <p className="text-xs text-gray-300">
                      {new Date(evento.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
