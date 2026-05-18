import { ChevronDown, ClipboardList, Mail, Save, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Badge } from '../../shared/components/ui/Badge';
import { Breadcrumb } from '../../shared/components/ui/Breadcrumb';
import Spinner from '../../shared/components/ui/Spinner';
import { Button } from '../../shared/components/ui/Button';
import { ProjectFileLink } from '../../shared/components/project/ProjectFileLink';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';

type ParticipantDashboard = {
  participante: { id: number; nombre: string; correo: string; rol?: string | null };
  equipo?: { id: number; nombre: string } | null;
  proyecto?: { id: number; nombre: string; descripcion?: string | null; archivo_url?: string | null; archivo_nombre?: string | null; archivo_tamano?: number | null } | null;
  proyectos: Array<{ id: number; nombre: string; descripcion?: string | null; archivo_url?: string | null; archivo_nombre?: string | null; archivo_tamano?: number | null }>;
  competicion?: { id: number; nombre: string; descripcion?: string | null } | null;
  evento?: { id: number; nombre: string; lugar?: string | null } | null;
  companeros: Array<{ id: number; nombre: string; correo: string; rol?: string | null }>;
  encuestas: Array<{ id: number; nombre: string; estado: string; tipo_votante: string; hora_apertura?: string | null; hora_cierre?: string | null }>;
  jueces: Array<{ persona_id: string; persona?: { nombre?: string; correo?: string } }>;
  estadoParticipacion: string;
  participaciones?: ParticipantDashboard[];
};

const estadoColor = (estado: string): 'gray' | 'green' | 'yellow' | 'red' | 'blue' => {
  if (estado === 'abierta') return 'green';
  if (estado === 'programada') return 'yellow';
  if (estado === 'cerrada') return 'red';
  if (estado === 'borrador') return 'gray';
  return 'blue';
};

export function ParticipantDashboardPage() {
  const { participantId } = useParams();
  const [searchParams] = useSearchParams();
  const userId = useAuthStore((state) => state.userId);
  const roles = useAuthStore((state) => state.roles);
  const [data, setData] = useState<ParticipantDashboard | null>(null);
  const [mensajeVacio, setMensajeVacio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState({ nombre: '', correo: '', rol: '' });
  const [guardando, setGuardando] = useState(false);
  const ultimaCarga = useRef('');

  useEffect(() => {
    async function cargar() {
      const correo = searchParams.get('correo') ?? '';
      if (!userId && !participantId && !correo) { setCargando(false); return; }
      const claveCarga = participantId ? `id:${participantId}` : correo ? `correo:${correo}` : `user:${userId}`;
      if (ultimaCarga.current === claveCarga) return;
      ultimaCarga.current = claveCarga;
      setCargando(true);
      setMensajeVacio('');
      try {
        const result = participantId
          ? await votifyApi.getParticipantDashboard(Number(participantId))
          : correo
            ? await votifyApi.getParticipantDashboardByEmail(correo)
            : await votifyApi.getMyParticipantDashboard(userId!);
        const dashboard = result as ParticipantDashboard;
        setData(dashboard);
        setEditando({
          nombre: dashboard.participante.nombre ?? '',
          correo: dashboard.participante.correo ?? '',
          rol: dashboard.participante.rol ?? ''
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar el participante';
        setMensajeVacio(message);
        toast.error(message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [participantId, searchParams, userId]);

  if (cargando) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <p className="text-sm text-gray-500 text-center py-10">
          {mensajeVacio || 'No hay informacion de participante disponible.'}
        </p>
      </Layout>
    );
  }

  async function guardarParticipante() {
    if (!participantId) return;
    if (!editando.nombre.trim() || !editando.correo.trim()) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await votifyApi.updateParticipant(Number(participantId), {
        nombre: editando.nombre.trim(),
        correo: editando.correo.trim(),
        rol: editando.rol.trim() || null
      });
      setData(actualizado as ParticipantDashboard);
      toast.success('Participante actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  const puedeEditar = Boolean(participantId && roles.includes('admin'));
  const participacionesVisibles = data.participaciones?.map((participacion) => ({
    ...participacion,
    encuestas: participacion.encuestas.filter((encuesta) => encuesta.estado !== 'borrador')
  })) ?? [];
  const participacionesResumen = participacionesVisibles.length > 0 ? participacionesVisibles : [data];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-5">
        <Breadcrumb items={[
          { label: participantId ? 'Mis eventos' : 'Participante', to: participantId ? '/admin' : undefined },
          ...(participantId && data.competicion ? [{ label: data.competicion.nombre, to: `/admin/competiciones/${data.competicion.id}` }] : []),
          { label: data.participante.nombre }
        ]} />

        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{data.evento?.nombre ?? 'Evento'}</p>
              {puedeEditar ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-[1.2fr_1.2fr_0.8fr_auto]">
                  <input value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Nombre" />
                  <input value={editando.correo} onChange={(e) => setEditando({ ...editando, correo: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Correo" />
                  <input value={editando.rol} onChange={(e) => setEditando({ ...editando, rol: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Rol" />
                  <Button size="sm" loading={guardando} onClick={guardarParticipante}>
                    <Save size={14} /> Guardar
                  </Button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{data.participante.nombre}</h1>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1"><Mail size={14} />{data.participante.correo}</span>
                {data.participante.rol && <Badge color="blue">{data.participante.rol}</Badge>}
                <Badge color={data.proyecto ? 'green' : 'yellow'}>{data.estadoParticipacion}</Badge>
              </div>
            </div>
            <div className="text-sm text-right">
              <p className="font-semibold text-gray-800">{data.equipo?.nombre ?? 'Sin equipo'}</p>
              <p className="text-gray-500">{data.competicion?.nombre ?? 'Sin competición'}</p>
            </div>
          </div>
        </section>

        <details open className="group/project-section bg-white border border-gray-200 rounded-xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Proyectos y equipos</h2>
            </div>
            <ChevronDown size={16} className="text-gray-400 transition-transform group-open/project-section:rotate-180" />
          </summary>

          <div className="space-y-3 border-t border-gray-100 p-5">
            {participacionesResumen.map((participacion, index) => (
              <details
                key={participacion.participante.id}
                open={index === 0}
                className="group rounded-lg border border-gray-100 bg-white"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{participacion.equipo?.nombre ?? 'Sin equipo'}</p>
                    <p className="text-xs text-gray-500">{participacion.competicion?.nombre ?? 'Sin competicion'}</p>
                    <p className="text-xs text-gray-400">{participacion.evento?.nombre ?? 'Evento'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={participacion.proyectos.length ? 'green' : 'yellow'}>
                      {participacion.estadoParticipacion}
                    </Badge>
                    <ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                <div className="grid gap-4 border-t border-gray-100 p-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">Proyectos</h3>
                    <div className="space-y-2">
                      {participacion.proyectos.map((proyecto) => (
                        <div key={proyecto.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="text-sm font-medium text-gray-800">{proyecto.nombre}</p>
                          {proyecto.descripcion && <p className="text-xs text-gray-500 mt-0.5">{proyecto.descripcion}</p>}
                          <ProjectFileLink project={proyecto} />
                        </div>
                      ))}
                      {participacion.proyectos.length === 0 && <p className="text-sm text-gray-500">Sin proyectos asociados.</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">Compañeros</h3>
                    <div className="space-y-2">
                      {participacion.companeros.map((companero) => (
                        <Link
                          key={companero.id}
                          to={`/participante/dashboard?correo=${encodeURIComponent(companero.correo)}`}
                          className="block rounded-lg border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/40"
                        >
                          <p className="text-sm font-medium text-gray-800">{companero.nombre}</p>
                          <p className="text-xs text-gray-500">{companero.correo}{companero.rol ? ` · ${companero.rol}` : ''}</p>
                        </Link>
                      ))}
                      {participacion.companeros.length === 0 && <p className="text-sm text-gray-500">No hay más participantes en el equipo.</p>}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </details>

        {participacionesVisibles.length > 1 && (
          <details open className="group/participaciones bg-white border border-gray-200 rounded-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Participaciones</h2>
                <Badge color="blue">{participacionesVisibles.length}</Badge>
              </div>
              <ChevronDown size={16} className="text-gray-400 transition-transform group-open/participaciones:rotate-180" />
            </summary>
            <div className="space-y-3 border-t border-gray-100 p-5">
              {participacionesVisibles.map((participacion, index) => (
                <details
                  key={participacion.participante.id}
                  open={index === 0}
                  className="group rounded-lg border border-gray-100 bg-white"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {participacion.evento?.nombre ?? 'Evento'}
                      </p>
                      <p className="font-semibold text-gray-900">{participacion.competicion?.nombre ?? 'Sin competicion'}</p>
                      <p className="text-sm text-gray-500">{participacion.equipo?.nombre ?? 'Sin equipo'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={participacion.proyectos.length ? 'green' : 'yellow'}>
                        {participacion.estadoParticipacion}
                      </Badge>
                      <ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    {participacion.proyectos.length > 0 && (
                      <div className="space-y-2">
                        {participacion.proyectos.map((proyecto) => (
                          <div key={proyecto.id} className="rounded-md bg-gray-50 px-3 py-2">
                            <p className="text-sm font-medium text-gray-800">{proyecto.nombre}</p>
                            {proyecto.descripcion && <p className="text-xs text-gray-500 mt-0.5">{proyecto.descripcion}</p>}
                            <ProjectFileLink project={proyecto} />
                          </div>
                        ))}
                      </div>
                    )}

                    {participacion.encuestas.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {participacion.encuestas.map((encuesta) => (
                          <Link
                            key={encuesta.id}
                            to={`/participante/encuestas/${encuesta.id}/resultados`}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            {encuesta.nombre}
                            <Badge color={estadoColor(encuesta.estado)}>{encuesta.estado}</Badge>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">No hay encuestas asociadas al equipo.</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </details>
        )}

        <div className="hidden">
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Proyecto</h2>
            </div>
            {data.proyectos.length === 0 ? (
              <p className="text-sm text-gray-500">El equipo todavía no tiene proyecto asociado.</p>
            ) : (
              <div className="space-y-3">
                {data.proyectos.map((proyecto) => (
                  <div key={proyecto.id} className="border border-gray-100 rounded-lg p-3">
                    <p className="font-medium text-gray-800">{proyecto.nombre}</p>
                    {proyecto.descripcion && <p className="text-sm text-gray-500 mt-1">{proyecto.descripcion}</p>}
                    <ProjectFileLink project={proyecto} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Equipo</h2>
            </div>
            <p className="font-medium text-gray-800 mb-3">{data.equipo?.nombre ?? 'Sin equipo'}</p>
            <div className="space-y-2">
              {data.companeros.map((companero) => (
                <Link
                  key={companero.id}
                  to={`/participante/dashboard?correo=${encodeURIComponent(companero.correo)}`}
                  className="block rounded-lg border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <p className="text-sm font-medium text-gray-800">{companero.nombre}</p>
                  <p className="text-xs text-gray-500">{companero.correo}{companero.rol ? ` · ${companero.rol}` : ''}</p>
                </Link>
              ))}
              {data.companeros.length === 0 && <p className="text-sm text-gray-500">No hay más participantes en el equipo.</p>}
            </div>
          </section>
        </div>

      </div>
    </Layout>
  );
}
