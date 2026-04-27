import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { Modal } from '../../shared/components/ui/Modal';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import {
  DATETIME_INPUT_CLASS,
  datetimeLocalMasMinutos,
  datetimeLocalToIso,
  limitarDatetimeLocal,
  nowDatetimeLocal,
  validarHorarioEncuesta
} from '../../shared/utils/dateTime';
import {
  RUBRICA_NIVELES,
  ajustarPesoOpcion,
  construirOpcionesRubrica,
  opcionesConTexto,
  pesosOpcionesValidos,
  reescalarPesosOpciones
} from '../../shared/utils/scoring';

const TIPO_LABELS = {
  numerico: 'Numérico',
  radio: 'Radio',
  checklist: 'Checklist',
  rubrica: 'Rúbrica',
  comentario: 'Comentario'
};
const TIPO_COLORS = {
  numerico: 'blue',
  radio: 'purple',
  checklist: 'green',
  rubrica: 'blue',
  comentario: 'yellow'
} as const;

type CriterionType = keyof typeof TIPO_LABELS;

type Criterion = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: CriterionType;
  peso: number;
};

type CompInfo = {
  id: number;
  nombre: string;
  evento_id: number;
  evento?: { id: number; nombre: string; organizador_id?: string };
};

type EquipoInfo = { id: number; nombre: string };
type JuezInfo = { id: string; nombre: string; correo: string };

type SurveyForm = {
  nombre: string;
  descripcion?: string;
  tipo_votante: 'juez' | 'publico' | 'ambos';
  peso: number;
};

type AspectoDraft = {
  texto: string;
  peso: number;
  descriptoresAbiertos?: boolean;
  descriptores?: Partial<Record<string, string>>;
};

type OpcionDraft = { texto: string; peso: number };

type CriterionDraft = {
  titulo: string;
  descripcion: string;
  tipo: CriterionType;
  peso: string;
  rango_min: string;
  rango_max: string;
  max_selecciones: string;
  ilimitado: boolean;
  opciones: OpcionDraft[];
  rubricaAspectos: AspectoDraft[];
};

const CRITERION_DRAFT_EMPTY: CriterionDraft = {
  titulo: '',
  descripcion: '',
  tipo: 'numerico',
  peso: '1',
  rango_min: '',
  rango_max: '',
  max_selecciones: '',
  ilimitado: true,
  opciones: [
    { texto: '', peso: 0 },
    { texto: '', peso: 1 }
  ],
  rubricaAspectos: [
    { texto: 'Calidad técnica', peso: 0.5, descriptores: {} },
    { texto: 'Presentación', peso: 0.5, descriptores: {} }
  ]
};

export function SurveyCreatePage() {
  const { competitionId } = useParams();
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  const [comp, setComp] = useState<CompInfo | null>(null);
  const [criterios, setCriterios] = useState<Criterion[]>([]);
  const [criteriosSeleccionados, setCriteriosSeleccionados] = useState<number[]>([]);
  const [equipos, setEquipos] = useState<EquipoInfo[]>([]);
  const [jueces, setJueces] = useState<JuezInfo[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<number[]>([]);
  const [juecesSeleccionados, setJuecesSeleccionados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [accionGuardar, setAccionGuardar] = useState<'borrador' | 'activar'>('activar');
  const [horaApertura, setHoraApertura] = useState('');
  const [horaCierre, setHoraCierre] = useState('');
  const [modalCriterio, setModalCriterio] = useState(false);
  const [guardandoCriterio, setGuardandoCriterio] = useState(false);
  const [nuevoCriterio, setNuevoCriterio] = useState<CriterionDraft>(CRITERION_DRAFT_EMPTY);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SurveyForm>({ defaultValues: { tipo_votante: 'juez', peso: 1 } });
  const tipoVotante = watch('tipo_votante');

  const errorHorario = validarHorarioEncuesta({ apertura: horaApertura, cierre: horaCierre });

  useEffect(() => {
    cargarDatos();
  }, [competitionId]);

  async function cargarDatos() {
    if (!competitionId) return;
    setCargando(true);
    try {
      const [summary, formData] = await Promise.all([
        votifyApi.getCompetitionManagement(Number(competitionId)) as Promise<any>,
        votifyApi.getSurveyFormData(Number(competitionId))
      ]);

      if (
        summary.competition.evento?.organizador_id &&
        summary.competition.evento.organizador_id !== userId
      ) {
        toast.error('Sin acceso');
        navigate('/admin');
        return;
      }

      setComp(summary.competition);
      setCriterios(summary.criteria ?? []);

      const eqs: EquipoInfo[] = formData.equipos ?? [];
      const jus: JuezInfo[] = formData.jueces ?? [];
      setEquipos(eqs);
      setJueces(jus);
      setEquiposSeleccionados(eqs.map((e) => e.id));
      setJuecesSeleccionados(jus.map((j) => j.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar');
    } finally {
      setCargando(false);
    }
  }

  function toggleCriterio(critId: number) {
    setCriteriosSeleccionados((prev) =>
      prev.includes(critId) ? prev.filter((id) => id !== critId) : [...prev, critId]
    );
  }

  function toggleEquipo(equipoId: number) {
    setEquiposSeleccionados((prev) =>
      prev.includes(equipoId) ? prev.filter((id) => id !== equipoId) : [...prev, equipoId]
    );
  }

  function toggleJuez(personaId: string) {
    setJuecesSeleccionados((prev) =>
      prev.includes(personaId) ? prev.filter((id) => id !== personaId) : [...prev, personaId]
    );
  }

  async function guardarCriterio() {
    if (!competitionId || !nuevoCriterio.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (nuevoCriterio.tipo === 'rubrica') {
      const aspectosValidos = nuevoCriterio.rubricaAspectos.filter((a) => a.texto.trim());
      if (aspectosValidos.length === 0) {
        toast.error('Añade al menos un aspecto a evaluar');
        return;
      }
    } else if (['radio', 'checklist'].includes(nuevoCriterio.tipo)) {
      const opciones = opcionesConTexto(nuevoCriterio.opciones as any);
      if (opciones.length < 2) {
        toast.error('Añade al menos dos opciones');
        return;
      }
      if (!pesosOpcionesValidos(Number(nuevoCriterio.peso), opciones as any)) {
        toast.error(`La suma de pesos de las opciones debe ser ${nuevoCriterio.peso}`);
        return;
      }
    }

    setGuardandoCriterio(true);
    try {
      let opciones: Array<Record<string, unknown>> = [];
      if (nuevoCriterio.tipo === 'rubrica') {
        opciones = construirOpcionesRubrica(
          nuevoCriterio.rubricaAspectos as any,
          Number(nuevoCriterio.peso)
        ) as any;
      } else if (['radio', 'checklist'].includes(nuevoCriterio.tipo)) {
        opciones = opcionesConTexto(nuevoCriterio.opciones as any).map((o, i) => ({
          texto: (o as any).texto.trim(),
          peso: (o as any).peso ?? 0,
          orden: i
        }));
      }

      const criterio = (await votifyApi.createCriterion(Number(competitionId), {
        titulo: nuevoCriterio.titulo.trim(),
        descripcion: nuevoCriterio.descripcion || null,
        tipo: nuevoCriterio.tipo,
        peso: Number(nuevoCriterio.peso) || 1,
        rangoMin:
          nuevoCriterio.tipo === 'numerico' && nuevoCriterio.rango_min !== ''
            ? Number(nuevoCriterio.rango_min)
            : undefined,
        rangoMax:
          nuevoCriterio.tipo === 'numerico' && nuevoCriterio.rango_max !== ''
            ? Number(nuevoCriterio.rango_max)
            : undefined,
        maxSelecciones:
          nuevoCriterio.tipo === 'checklist' && !nuevoCriterio.ilimitado
            ? Number(nuevoCriterio.max_selecciones) || undefined
            : undefined,
        opciones
      })) as any;

      setCriterios((prev) => [...prev, criterio]);
      setCriteriosSeleccionados((prev) => [...prev, criterio.id]);
      setNuevoCriterio(CRITERION_DRAFT_EMPTY);
      setModalCriterio(false);
      toast.success('Criterio creado y añadido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear criterio');
    } finally {
      setGuardandoCriterio(false);
    }
  }

  async function onSubmit(data: SurveyForm, modo: 'borrador' | 'activar' = 'activar') {
    const esBorrador = modo === 'borrador';
    setAccionGuardar(modo);

    const errorHorarioSubmit = esBorrador
      ? ''
      : validarHorarioEncuesta({ apertura: horaApertura, cierre: horaCierre });
    if (errorHorarioSubmit) {
      toast.error(errorHorarioSubmit);
      return;
    }
    if (!esBorrador && equiposSeleccionados.length === 0) {
      toast.error('Selecciona al menos un equipo');
      return;
    }
    if (!esBorrador && ['juez', 'ambos'].includes(data.tipo_votante) && juecesSeleccionados.length === 0) {
      toast.error('Selecciona al menos un jurado');
      return;
    }

    setGuardando(true);
    try {
      const horaAperturaIso = esBorrador ? null : datetimeLocalToIso(horaApertura);
      const horaCierreIso = esBorrador ? null : datetimeLocalToIso(horaCierre);

      await votifyApi.createSurvey(userId!, Number(competitionId), {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        tipoVotante: data.tipo_votante,
        peso: Number(data.peso) || 1,
        criterioIds: criteriosSeleccionados,
        horaApertura: horaAperturaIso ?? undefined,
        horaCierre: horaCierreIso ?? undefined,
        equipoIds: esBorrador ? undefined : equiposSeleccionados,
        juecesIds: esBorrador ? undefined : juecesSeleccionados
      });

      const msg = esBorrador
        ? 'Borrador guardado'
        : horaAperturaIso && new Date(horaAperturaIso) > new Date()
          ? 'Encuesta programada'
          : 'Encuesta abierta';
      toast.success(msg);
      navigate(`/admin/competiciones/${competitionId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la encuesta');
    } finally {
      setGuardando(false);
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
          <Link to="/admin" className="hover:text-indigo-600">
            Mis eventos
          </Link>
          <ChevronRight size={14} />
          <Link
            to={`/admin/eventos/${comp?.evento_id}/editar`}
            className="hover:text-indigo-600"
          >
            {comp?.evento?.nombre}
          </Link>
          <ChevronRight size={14} />
          <Link
            to={`/admin/competiciones/${competitionId}`}
            className="hover:text-indigo-600"
          >
            {comp?.nombre}
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900">Nueva encuesta</span>
        </div>

        <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-700">Horario</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apertura</label>
                <input
                  type="datetime-local"
                  min={nowDatetimeLocal()}
                  value={horaApertura}
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
                    type="button"
                    onClick={() => setHoraApertura('')}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cierre</label>
                <input
                  type="datetime-local"
                  min={
                    horaApertura
                      ? datetimeLocalMasMinutos(horaApertura)
                      : nowDatetimeLocal()
                  }
                  value={horaCierre}
                  onChange={(e) =>
                    setHoraCierre(
                      limitarDatetimeLocal(
                        e.target.value,
                        horaApertura
                          ? datetimeLocalMasMinutos(horaApertura)
                          : nowDatetimeLocal()
                      )
                    )
                  }
                  className={DATETIME_INPUT_CLASS}
                />
                {horaCierre && (
                  <button
                    type="button"
                    onClick={() => setHoraCierre('')}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Si dejas la apertura vacía, la encuesta se abre al crearla. Guardar borrador no activa
              ni programa la encuesta.
            </p>
            {errorHorario && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {errorHorario}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-700">Información de la encuesta</h2>
            <Input
              label="Nombre *"
              placeholder="Votación principal"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'Obligatorio' })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register('descripcion')}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de votante
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('tipo_votante')}
                >
                  <option value="juez">Jurado</option>
                  <option value="publico">Público</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso encuesta
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('peso')}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Criterios de evaluación</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setModalCriterio(true)}
              >
                <Plus size={14} /> Crear criterio
              </Button>
            </div>
            {criterios.length === 0 ? (
              <p className="text-sm text-gray-500">No hay criterios. Crea el primero.</p>
            ) : (
              <div className="space-y-2">
                {criterios.map((criterio) => (
                  <label
                    key={criterio.id}
                    className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={criteriosSeleccionados.includes(criterio.id)}
                      onChange={() => toggleCriterio(criterio.id)}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{criterio.titulo}</span>
                        <Badge color={TIPO_COLORS[criterio.tipo]}>
                          {TIPO_LABELS[criterio.tipo]}
                        </Badge>
                        <Badge color="gray">peso {criterio.peso}</Badge>
                      </div>
                      {criterio.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5">{criterio.descripcion}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-gray-700">Asignaciones</h2>
              <p className="text-sm text-gray-500">Todos aparecen seleccionados por defecto.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <section>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Equipos</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEquiposSeleccionados(equipos.map((e) => e.id))}
                      disabled={equipos.length === 0}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-300"
                    >
                      Asignar todos
                    </button>
                    <Badge color="gray">
                      {equiposSeleccionados.length}/{equipos.length}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {equipos.map((eq) => {
                    const activo = equiposSeleccionados.includes(eq.id);
                    return (
                      <label
                        key={eq.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${activo ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={activo}
                          onChange={() => toggleEquipo(eq.id)}
                        />
                        <span className="text-sm font-medium text-gray-800">{eq.nombre}</span>
                      </label>
                    );
                  })}
                  {equipos.length === 0 && (
                    <p className="text-sm text-gray-500 py-3">
                      No hay equipos en esta competición
                    </p>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Jurado</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJuecesSeleccionados(jueces.map((j) => j.id))}
                      disabled={jueces.length === 0}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-300"
                    >
                      Asignar todos
                    </button>
                    <Badge color="gray">
                      {juecesSeleccionados.length}/{jueces.length}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {jueces.map((j) => {
                    const activo = juecesSeleccionados.includes(j.id);
                    return (
                      <label
                        key={j.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${activo ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={activo}
                          onChange={() => toggleJuez(j.id)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-800">{j.nombre}</span>
                          <span className="block text-xs text-gray-500 truncate">{j.correo}</span>
                        </span>
                      </label>
                    );
                  })}
                  {jueces.length === 0 && (
                    <p className="text-sm text-gray-500 py-3">
                      No hay jurado asignado a esta competición
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="flex justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/admin/competiciones/${competitionId}`)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={guardando && accionGuardar === 'borrador'}
              onClick={handleSubmit((data) => onSubmit(data, 'borrador'))}
            >
              Guardar borrador
            </Button>
            <Button
              type="button"
              loading={guardando && accionGuardar === 'activar'}
              disabled={!!errorHorario}
              onClick={handleSubmit((data) => onSubmit(data, 'activar'))}
            >
              {horaApertura ? 'Programar encuesta' : 'Crear y abrir'}
            </Button>
          </div>
        </form>
      </div>

      <Modal
        open={modalCriterio}
        onClose={() => setModalCriterio(false)}
        title="Crear criterio"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              value={nuevoCriterio.titulo}
              onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, titulo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Innovación"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              value={nuevoCriterio.descripcion}
              onChange={(e) =>
                setNuevoCriterio({ ...nuevoCriterio, descripcion: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={nuevoCriterio.tipo}
                onChange={(e) =>
                  setNuevoCriterio({
                    ...nuevoCriterio,
                    tipo: e.target.value as CriterionType,
                    opciones: reescalarPesosOpciones(
                      nuevoCriterio.opciones as any,
                      Number(nuevoCriterio.peso)
                    ) as any,
                    rubricaAspectos: reescalarPesosOpciones(
                      nuevoCriterio.rubricaAspectos as any,
                      Number(nuevoCriterio.peso)
                    ) as any
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="numerico">Numérico</option>
                <option value="radio">Radio</option>
                <option value="checklist">Checklist</option>
                <option value="rubrica">Rúbrica</option>
                <option value="comentario">Comentario</option>
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={nuevoCriterio.peso}
                onChange={(e) =>
                  setNuevoCriterio({
                    ...nuevoCriterio,
                    peso: e.target.value,
                    opciones: reescalarPesosOpciones(
                      nuevoCriterio.opciones as any,
                      Number(e.target.value)
                    ) as any,
                    rubricaAspectos: reescalarPesosOpciones(
                      nuevoCriterio.rubricaAspectos as any,
                      Number(e.target.value)
                    ) as any
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {nuevoCriterio.tipo === 'numerico' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mín</label>
                <input
                  type="number"
                  value={nuevoCriterio.rango_min}
                  onChange={(e) =>
                    setNuevoCriterio({ ...nuevoCriterio, rango_min: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Máx</label>
                <input
                  type="number"
                  value={nuevoCriterio.rango_max}
                  onChange={(e) =>
                    setNuevoCriterio({ ...nuevoCriterio, rango_max: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="10"
                />
              </div>
            </div>
          )}

          {nuevoCriterio.tipo === 'rubrica' && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-800">Aspectos de la rúbrica</label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setNuevoCriterio({
                      ...nuevoCriterio,
                      rubricaAspectos: reescalarPesosOpciones(
                        [
                          ...nuevoCriterio.rubricaAspectos,
                          { texto: '', peso: 0, descriptores: {} }
                        ] as any,
                        Number(nuevoCriterio.peso)
                      ) as any
                    })
                  }
                >
                  <Plus size={13} /> Aspecto
                </Button>
              </div>
              <div className="space-y-2">
                {nuevoCriterio.rubricaAspectos.map((aspecto, i) => (
                  <div key={i} className="grid grid-cols-[1fr_6rem_auto_auto] gap-2">
                    <input
                      value={aspecto.texto}
                      onChange={(e) => {
                        const aspectos = [...nuevoCriterio.rubricaAspectos];
                        aspectos[i] = { ...aspectos[i], texto: e.target.value };
                        setNuevoCriterio({ ...nuevoCriterio, rubricaAspectos: aspectos });
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder={`Aspecto ${i + 1}`}
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={nuevoCriterio.peso}
                      value={aspecto.peso ?? 0}
                      onChange={(e) =>
                        setNuevoCriterio({
                          ...nuevoCriterio,
                          rubricaAspectos: ajustarPesoOpcion(
                            nuevoCriterio.rubricaAspectos as any,
                            i,
                            Number(e.target.value),
                            Number(nuevoCriterio.peso)
                          ) as any
                        })
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Peso"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const aspectos = [...nuevoCriterio.rubricaAspectos];
                        aspectos[i] = {
                          ...aspectos[i],
                          descriptoresAbiertos: !aspectos[i].descriptoresAbiertos
                        };
                        setNuevoCriterio({ ...nuevoCriterio, rubricaAspectos: aspectos });
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white"
                    >
                      Descriptores
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoCriterio({
                          ...nuevoCriterio,
                          rubricaAspectos: reescalarPesosOpciones(
                            nuevoCriterio.rubricaAspectos.filter((_, j) => j !== i) as any,
                            Number(nuevoCriterio.peso)
                          ) as any
                        })
                      }
                      className={`text-red-400 ${nuevoCriterio.rubricaAspectos.length <= 1 ? 'invisible' : ''}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="grid grid-cols-[1.2fr_repeat(4,1fr)] bg-gray-50 text-xs font-semibold text-gray-600">
                  <div className="px-3 py-2">Aspecto</div>
                  {RUBRICA_NIVELES.map((nivel) => (
                    <div key={nivel.key} className="px-3 py-2 text-center">
                      {nivel.label}
                    </div>
                  ))}
                </div>
                {nuevoCriterio.rubricaAspectos
                  .filter((a) => a.texto.trim())
                  .map((aspecto, aspectoIndex) => (
                    <div
                      key={aspecto.texto + aspectoIndex}
                      className="grid grid-cols-[1.2fr_repeat(4,1fr)] border-t border-gray-100 text-xs"
                    >
                      <div className="px-3 py-2 font-medium text-gray-700">{aspecto.texto}</div>
                      {RUBRICA_NIVELES.map((nivel) => {
                        const realIndex = nuevoCriterio.rubricaAspectos.indexOf(aspecto);
                        return (
                          <div key={nivel.key} className={`m-1 rounded-md border p-2 ${nivel.color}`}>
                            <div className="text-center font-semibold">
                              {((Number(aspecto.peso) || 0) * nivel.factor).toFixed(2)}
                            </div>
                            {aspecto.descriptoresAbiertos && (
                              <textarea
                                rows={2}
                                value={aspecto.descriptores?.[nivel.key] || ''}
                                onChange={(e) => {
                                  const aspectos = [...nuevoCriterio.rubricaAspectos];
                                  aspectos[realIndex] = {
                                    ...aspectos[realIndex],
                                    descriptores: {
                                      ...(aspectos[realIndex].descriptores ?? {}),
                                      [nivel.key]: e.target.value
                                    }
                                  };
                                  setNuevoCriterio({ ...nuevoCriterio, rubricaAspectos: aspectos });
                                }}
                                className="mt-1 w-full resize-none rounded border border-white/70 bg-white/70 px-2 py-1 text-[11px] text-gray-700"
                                placeholder="Opcional"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {['radio', 'checklist'].includes(nuevoCriterio.tipo) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Opciones</label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setNuevoCriterio({
                      ...nuevoCriterio,
                      opciones: [...nuevoCriterio.opciones, { texto: '', peso: 0 }]
                    })
                  }
                >
                  <Plus size={13} />
                </Button>
              </div>
              {nuevoCriterio.opciones.map((op, i) => (
                <div key={i} className="grid grid-cols-[1fr_6rem_auto] gap-2 mb-2">
                  <input
                    value={op.texto}
                    onChange={(e) => {
                      const ops = [...nuevoCriterio.opciones];
                      ops[i] = { ...ops[i], texto: e.target.value };
                      setNuevoCriterio({ ...nuevoCriterio, opciones: ops });
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder={`Opción ${i + 1}`}
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={nuevoCriterio.peso}
                    value={op.peso ?? 0}
                    onChange={(e) =>
                      setNuevoCriterio({
                        ...nuevoCriterio,
                        opciones: ajustarPesoOpcion(
                          nuevoCriterio.opciones as any,
                          i,
                          Number(e.target.value),
                          Number(nuevoCriterio.peso)
                        ) as any
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Peso"
                  />
                  {nuevoCriterio.opciones.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoCriterio({
                          ...nuevoCriterio,
                          opciones: reescalarPesosOpciones(
                            nuevoCriterio.opciones.filter((_, j) => j !== i) as any,
                            Number(nuevoCriterio.peso)
                          ) as any
                        })
                      }
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {nuevoCriterio.tipo === 'checklist' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Máx. selecciones:</label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={nuevoCriterio.ilimitado}
                  onChange={(e) =>
                    setNuevoCriterio({ ...nuevoCriterio, ilimitado: e.target.checked })
                  }
                />
                Ilimitado
              </label>
              {!nuevoCriterio.ilimitado && (
                <input
                  type="number"
                  min="1"
                  value={nuevoCriterio.max_selecciones}
                  onChange={(e) =>
                    setNuevoCriterio({ ...nuevoCriterio, max_selecciones: e.target.value })
                  }
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
                />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalCriterio(false)}>
              Cancelar
            </Button>
            <Button loading={guardandoCriterio} onClick={guardarCriterio}>
              Crear y añadir
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
