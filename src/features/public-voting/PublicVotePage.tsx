import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProjectFileLink } from '../../shared/components/project/ProjectFileLink';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Criterion } from '../../shared/types/domain';
import { RUBRICA_NIVELES, agruparRubrica } from '../../shared/utils/scoring';

type Proyecto = { id: number; nombre: string; descripcion?: string | null; archivo_url?: string | null; archivo_nombre?: string | null; archivo_tamano?: number | null };
type SalaSession = { correo: string; codigo: string; encuesta_id: number };

type Respuesta = {
  criterioId: number;
  valorNumerico?: number;
  opcionesIds?: number[];
  valorTexto?: string;
};

type VotoProyecto = {
  proyectoId: number;
  respuestas: Respuesta[];
};

export function PublicVotePage() {
  const { codigo } = useParams();
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [criterios, setCriterios] = useState<Criterion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [sesion, setSesion] = useState<SalaSession | null>(null);

  const [numericos, setNumericos] = useState<Record<string, string>>({});
  const [radios, setRadios] = useState<Record<string, number>>({});
  const [checklists, setChecklists] = useState<Record<string, number[]>>({});
  const [rubricas, setRubricas] = useState<Record<string, Record<string, number>>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  function clave(proyectoId: number, criterioId: number) {
    return `${proyectoId}_${criterioId}`;
  }

  useEffect(() => {
    const raw = localStorage.getItem('votify_sala');
    if (!raw || !codigo) {
      navigate(`/sala/${codigo ?? ''}`);
      return;
    }
    const sal: SalaSession = JSON.parse(raw);
    if (sal.codigo !== codigo) {
      navigate(`/sala/${codigo}`);
      return;
    }
    setSesion(sal);

    async function cargar() {
      setCargando(true);
      try {
        await votifyApi.processScheduledSurveys(sal.encuesta_id);
        const data = (await votifyApi.getPublicVotingForm(codigo!)) as {
          proyectos: Proyecto[];
          criterios: Criterion[];
        };
        setProyectos(data.proyectos);
        setCriterios(data.criterios);

        if (data.criterios.length === 0) toast.error('Esta encuesta no tiene criterios configurados');
        if (data.proyectos.length === 0) toast.error('Esta competición no tiene proyectos disponibles');
      } catch {
        toast.error('No se pudo cargar el formulario de votación');
        navigate(`/sala/${codigo}`);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [codigo, navigate]);

  function toggleChecklist(k: string, opcionId: number, maxSel: number | null | undefined) {
    setChecklists((prev) => {
      const actual = prev[k] ?? [];
      if (actual.includes(opcionId)) return { ...prev, [k]: actual.filter((id) => id !== opcionId) };
      if (maxSel != null && actual.length >= maxSel) return prev;
      return { ...prev, [k]: [...actual, opcionId] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion || !codigo) return;

    const rubricaIncompleta = proyectos.some((proyecto) =>
      criterios.some((c) => {
        if (c.tipo !== 'rubrica') return false;
        const k = clave(proyecto.id, c.id);
        return agruparRubrica(c.criterio_opcion ?? []).some((g) => !rubricas[k]?.[g.aspecto]);
      })
    );

    if (rubricaIncompleta) {
      toast.error('Completa todos los aspectos de las rúbricas');
      return;
    }

    const votos: VotoProyecto[] = proyectos.map((proyecto) => ({
      proyectoId: proyecto.id,
      respuestas: criterios.map((c) => {
        const k = clave(proyecto.id, c.id);
        const base = { criterioId: c.id };
        if (c.tipo === 'numerico') return { ...base, valorNumerico: Number(numericos[k] ?? 0) };
        if (c.tipo === 'radio') return { ...base, opcionesIds: radios[k] != null ? [radios[k]] : [] };
        if (c.tipo === 'checklist') return { ...base, opcionesIds: checklists[k] ?? [] };
        if (c.tipo === 'rubrica') {
          const grupos = agruparRubrica(c.criterio_opcion ?? []);
          const opcionesIds = grupos
            .map((g) => rubricas[k]?.[g.aspecto])
            .filter((id): id is number => id != null);
          return { ...base, opcionesIds };
        }
        return { ...base, valorTexto: comentarios[k] ?? '' };
      })
    }));

    setEnviando(true);
    try {
      await votifyApi.processScheduledSurveys(sesion.encuesta_id);
      await votifyApi.submitPublicVote(codigo, { correo: sesion.correo, votos });
      localStorage.removeItem('votify_sala');
      setCompletado(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el voto');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (completado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por participar!</h1>
          <p className="text-gray-500 mb-6">Tu voto ha sido registrado correctamente.</p>
          <Link
            to={`/sala/${codigo}/resultados`}
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Ver resultados en vivo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mt-1">Formulario de votación</h1>
          <p className="text-sm text-gray-500">Votación anónima</p>
        </div>

        {(proyectos.length === 0 || criterios.length === 0) && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            {proyectos.length === 0 && <p>Esta competición no tiene proyectos visibles para votar.</p>}
            {criterios.length === 0 && <p>Esta encuesta no tiene criterios configurados.</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {proyectos.map((proyecto) => (
            <div key={proyecto.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-indigo-50">
                <h2 className="font-semibold text-gray-900">{proyecto.nombre}</h2>
                {proyecto.descripcion && (
                  <p className="text-sm text-gray-500 mt-1">{proyecto.descripcion}</p>
                )}
                <ProjectFileLink project={proyecto} />
              </div>

              <div className="p-5 space-y-4">
                {criterios.map((criterio) => {
                  const k = clave(proyecto.id, criterio.id);
                  return (
                    <div key={criterio.id}>
                      <p className="text-sm font-medium text-gray-700 mb-2">{criterio.titulo}</p>
                      {criterio.descripcion && (
                        <p className="text-xs text-gray-500 mb-2">{criterio.descripcion}</p>
                      )}

                      {criterio.tipo === 'numerico' && (
                        <input
                          type="number"
                          min={criterio.rango_min ?? undefined}
                          max={criterio.rango_max ?? undefined}
                          step="0.01"
                          value={numericos[k] ?? ''}
                          onChange={(e) => setNumericos((prev) => ({ ...prev, [k]: e.target.value }))}
                          placeholder={
                            criterio.rango_min != null && criterio.rango_max != null
                              ? `${criterio.rango_min} – ${criterio.rango_max}`
                              : 'Valor numérico'
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}

                      {criterio.tipo === 'radio' && (
                        <div className="space-y-2">
                          {(criterio.criterio_opcion ?? [])
                            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                            .map((opcion) => (
                              <label
                                key={opcion.id}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`r_${proyecto.id}_${criterio.id}`}
                                  checked={radios[k] === opcion.id}
                                  onChange={() => setRadios((prev) => ({ ...prev, [k]: opcion.id }))}
                                  className="accent-indigo-600"
                                />
                                {opcion.texto}
                              </label>
                            ))}
                        </div>
                      )}

                      {criterio.tipo === 'rubrica' && (
                        <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
                          <div className="min-w-[620px]">
                            <div className="grid grid-cols-[1.25fr_repeat(4,1fr)] bg-gray-50 text-xs font-semibold text-gray-600">
                              <div className="px-3 py-2">Aspecto</div>
                              {RUBRICA_NIVELES.map((nivel) => (
                                <div key={nivel.key} className="px-3 py-2 text-center">
                                  {nivel.label}
                                </div>
                              ))}
                            </div>
                            {agruparRubrica(criterio.criterio_opcion ?? []).map((grupo) => (
                              <div
                                key={grupo.aspecto}
                                className="grid grid-cols-[1.25fr_repeat(4,1fr)] border-t border-gray-100"
                              >
                                <div className="flex items-center px-3 py-3 text-sm font-semibold text-gray-800">
                                  {grupo.aspecto}
                                </div>
                                {RUBRICA_NIVELES.map((nivel) => {
                                  const opcion = grupo.opciones.find((op) => op.nivel === nivel.key);
                                  const seleccionado = rubricas[k]?.[grupo.aspecto] === opcion?.id;
                                  return (
                                    <label
                                      key={nivel.key}
                                      className={`m-1 flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-semibold transition hover:shadow-sm ${seleccionado ? 'ring-2 ring-indigo-500 ring-offset-1 ' : ''}${nivel.color}`}
                                    >
                                      <input
                                        type="radio"
                                        className="sr-only"
                                        checked={seleccionado}
                                        disabled={!opcion}
                                        onChange={() => {
                                          if (!opcion) return;
                                          setRubricas((prev) => ({
                                            ...prev,
                                            [k]: { ...(prev[k] ?? {}), [grupo.aspecto]: opcion.id! }
                                          }));
                                        }}
                                      />
                                      <span>
                                        {!opcion?.descriptor && (
                                          <span className="block">{nivel.label}</span>
                                        )}
                                        {opcion?.descriptor && (
                                          <span className="block text-[11px] font-normal leading-snug text-gray-600">
                                            {opcion.descriptor}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {criterio.tipo === 'checklist' && (
                        <div className="space-y-2">
                          {criterio.max_selecciones != null && (
                            <p className="text-xs text-gray-400">
                              Máximo {criterio.max_selecciones} selecciones
                              {(checklists[k]?.length ?? 0) > 0 &&
                                ` · ${checklists[k].length} seleccionadas`}
                            </p>
                          )}
                          {(criterio.criterio_opcion ?? [])
                            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                            .map((opcion) => {
                              const sel = checklists[k] ?? [];
                              const marcada = sel.includes(opcion.id);
                              const bloqueada =
                                !marcada &&
                                criterio.max_selecciones != null &&
                                sel.length >= criterio.max_selecciones;
                              return (
                                <label
                                  key={opcion.id}
                                  className={`flex items-center gap-2 text-sm ${bloqueada ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={marcada}
                                    disabled={bloqueada}
                                    onChange={() => toggleChecklist(k, opcion.id, criterio.max_selecciones)}
                                    className="accent-indigo-600"
                                  />
                                  {opcion.texto}
                                </label>
                              );
                            })}
                        </div>
                      )}

                      {criterio.tipo === 'comentario' && (
                        <textarea
                          rows={3}
                          value={comentarios[k] ?? ''}
                          onChange={(e) =>
                            setComentarios((prev) => ({ ...prev, [k]: e.target.value }))
                          }
                          placeholder="Tu comentario..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pb-8">
            <button
              type="submit"
              disabled={enviando || proyectos.length === 0 || criterios.length === 0}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {enviando ? 'Enviando...' : 'Enviar voto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
