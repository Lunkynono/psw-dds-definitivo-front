import { Clock, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Breadcrumb } from '../../shared/components/ui/Breadcrumb';
import { Button } from '../../shared/components/ui/Button';
import { Modal } from '../../shared/components/ui/Modal';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import { ResultRow, Survey, SurveyState } from '../../shared/types/domain';
import {
  DATETIME_INPUT_CLASS,
  datetimeLocalMasMinutos,
  datetimeLocalToIso,
  etiquetaAperturaEncuesta,
  etiquetaCierre,
  formatFechaLocal,
  isoToDatetimeLocal,
  limitarDatetimeLocal,
  nowDatetimeLocal,
  validarHorarioEncuesta
} from '../../shared/utils/dateTime';

type Comentario = { texto: string; criterio: string; proyecto: string; origen: 'Público' | 'Jurado' };

const TABS = ['Ranking', 'Comentarios', 'Criterios', 'Asignaciones'];

const STATE_LABEL: Record<SurveyState, string> = {
  borrador: 'Borrador',
  abierta: 'Abierta',
  programada: 'Programada',
  cerrada: 'Cerrada'
};

const STATE_COLOR: Record<SurveyState, 'gray' | 'green' | 'yellow' | 'red'> = {
  borrador: 'gray',
  abierta: 'green',
  programada: 'yellow',
  cerrada: 'red'
};

export function SurveyResultsPage() {
  const { surveyId } = useParams();
  const [encuesta, setEncuesta] = useState<Survey | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [tab, setTab] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [editManual, setEditManual] = useState<Record<number, string>>({});
  const [guardandoManual, setGuardandoManual] = useState<Record<number, boolean>>({});

  type EquipoDisponible = { id: number; nombre: string; proyecto?: Array<{ nombre: string }> };
  type JuezDisponible = { persona_id: string; persona?: { nombre?: string; correo?: string } };
  const [equiposDisponibles, setEquiposDisponibles] = useState<EquipoDisponible[]>([]);
  const [equiposAsignados, setEquiposAsignados] = useState<number[]>([]);
  const [juecesDisponibles, setJuecesDisponibles] = useState<JuezDisponible[]>([]);
  const [juecesAsignados, setJuecesAsignados] = useState<string[]>([]);
  const [guardandoAsignaciones, setGuardandoAsignaciones] = useState(false);
  const [asignacionesCargadas, setAsignacionesCargadas] = useState(false);
  const [criteriosAsignados, setCriteriosAsignados] = useState<Array<{ id: number; titulo: string; tipo: string; peso: number }>>([]);

  const [modalAbrir, setModalAbrir] = useState(false);
  const [horaApertura, setHoraApertura] = useState('');
  const [horaCierre, setHoraCierre] = useState('');

  async function cargar() {
    if (!surveyId) return;
    try {
      const [enc, res, coms] = await Promise.all([
        votifyApi.getSurvey(Number(surveyId)),
        votifyApi.getSurveyResults(Number(surveyId)),
        votifyApi.getSurveyComments(Number(surveyId))
      ]);
      setEncuesta(enc);
      setResults(res);
      setComentarios(coms);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar resultados');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [surveyId]);

  async function recalculate() {
    if (!surveyId) return;
    setRecalculando(true);
    try {
      const res = await votifyApi.recalculateResults(Number(surveyId));
      setResults(res);
      toast.success('Ranking recalculado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al recalcular');
    } finally {
      setRecalculando(false);
    }
  }

  async function cambiarEstado(nuevoEstado: SurveyState) {
    if (!surveyId) return;
    setCambiandoEstado(true);
    try {
      const actualizada = await votifyApi.updateSurveyState(Number(surveyId), nuevoEstado);
      setEncuesta(actualizada as Survey);
      toast.success(`Encuesta ${STATE_LABEL[nuevoEstado].toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado');
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function reabrir() {
    if (!surveyId) return;
    setCambiandoEstado(true);
    try {
      const actualizada = await votifyApi.updateSurveyState(Number(surveyId), 'abierta');
      setEncuesta(actualizada as Survey);
      toast.success('Encuesta reabierta');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al reabrir');
    } finally {
      setCambiandoEstado(false);
    }
  }

  function abrirModalHorario() {
    const aperturaGuardada = isoToDatetimeLocal(encuesta?.hora_apertura);
    const cierreGuardado = isoToDatetimeLocal(encuesta?.hora_cierre);
    const aperturaEsFutura = encuesta?.hora_apertura ? new Date(encuesta.hora_apertura) > new Date() : false;
    const cierreEsFuturo = encuesta?.hora_cierre ? new Date(encuesta.hora_cierre) > new Date() : false;

    if (encuesta?.estado !== 'abierta') {
      setHoraApertura(aperturaEsFutura ? aperturaGuardada : '');
    } else {
      setHoraApertura('');
    }
    setHoraCierre(cierreEsFuturo ? cierreGuardado : '');
    setModalAbrir(true);
  }

  async function confirmarAbrir() {
    if (!surveyId) return;
    const errorHorario = validarHorarioEncuesta({
      apertura: horaApertura,
      cierre: horaCierre,
      editarApertura: encuesta?.estado !== 'abierta'
    });
    if (errorHorario) {
      toast.error(errorHorario);
      return;
    }
    setCambiandoEstado(true);
    try {
      const horaAperturaIso = datetimeLocalToIso(horaApertura);
      const horaCierreIso = datetimeLocalToIso(horaCierre);

      if (encuesta?.estado === 'abierta') {
        const actualizada = await votifyApi.updateSurveySchedule(Number(surveyId), { horaCierre: horaCierreIso });
        setEncuesta(actualizada as Survey);
      } else {
        const aperturaFutura = horaAperturaIso && new Date(horaAperturaIso) > new Date();
        if (aperturaFutura) {
          const actualizada = await votifyApi.updateSurveySchedule(Number(surveyId), {
            horaApertura: horaAperturaIso,
            horaCierre: horaCierreIso
          });
          setEncuesta(actualizada as Survey);
          toast.success('Encuesta programada');
        } else {
          const actualizada = await votifyApi.updateSurveySchedule(Number(surveyId), { horaCierre: horaCierreIso });
          setEncuesta(actualizada as Survey);
          toast.success('Encuesta abierta');
        }
      }

      setModalAbrir(false);
      setHoraApertura('');
      setHoraCierre('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function guardarManual(row: ResultRow) {
    const val = editManual[row.id];
    const puntaje = val === '' ? null : Number(val);
    setGuardandoManual((prev) => ({ ...prev, [row.id]: true }));
    try {
      await votifyApi.updateManualScore(row.id, puntaje);
      setResults((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, puntaje_manual: puntaje } : r))
      );
      setEditManual((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      toast.success('Puntaje guardado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setGuardandoManual((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function cargarAsignaciones() {
    if (!surveyId || asignacionesCargadas) return;
    try {
      const [data, criterios] = await Promise.all([
        votifyApi.getSurveyAssignments(Number(surveyId)),
        votifyApi.getSurveyCriteria(Number(surveyId))
      ]);
      setEquiposDisponibles(data.equiposDisponibles);
      setEquiposAsignados(data.equiposAsignados);
      setJuecesDisponibles(data.juecesDisponibles);
      setJuecesAsignados(data.juecesAsignados);
      setCriteriosAsignados(criterios);
      setAsignacionesCargadas(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar asignaciones');
    }
  }

  async function guardarAsignaciones() {
    if (!surveyId) return;
    if (equiposAsignados.length === 0) return toast.error('La encuesta debe tener al menos un equipo asignado');
    setGuardandoAsignaciones(true);
    try {
      await votifyApi.updateSurveyAssignments(Number(surveyId), equiposAsignados, juecesAsignados);
      toast.success('Asignaciones actualizadas');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar asignaciones');
    } finally {
      setGuardandoAsignaciones(false);
    }
  }

  if (cargando) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </Layout>
    );
  }

  const resultadosOrdenados = [...results].sort((a, b) => {
    const pA = a.puntaje_manual ?? a.puntaje_calculado ?? 0;
    const pB = b.puntaje_manual ?? b.puntaje_calculado ?? 0;
    return pB - pA;
  });

  const maxPuntaje = Math.max(
    ...resultadosOrdenados.map((r) => r.puntaje_manual ?? r.puntaje_calculado ?? 0),
    1
  );

  const comentariosAgrupados = comentarios.reduce<Record<string, Comentario[]>>((acc, c) => {
    const k = c.proyecto ?? 'Sin proyecto';
    if (!acc[k]) acc[k] = [];
    acc[k].push(c);
    return acc;
  }, {});

  const estado = encuesta?.estado;
  const errorHorarioModal = validarHorarioEncuesta({
    apertura: horaApertura,
    cierre: horaCierre,
    editarApertura: estado !== 'abierta'
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[
          { label: 'Mis eventos', to: '/admin' },
          { label: encuesta?.competicion?.evento?.nombre ?? '', to: `/admin/eventos/${encuesta?.competicion?.evento?.id}/editar` },
          { label: encuesta?.competicion?.nombre ?? '', to: `/admin/competiciones/${encuesta?.competicion_id}` },
          { label: encuesta?.nombre ?? '' }
        ]} />
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{encuesta?.nombre ?? 'Resultados'}</h1>
            <p className="text-sm text-gray-500">
              {encuesta?.competicion?.nombre} · {encuesta?.competicion?.evento?.nombre}
            </p>
            {encuesta && (
              <p className="text-xs text-gray-400 mt-0.5">
                <span>
                  {etiquetaAperturaEncuesta(encuesta)}:{' '}
                  {encuesta.hora_reapertura
                    ? formatFechaLocal(encuesta.hora_reapertura)
                    : encuesta.hora_apertura
                      ? formatFechaLocal(encuesta.hora_apertura)
                      : 'sin programar'}
                </span>
                <span> · </span>
                <span>
                  {encuesta.hora_cierre ? etiquetaCierre(encuesta.hora_cierre) : 'Cierra'}:{' '}
                  {encuesta.hora_cierre ? formatFechaLocal(encuesta.hora_cierre) : 'sin programar'}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {encuesta && estado && (
              <Badge color={STATE_COLOR[estado]}>{STATE_LABEL[estado]}</Badge>
            )}
            {estado === 'borrador' && (
              <Button size="sm" onClick={abrirModalHorario}>
                Publicar
              </Button>
            )}
            {estado === 'abierta' && (
              <>
                <button
                  onClick={abrirModalHorario}
                  title="Programar cierre automático"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors"
                >
                  <Clock size={14} />
                </button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => cambiarEstado('cerrada')}
                  loading={cambiandoEstado}
                >
                  Cerrar
                </Button>
              </>
            )}
            {estado === 'programada' && (
              <button
                onClick={abrirModalHorario}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                <Pencil size={13} /> Editar horario
              </button>
            )}
            {estado === 'cerrada' && (
              <Button size="sm" variant="secondary" onClick={reabrir} loading={cambiandoEstado}>
                Reabrir
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => { setTab(i); if (i === 2 || i === 3) cargarAsignaciones(); }}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                tab === i
                  ? 'bg-white text-indigo-700 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={recalculate} loading={recalculando}>
                Calcular resultados
              </Button>
            </div>

            {resultadosOrdenados.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay resultados aún. Haz clic en "Calcular resultados".
              </p>
            ) : (
              <div className="space-y-3">
                {resultadosOrdenados.map((r, idx) => {
                  const puntaje = r.puntaje_manual ?? r.puntaje_calculado ?? 0;
                  const esManual = r.puntaje_manual != null;
                  const editando = r.id in editManual;
                  const nombre = r.proyecto?.nombre ?? `Proyecto ${r.proyecto_id}`;
                  const equipo = r.proyecto?.equipo?.nombre;
                  const pos = r.posicion_final ?? idx + 1;

                  const medalStyles: Record<number, { border: string; bg: string; badge: string }> = {
                    1: { border: 'border-l-4 border-yellow-400', bg: 'bg-yellow-50/40', badge: '🥇' },
                    2: { border: 'border-l-4 border-gray-400', bg: 'bg-gray-50/40', badge: '🥈' },
                    3: { border: 'border-l-4 border-amber-500', bg: 'bg-amber-50/40', badge: '🥉' }
                  };
                  const medal = medalStyles[pos];

                  return (
                    <div key={r.id} className={`bg-white border border-gray-100 rounded-xl p-4 shadow-card ${medal?.border ?? ''} ${medal?.bg ?? ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {medal ? (
                            <span className="text-xl leading-none">{medal.badge}</span>
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold flex items-center justify-center">
                              {pos}
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{nombre}</p>
                            {equipo && <p className="text-xs text-gray-500">{equipo}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {esManual && <Badge color="yellow">manual</Badge>}
                          {editando ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editManual[r.id]}
                                onChange={(e) =>
                                  setEditManual((prev) => ({ ...prev, [r.id]: e.target.value }))
                                }
                                className="w-20 border border-gray-200 rounded-xl px-2 py-1 text-sm focus:outline-none bg-gray-50"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => guardarManual(r)}
                                loading={guardandoManual[r.id]}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  setEditManual((prev) => {
                                    const n = { ...prev };
                                    delete n[r.id];
                                    return n;
                                  })
                                }
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-gray-700">{puntaje.toFixed(2)}</span>
                              <button
                                onClick={() =>
                                  setEditManual((prev) => ({
                                    ...prev,
                                    [r.id]: r.puntaje_manual?.toString() ?? ''
                                  }))
                                }
                                className="text-gray-400 hover:text-indigo-600 text-xs"
                                title="Editar puntaje manual"
                              >
                                ✎
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pos === 1 ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-indigo-400'}`}
                          style={{ width: `${(puntaje / maxPuntaje) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-4">
            {Object.keys(comentariosAgrupados).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay comentarios aún</p>
            ) : (
              Object.entries(comentariosAgrupados).map(([proyecto, coms]) => (
                <div key={proyecto} className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">{proyecto}</h3>
                  <div className="space-y-2">
                    {coms.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge color={c.origen === 'Público' ? 'blue' : 'purple'}>{c.origen}</Badge>
                        <p className="text-sm text-gray-600">{c.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-3">
            {criteriosAsignados.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay criterios asignados a esta encuesta</p>
            ) : (
              criteriosAsignados.map((c) => (
                <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge color="blue">{c.tipo}</Badge>
                    <span className="text-sm font-medium text-gray-800">{c.titulo}</span>
                  </div>
                  <span className="text-xs text-gray-400">peso: {c.peso}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Asignaciones</h2>
                <p className="text-sm text-gray-500">Elige qué equipos participan y qué jurados pueden votar.</p>
              </div>
              <Button size="sm" loading={guardandoAsignaciones} onClick={guardarAsignaciones}>Guardar</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Equipos</h3>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => setEquiposAsignados(equiposDisponibles.map((eq) => eq.id))}
                      disabled={equiposDisponibles.length === 0}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-300">
                      Asignar todos
                    </button>
                    <Badge color="gray">{equiposAsignados.length}/{equiposDisponibles.length}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {equiposDisponibles.map((eq) => {
                    const activo = equiposAsignados.includes(eq.id);
                    return (
                      <label key={eq.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${activo ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input type="checkbox" className="mt-1" checked={activo}
                          onChange={() => setEquiposAsignados((prev) => activo ? prev.filter((id) => id !== eq.id) : [...prev, eq.id])} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-800">{eq.nombre}</span>
                          {eq.proyecto?.[0]?.nombre && <span className="block text-xs text-gray-500 truncate">{eq.proyecto[0].nombre}</span>}
                        </span>
                      </label>
                    );
                  })}
                  {equiposDisponibles.length === 0 && <p className="text-sm text-gray-500 py-3">No hay equipos en la competición</p>}
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Jurado</h3>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => setJuecesAsignados(juecesDisponibles.map((j) => j.persona_id))}
                      disabled={juecesDisponibles.length === 0}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-300">
                      Asignar todos
                    </button>
                    <Badge color="gray">{juecesAsignados.length}/{juecesDisponibles.length}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {juecesDisponibles.map((j) => {
                    const activo = juecesAsignados.includes(j.persona_id);
                    return (
                      <label key={j.persona_id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${activo ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <input type="checkbox" className="mt-1" checked={activo}
                          onChange={() => setJuecesAsignados((prev) => activo ? prev.filter((id) => id !== j.persona_id) : [...prev, j.persona_id])} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-800">{j.persona?.nombre ?? '(sin nombre)'}</span>
                          <span className="block text-xs text-gray-500">{j.persona?.correo}</span>
                        </span>
                      </label>
                    );
                  })}
                  {juecesDisponibles.length === 0 && <p className="text-sm text-gray-500 py-3">No hay jurado asignado a la competición</p>}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalAbrir}
        onClose={() => {
          setModalAbrir(false);
          setHoraApertura('');
          setHoraCierre('');
        }}
        title={
          estado === 'abierta'
            ? 'Cierre automático'
            : estado === 'programada'
              ? 'Editar horario'
              : estado === 'borrador'
                ? 'Publicar encuesta'
                : 'Abrir encuesta'
        }
      >
        <div className="space-y-3">
          <div className={estado !== 'abierta' ? 'grid grid-cols-2 gap-3' : ''}>
            {estado !== 'abierta' && (
              <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  Apertura
                </div>
                <input
                  type="datetime-local"
                  value={horaApertura}
                  min={nowDatetimeLocal()}
                  onChange={(e) => {
                    const apertura = limitarDatetimeLocal(e.target.value, nowDatetimeLocal());
                    setHoraApertura(apertura);
                    if (horaCierre)
                      setHoraCierre(
                        limitarDatetimeLocal(horaCierre, datetimeLocalMasMinutos(apertura))
                      );
                  }}
                  className={DATETIME_INPUT_CLASS}
                />
                {horaApertura && (
                  <button
                    onClick={() => setHoraApertura('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Quitar
                  </button>
                )}
              </div>
            )}
            <div className="rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                Cierre
              </div>
              <input
                type="datetime-local"
                value={horaCierre}
                min={horaApertura ? datetimeLocalMasMinutos(horaApertura) : nowDatetimeLocal()}
                onChange={(e) =>
                  setHoraCierre(
                    limitarDatetimeLocal(
                      e.target.value,
                      horaApertura ? datetimeLocalMasMinutos(horaApertura) : nowDatetimeLocal()
                    )
                  )
                }
                className={DATETIME_INPUT_CLASS}
              />
              {horaCierre && (
                <button
                  onClick={() => setHoraCierre('')}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          {estado !== 'abierta' && (
            <p className="text-xs text-gray-400">
              Deja vacío para abrir ahora sin cierre automático. Con apertura futura, queda
              programada hasta esa hora.
            </p>
          )}

          {errorHorarioModal && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {errorHorarioModal}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setModalAbrir(false);
                setHoraApertura('');
                setHoraCierre('');
              }}
            >
              Cancelar
            </Button>
            <Button loading={cambiandoEstado} onClick={confirmarAbrir} disabled={!!errorHorarioModal}>
              {estado !== 'abierta' && horaApertura && new Date(horaApertura) > new Date()
                ? 'Programar'
                : estado === 'borrador'
                  ? 'Publicar'
                  : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
