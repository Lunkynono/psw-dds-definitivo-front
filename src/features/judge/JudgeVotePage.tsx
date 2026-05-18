import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Breadcrumb } from '../../shared/components/ui/Breadcrumb';
import { Button } from '../../shared/components/ui/Button';
import { ProjectFileLink } from '../../shared/components/project/ProjectFileLink';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import { Criterion, Survey } from '../../shared/types/domain';
import { RUBRICA_NIVELES, agruparRubrica } from '../../shared/utils/scoring';

type Proyecto = { id: number; nombre: string; descripcion?: string | null; archivo_url?: string | null; archivo_nombre?: string | null; archivo_tamano?: number | null };
type FormData = { encuesta: Survey; proyecto: Proyecto; criterios: Criterion[] };

type Respuesta = {
  criterioId: number;
  valorNumerico?: number;
  opcionesIds?: number[];
  valorTexto?: string;
};

export function JudgeVotePage() {
  const { surveyId, projectId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);

  const [form, setForm] = useState<FormData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [numericos, setNumericos] = useState<Record<number, string>>({});
  const [radios, setRadios] = useState<Record<number, number>>({});
  const [checklists, setChecklists] = useState<Record<number, number[]>>({});
  const [rubricas, setRubricas] = useState<Record<number, Record<string, number>>>({});
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const [errores, setErrores] = useState<Record<number, string>>({});

  useEffect(() => {
    async function cargar() {
      if (!surveyId || !projectId) return;
      setCargando(true);
      try {
        await votifyApi.processScheduledSurveys(Number(surveyId));
        const data = (await votifyApi.getJudgeVotingForm(
          Number(surveyId),
          Number(projectId)
        )) as FormData;
        setForm(data);
      } catch {
        toast.error('No se pudo cargar el formulario');
        navigate('/juez');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [surveyId, projectId, navigate]);

  function toggleChecklist(criterioId: number, opcionId: number, maxSel: number | null | undefined) {
    setChecklists((prev) => {
      const actual = prev[criterioId] ?? [];
      if (actual.includes(opcionId)) {
        return { ...prev, [criterioId]: actual.filter((id) => id !== opcionId) };
      }
      if (maxSel != null && actual.length >= maxSel) return prev;
      return { ...prev, [criterioId]: [...actual, opcionId] };
    });
  }

  function validar(): boolean {
    if (!form) return false;
    const nuevosErrores: Record<number, string> = {};
    for (const c of form.criterios) {
      if (c.tipo === 'numerico' && (numericos[c.id] === undefined || numericos[c.id] === '')) {
        nuevosErrores[c.id] = 'Obligatorio';
      }
      if (c.tipo === 'radio' && radios[c.id] == null) {
        nuevosErrores[c.id] = 'Selecciona una opción';
      }
      if (c.tipo === 'rubrica') {
        const grupos = agruparRubrica(c.criterio_opcion ?? []);
        if (grupos.some((g) => !rubricas[c.id]?.[g.aspecto])) {
          nuevosErrores[c.id] = 'Completa todos los aspectos';
        }
      }
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !userId || !surveyId || !projectId) return;
    if (!validar()) return;

    const respuestas: Respuesta[] = form.criterios.map((c) => {
      const base = { criterioId: c.id };
      if (c.tipo === 'numerico') return { ...base, valorNumerico: Number(numericos[c.id] ?? 0) };
      if (c.tipo === 'radio') return { ...base, opcionesIds: radios[c.id] != null ? [radios[c.id]] : [] };
      if (c.tipo === 'checklist') return { ...base, opcionesIds: checklists[c.id] ?? [] };
      if (c.tipo === 'rubrica') {
        const grupos = agruparRubrica(c.criterio_opcion ?? []);
        const opcionesIds = grupos
          .map((g) => rubricas[c.id]?.[g.aspecto])
          .filter((id): id is number => id != null);
        return { ...base, opcionesIds };
      }
      return { ...base, valorTexto: comentarios[c.id] ?? '' };
    });

    setEnviando(true);
    try {
      await votifyApi.processScheduledSurveys(Number(surveyId));
      await votifyApi.submitJudgeVote(userId, Number(surveyId), Number(projectId), { respuestas });
      toast.success('Voto registrado');
      navigate('/juez');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      toast.error(
        msg.includes('Ya existe') || msg.includes('Ya has votado') ? 'Ya has votado este proyecto' : msg || 'No se pudo enviar el voto'
      );
    } finally {
      setEnviando(false);
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

  if (!form) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Breadcrumb items={[
          { label: 'Mis encuestas', to: '/juez' },
          { label: form.encuesta.nombre },
          { label: form.proyecto.nombre }
        ]} />
        <div className="mb-6">
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
            {form.encuesta.competicion?.nombre} · {form.encuesta.competicion?.evento?.nombre}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{form.encuesta.nombre}</h1>
          <p className="text-gray-600 mt-1">
            Evaluando: <span className="font-semibold text-gray-800">{form.proyecto.nombre}</span>
          </p>
          {form.proyecto.descripcion && (
            <p className="text-sm text-gray-500 mt-1">{form.proyecto.descripcion}</p>
          )}
          <ProjectFileLink project={form.proyecto} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {form.criterios.map((criterio) => (
            <div key={criterio.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-1">{criterio.titulo}</p>
              {criterio.descripcion && (
                <p className="text-sm text-gray-500 mb-3">{criterio.descripcion}</p>
              )}

              {criterio.tipo === 'numerico' && (
                <div>
                  <input
                    type="number"
                    min={criterio.rango_min ?? undefined}
                    max={criterio.rango_max ?? undefined}
                    step="0.01"
                    value={numericos[criterio.id] ?? ''}
                    onChange={(e) => {
                      setNumericos((prev) => ({ ...prev, [criterio.id]: e.target.value }));
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n[criterio.id];
                        return n;
                      });
                    }}
                    placeholder={
                      criterio.rango_min != null && criterio.rango_max != null
                        ? `${criterio.rango_min} – ${criterio.rango_max}`
                        : 'Valor numérico'
                    }
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errores[criterio.id] ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errores[criterio.id] && (
                    <p className="text-red-500 text-xs mt-1">{errores[criterio.id]}</p>
                  )}
                </div>
              )}

              {criterio.tipo === 'radio' && (
                <div className="space-y-2">
                  {(criterio.criterio_opcion ?? [])
                    .sort((a, b) => a.orden - b.orden)
                    .map((opcion) => (
                      <label key={opcion.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`radio-${criterio.id}`}
                          checked={radios[criterio.id] === opcion.id}
                          onChange={() => {
                            setRadios((prev) => ({ ...prev, [criterio.id]: opcion.id }));
                            setErrores((prev) => {
                              const n = { ...prev };
                              delete n[criterio.id];
                              return n;
                            });
                          }}
                          className="accent-indigo-600"
                        />
                        <span className="text-sm text-gray-700">{opcion.texto}</span>
                      </label>
                    ))}
                  {errores[criterio.id] && (
                    <p className="text-red-500 text-xs mt-1">{errores[criterio.id]}</p>
                  )}
                </div>
              )}

              {criterio.tipo === 'rubrica' && (
                <div>
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
                            const seleccionado =
                              rubricas[criterio.id]?.[grupo.aspecto] === opcion?.id;
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
                                      [criterio.id]: {
                                        ...(prev[criterio.id] ?? {}),
                                        [grupo.aspecto]: opcion.id!
                                      }
                                    }));
                                    setErrores((prev) => {
                                      const n = { ...prev };
                                      delete n[criterio.id];
                                      return n;
                                    });
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
                  {errores[criterio.id] && (
                    <p className="text-red-500 text-xs mt-1">{errores[criterio.id]}</p>
                  )}
                </div>
              )}

              {criterio.tipo === 'checklist' && (
                <div className="space-y-2">
                  {criterio.max_selecciones != null && (
                    <p className="text-xs text-gray-400 mb-1">
                      Máximo {criterio.max_selecciones} selecciones
                      {(checklists[criterio.id]?.length ?? 0) > 0 &&
                        ` · ${checklists[criterio.id].length} seleccionadas`}
                    </p>
                  )}
                  {(criterio.criterio_opcion ?? [])
                    .sort((a, b) => a.orden - b.orden)
                    .map((opcion) => {
                      const seleccionadas = checklists[criterio.id] ?? [];
                      const marcada = seleccionadas.includes(opcion.id);
                      const bloqueada =
                        !marcada &&
                        criterio.max_selecciones != null &&
                        seleccionadas.length >= criterio.max_selecciones;
                      return (
                        <label
                          key={opcion.id}
                          className={`flex items-center gap-2 cursor-pointer ${bloqueada ? 'opacity-40' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={marcada}
                            disabled={bloqueada}
                            onChange={() =>
                              toggleChecklist(criterio.id, opcion.id, criterio.max_selecciones)
                            }
                            className="accent-indigo-600"
                          />
                          <span className="text-sm text-gray-700">{opcion.texto}</span>
                        </label>
                      );
                    })}
                </div>
              )}

              {criterio.tipo === 'comentario' && (
                <textarea
                  rows={3}
                  value={comentarios[criterio.id] ?? ''}
                  onChange={(e) =>
                    setComentarios((prev) => ({ ...prev, [criterio.id]: e.target.value }))
                  }
                  placeholder="Escribe tu comentario..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/juez')}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <Button type="submit" loading={enviando} className="w-full">
              Enviar evaluación
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
