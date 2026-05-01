import { AlertTriangle, BarChart2, Bell, CheckCircle, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Badge } from '../../shared/components/ui/Badge';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import { Survey } from '../../shared/types/domain';

type Project = { id: number; nombre: string; descripcion?: string | null };
type JudgeSurvey = Survey & {
  proyectos?: Project[];
  pendientes?: Project[];
};

export function JudgeDashboardPage() {
  const userId = useAuthStore((state) => state.userId);
  const [encuestas, setEncuestas] = useState<JudgeSurvey[]>([]);
  const [cargando, setCargando] = useState(true);
  const notificacionCierreMostrada = useRef(false);
  const notificacionAperturaMostrada = useRef(false);

  function scrollToEncuesta(id: number) {
    document.getElementById(`encuesta-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const { cerrandoProximas, recienAbiertas } = useMemo(() => {
    const now = Date.now();
    const CIERRE_MS = 5 * 60 * 1000;
    const APERTURA_MS = 10 * 60 * 1000;
    return {
      cerrandoProximas: encuestas.filter((e) => {
        if (e.estado !== 'abierta' || !e.hora_cierre) return false;
        const diff = new Date(e.hora_cierre).getTime() - now;
        return diff > 0 && diff <= CIERRE_MS;
      }),
      recienAbiertas: encuestas.filter((e) => {
        if (e.estado !== 'abierta' || !e.hora_apertura) return false;
        const diff = now - new Date(e.hora_apertura).getTime();
        return diff >= 0 && diff <= APERTURA_MS;
      }),
    };
  }, [encuestas]);

  useEffect(() => {
    if (recienAbiertas.length > 0 && !notificacionAperturaMostrada.current) {
      notificacionAperturaMostrada.current = true;
      recienAbiertas.forEach((e) => {
        toast(
          (t) => (
            <div
              className="flex items-start gap-2 cursor-pointer"
              onClick={() => { toast.dismiss(t.id); scrollToEncuesta(e.id); }}
            >
              <Bell size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{e.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">Acaba de abrirse — ya puedes votar</p>
              </div>
            </div>
          ),
          {
            duration: 10000,
            style: {
              background: '#eef2ff',
              border: '1px solid #a5b4fc',
              borderRadius: '12px',
              padding: '12px 14px',
            },
          }
        );
      });
    }
  }, [recienAbiertas]);

  useEffect(() => {
    if (cerrandoProximas.length > 0 && !notificacionCierreMostrada.current) {
      notificacionCierreMostrada.current = true;
      cerrandoProximas.forEach((e) => {
        const pendientes = (e.pendientes ?? e.proyectos ?? []).length;
        toast(
          (t) => (
            <div
              className="flex items-start gap-2 cursor-pointer"
              onClick={() => { toast.dismiss(t.id); scrollToEncuesta(e.id); }}
            >
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{e.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cierra en menos de 5 minutos
                  {pendientes > 0 && ` · ${pendientes} proyecto${pendientes !== 1 ? 's' : ''} sin evaluar`}
                </p>
              </div>
            </div>
          ),
          {
            duration: 10000,
            style: {
              background: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '12px',
              padding: '12px 14px',
            },
          }
        );
      });
    }
  }, [cerrandoProximas]);

  useEffect(() => {
    async function cargarEncuestas() {
      if (!userId) return;
      setCargando(true);
      try {
        setEncuestas(await votifyApi.getJudgeSurveys(userId) as JudgeSurvey[]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar tus encuestas');
      } finally {
        setCargando(false);
      }
    }

    cargarEncuestas();
  }, [userId]);

  if (cargando) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel del juez</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tus encuestas asignadas y proyectos pendientes de evaluación</p>
      </div>

      {(recienAbiertas.length > 0 || cerrandoProximas.length > 0) && (
        <div className="space-y-2 mb-5">
          {recienAbiertas.map((e) => (
            <div
              key={`apertura-${e.id}`}
              onClick={() => scrollToEncuesta(e.id)}
              className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-indigo-100 transition-colors"
            >
              <Bell size={15} className="text-indigo-500 flex-shrink-0" />
              <p className="text-sm text-indigo-800">
                <span className="font-semibold">{e.nombre}</span> acaba de abrirse — ya puedes votar
              </p>
            </div>
          ))}
          {cerrandoProximas.map((e) => {
            const mins = Math.max(1, Math.round((new Date(e.hora_cierre!).getTime() - Date.now()) / 60000));
            const pendientes = (e.pendientes ?? e.proyectos ?? []).length;
            return (
              <div
                key={`cierre-${e.id}`}
                onClick={() => scrollToEncuesta(e.id)}
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{e.nombre}</span> cierra en {mins} minuto{mins !== 1 ? 's' : ''}
                  {pendientes > 0 && <span className="font-semibold"> · {pendientes} proyecto{pendientes !== 1 ? 's' : ''} sin evaluar</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {encuestas.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay encuestas abiertas asignadas</p>
          <p className="text-sm mt-1 text-gray-400">El organizador debe asignarte a una encuesta</p>
        </div>
      ) : (
        <div className="space-y-4">
          {encuestas.map((encuesta) => {
            const proyectos = encuesta.proyectos ?? [];
            const pendientes = encuesta.pendientes ?? proyectos;

            return (
              <div key={encuesta.id} id={`encuesta-${encuesta.id}`} className="bg-white shadow-card border border-gray-100 rounded-xl p-5 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{encuesta.nombre}</h2>
                    <p className="text-sm text-gray-500">
                      {encuesta.competicion?.nombre} · {encuesta.competicion?.evento?.nombre}
                    </p>
                  </div>

                  {pendientes.length === 0 ? (
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/encuestas/${encuesta.id}/resultados`}
                        state={{ from: 'juez' }}
                        className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                      >
                        <BarChart2 size={14} />
                        Ver resultados
                      </Link>
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle size={16} />
                        Completado
                      </div>
                    </div>
                  ) : (
                    <Badge color="yellow">
                      {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {proyectos.length === 0 ? (
                  <p className="text-sm text-gray-400">Los proyectos se cargarán desde el formulario de votación.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {proyectos.map((proyecto) => {
                      const votado = !pendientes.find((pendiente) => pendiente.id === proyecto.id);
                      return (
                        <div
                          key={proyecto.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            votado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{proyecto.nombre}</p>
                            {proyecto.descripcion && <p className="text-xs text-gray-500 line-clamp-1">{proyecto.descripcion}</p>}
                          </div>

                          {votado ? (
                            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <Link
                              to={`/juez/encuesta/${encuesta.id}/proyecto/${proyecto.id}`}
                              className="text-sm text-indigo-600 font-medium hover:underline whitespace-nowrap ml-2"
                            >
                              Evaluar
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
