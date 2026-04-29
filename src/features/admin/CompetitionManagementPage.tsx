import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Badge } from '../../shared/components/ui/Badge';
import { Breadcrumb } from '../../shared/components/ui/Breadcrumb';
import { Button } from '../../shared/components/ui/Button';
import { Modal } from '../../shared/components/ui/Modal';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import { etiquetaAperturaEncuesta, etiquetaCierre, formatFechaLocal } from '../../shared/utils/dateTime';
import {
  RUBRICA_NIVELES,
  ajustarPesoOpcion,
  agruparRubrica,
  construirOpcionesRubrica,
  opcionesConTexto,
  pesosOpcionesValidos,
  reescalarPesosOpciones
} from '../../shared/utils/scoring';

const ESTADO_ORDER: Record<string, number> = { borrador: 0, programada: 1, abierta: 2, cerrada: 3 };

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

const CRITERIO_DRAFT_VACIO = {
  titulo: '',
  descripcion: '',
  tipo: 'numerico' as CriterionType,
  peso: '1',
  rango_min: '',
  rango_max: '',
  max_selecciones: '',
  ilimitado: true,
  opciones: [{ texto: '', peso: 0 }, { texto: '', peso: 1 }],
  rubricaAspectos: [
    { texto: 'Calidad técnica', peso: 0.5, descriptores: {} as Record<string, string>, descriptoresAbiertos: false },
    { texto: 'Presentación', peso: 0.5, descriptores: {} as Record<string, string>, descriptoresAbiertos: false }
  ]
};

type Team = {
  id: number;
  nombre: string;
  proyecto?: Array<{ id: number; nombre: string; descripcion?: string | null }>;
  participante?: Array<{ id: number; nombre: string; correo: string; rol?: string | null }>;
};

type Criterion = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: CriterionType;
  peso: number;
  rango_min?: number | null;
  rango_max?: number | null;
  criterio_opcion?: Array<{
    id: number;
    texto: string;
    orden?: number;
    peso?: number | null;
    aspecto?: string | null;
    nivel?: string | null;
    descriptor?: string | null;
  }>;
};

type Survey = {
  id: number;
  nombre: string;
  estado: 'borrador' | 'abierta' | 'programada' | 'cerrada';
  tipo_votante: string;
  codigo_sala?: string | null;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  hora_reapertura?: string | null;
};

type Judge = {
  persona_id: string;
  persona?: { nombre?: string; correo?: string };
};

type CompetitionSummary = {
  competition: {
    id: number;
    nombre: string;
    evento_id: number;
    evento?: { id: number; nombre: string; organizador_id: string };
  };
  teams: Team[];
  criteria: Criterion[];
  surveys: Survey[];
  judges: Judge[];
};

export function CompetitionManagementPage() {
  const { competitionId } = useParams();
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  const [comp, setComp] = useState<CompetitionSummary['competition'] | null>(null);
  const [equipos, setEquipos] = useState<Team[]>([]);
  const [criterios, setCriterios] = useState<Criterion[]>([]);
  const [encuestas, setEncuestas] = useState<Survey[]>([]);
  const [jueces, setJueces] = useState<Judge[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalEquipo, setModalEquipo] = useState(false);
  const [modalCriterio, setModalCriterio] = useState(false);
  const [modalJuez, setModalJuez] = useState(false);

  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: '',
    proyectoNombre: '',
    proyectoDesc: '',
    participantes: [{ nombre: '', correo: '', rol: '' }]
  });

  const [nuevoCriterio, setNuevoCriterio] = useState(CRITERIO_DRAFT_VACIO);

  const [correoJuez, setCorreoJuez] = useState('');
  const [encuestasJuez, setEncuestasJuez] = useState<number[]>([]);
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);
  const [guardandoCriterio, setGuardandoCriterio] = useState(false);
  const [guardandoJuez, setGuardandoJuez] = useState(false);

  type EquipoDraft = { id: number; nombre: string; proyectoId: number | null; proyectoNombre: string; proyectoDesc: string; participantes: Array<{ id?: number; nombre: string; correo: string; rol: string }> };
  const [equipoEditando, setEquipoEditando] = useState<EquipoDraft | null>(null);
  const [modalEditarEquipo, setModalEditarEquipo] = useState(false);
  const [guardandoEdicionEquipo, setGuardandoEdicionEquipo] = useState(false);

  const [criterioEditando, setCriterioEditando] = useState<Criterion | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [competitionId]);

  async function cargarDatos() {
    if (!competitionId) return;
    setCargando(true);
    try {
      await votifyApi.processScheduledSurveys(undefined, Number(competitionId));
      const summary = await votifyApi.getCompetitionManagement(Number(competitionId)) as CompetitionSummary;

      if (summary.competition.evento?.organizador_id && summary.competition.evento.organizador_id !== userId) {
        toast.error('No tienes permisos para gestionar esta competición');
        navigate('/admin');
        return;
      }

      setComp(summary.competition);
      setEquipos(summary.teams ?? []);
      setCriterios(summary.criteria ?? []);
      setEncuestas(summary.surveys ?? []);
      setJueces(summary.judges ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  }

  async function guardarEquipo() {
    if (!competitionId) return;
    if (!nuevoEquipo.nombre.trim() || !nuevoEquipo.proyectoNombre.trim()) {
      return toast.error('Nombre del equipo y proyecto son obligatorios');
    }
    const participantesValidos = nuevoEquipo.participantes.filter((p) => p.nombre.trim() || p.correo.trim() || p.rol.trim());
    if (participantesValidos.length === 0) {
      return toast.error('Añade al menos un participante');
    }
    if (participantesValidos.some((p) => !p.nombre.trim() || !p.correo.trim() || !p.rol.trim())) {
      return toast.error('Nombre, correo y rol son obligatorios para cada participante');
    }

    setGuardandoEquipo(true);
    try {
      await votifyApi.createTeam(Number(competitionId), {
        equipoNombre: nuevoEquipo.nombre.trim(),
        proyecto: {
          nombre: nuevoEquipo.proyectoNombre.trim(),
          descripcion: nuevoEquipo.proyectoDesc || null
        },
        participantes: participantesValidos
          .map((participante) => ({
            nombre: participante.nombre.trim(),
            correo: participante.correo.trim(),
            rol: participante.rol.trim()
          }))
      });

      await cargarDatos();
      setNuevoEquipo({ nombre: '', proyectoNombre: '', proyectoDesc: '', participantes: [{ nombre: '', correo: '', rol: '' }] });
      setModalEquipo(false);
      toast.success('Equipo añadido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo añadir el equipo');
    } finally {
      setGuardandoEquipo(false);
    }
  }

  function abrirEditarEquipo(equipo: Team) {
    setEquipoEditando({
      id: equipo.id,
      nombre: equipo.nombre,
      proyectoId: equipo.proyecto?.[0]?.id ?? null,
      proyectoNombre: equipo.proyecto?.[0]?.nombre ?? '',
      proyectoDesc: equipo.proyecto?.[0]?.descripcion ?? '',
      participantes: (equipo.participante?.length ? equipo.participante : [{ nombre: '', correo: '', id: undefined as any }])
        .map((p: any) => ({ id: p.id, nombre: p.nombre ?? '', correo: p.correo ?? '', rol: p.rol ?? '' }))
    });
    setModalEditarEquipo(true);
  }

  async function guardarEdicionEquipo() {
    if (!equipoEditando) return;
    if (!equipoEditando.nombre.trim() || !equipoEditando.proyectoNombre.trim()) {
      return toast.error('Nombre del equipo y proyecto son obligatorios');
    }
    const partsValidos = equipoEditando.participantes.filter((p) => p.nombre.trim() || p.correo.trim() || p.rol.trim());
    if (partsValidos.length === 0) {
      return toast.error('Añade al menos un participante');
    }
    if (partsValidos.some((p) => !p.nombre.trim() || !p.correo.trim() || !p.rol.trim())) {
      return toast.error('Nombre, correo y rol son obligatorios para cada participante');
    }
    setGuardandoEdicionEquipo(true);
    try {
      await votifyApi.updateTeam(equipoEditando.id, {
        nombre: equipoEditando.nombre.trim(),
        proyectoId: equipoEditando.proyectoId,
        proyectoNombre: equipoEditando.proyectoNombre.trim(),
        proyectoDesc: equipoEditando.proyectoDesc || null,
        participantes: partsValidos.map((p) => ({ id: p.id, nombre: p.nombre.trim(), correo: p.correo.trim(), rol: p.rol.trim() }))
      });
      await cargarDatos();
      setModalEditarEquipo(false);
      setEquipoEditando(null);
      toast.success('Equipo actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el equipo');
    } finally {
      setGuardandoEdicionEquipo(false);
    }
  }

  async function eliminarEquipo() {
    if (!equipoEditando) return;
    if (!window.confirm(`¿Seguro que quieres eliminar "${equipoEditando.nombre}"?`)) return;
    setGuardandoEdicionEquipo(true);
    try {
      await votifyApi.deleteTeam(equipoEditando.id);
      await cargarDatos();
      setModalEditarEquipo(false);
      setEquipoEditando(null);
      toast.success('Equipo eliminado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el equipo');
    } finally {
      setGuardandoEdicionEquipo(false);
    }
  }

  function abrirEditarCriterio(criterio: Criterion) {
    const opcionesOrdenadas = [...(criterio.criterio_opcion ?? [])].sort((a, b) => (a as any).orden - (b as any).orden);
    const rubricaAspectos = criterio.tipo === 'rubrica'
      ? agruparRubrica(opcionesOrdenadas as any).map((grupo) => ({
          texto: grupo.aspecto,
          peso: Math.max(...grupo.opciones.map((opcion) => Number(opcion.peso) || 0), 0),
          descriptores: grupo.opciones.reduce<Record<string, string>>((acc, opcion) => {
            if (opcion.nivel && opcion.descriptor) acc[opcion.nivel] = opcion.descriptor;
            return acc;
          }, {}),
          descriptoresAbiertos: false
        }))
      : nuevoCriterio.rubricaAspectos;

    setCriterioEditando(criterio);
    setNuevoCriterio({
      titulo: criterio.titulo,
      descripcion: criterio.descripcion ?? '',
      tipo: criterio.tipo,
      peso: String(criterio.peso ?? 1),
      rango_min: criterio.rango_min != null ? String(criterio.rango_min) : '',
      rango_max: criterio.rango_max != null ? String(criterio.rango_max) : '',
      max_selecciones: '',
      ilimitado: true,
      opciones: ['radio', 'checklist'].includes(criterio.tipo) && opcionesOrdenadas.length
        ? opcionesOrdenadas.map((o: any) => ({ texto: o.texto ?? '', peso: Number(o.peso) ?? 0 }))
        : [{ texto: '', peso: 0 }, { texto: '', peso: 1 }],
      rubricaAspectos
    });
    setModalCriterio(true);
  }

  async function guardarCriterio() {
    if (!competitionId) return;
    const pesoCriterio = Number(nuevoCriterio.peso);
    if (!Number.isFinite(pesoCriterio) || pesoCriterio <= 0) {
      return toast.error('El peso debe ser mayor que cero');
    }
    const rangoMin = nuevoCriterio.rango_min !== '' ? Number(nuevoCriterio.rango_min) : undefined;
    const rangoMax = nuevoCriterio.rango_max !== '' ? Number(nuevoCriterio.rango_max) : undefined;
    if ((rangoMin != null && rangoMin < 0) || (rangoMax != null && rangoMax < 0)) {
      return toast.error('Los rangos no pueden ser negativos');
    }
    if (rangoMin != null && rangoMax != null && rangoMin > rangoMax) {
      return toast.error('El rango mínimo no puede ser mayor que el máximo');
    }
    if (!nuevoCriterio.titulo.trim()) return toast.error('El título es obligatorio');

    if (nuevoCriterio.tipo === 'rubrica') {
      const aspectosValidos = nuevoCriterio.rubricaAspectos.filter((a) => a.texto.trim());
      if (aspectosValidos.length === 0) {
        toast.error('Añade al menos un aspecto a evaluar');
        return;
      }
      const sumaAspectos = aspectosValidos.reduce((sum, a) => sum + (Number(a.peso) || 0), 0);
      if (Math.abs(sumaAspectos - pesoCriterio) >= 0.0001) {
        toast.error(`Peso asignado ${sumaAspectos.toFixed(2)} de ${pesoCriterio}. Ajusta los pesos antes de guardar`);
        return;
      }
    } else if (['radio', 'checklist'].includes(nuevoCriterio.tipo)) {
      const opciones = opcionesConTexto(nuevoCriterio.opciones as any);
      if (opciones.length < 2) {
        toast.error('Añade al menos dos opciones');
        return;
      }
      if (!pesosOpcionesValidos(pesoCriterio, opciones as any)) {
        const sumaOpciones = opciones.reduce((sum: number, op: any) => sum + (Number(op.peso) || 0), 0);
        toast.error(`Peso asignado ${sumaOpciones.toFixed(2)} de ${pesoCriterio}. Ajusta los pesos antes de guardar`);
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
        opciones = nuevoCriterio.opciones
          .filter((op) => op.texto.trim())
          .map((op, orden) => ({ texto: op.texto.trim(), peso: (op as any).peso ?? 0, orden }));
      }

      const payload = {
        titulo: nuevoCriterio.titulo.trim(),
        descripcion: nuevoCriterio.descripcion || null,
        tipo: nuevoCriterio.tipo,
        peso: pesoCriterio,
        rangoMin: nuevoCriterio.tipo === 'numerico' ? rangoMin : undefined,
        rangoMax: nuevoCriterio.tipo === 'numerico' ? rangoMax : undefined,
        maxSelecciones: nuevoCriterio.tipo === 'checklist' && !nuevoCriterio.ilimitado ? Number(nuevoCriterio.max_selecciones) || undefined : undefined,
        opciones
      };

      if (criterioEditando) {
        await votifyApi.updateCriterion(criterioEditando.id, payload);
      } else {
        await votifyApi.createCriterion(Number(competitionId), payload);
      }

      await cargarDatos();
      setCriterioEditando(null);
      setNuevoCriterio(CRITERIO_DRAFT_VACIO);
      setModalCriterio(false);
      toast.success(criterioEditando ? 'Criterio actualizado' : 'Criterio añadido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el criterio');
    } finally {
      setGuardandoCriterio(false);
    }
  }

  async function guardarJuez() {
    if (!competitionId || !correoJuez.trim()) return;
    setGuardandoJuez(true);
    try {
      await votifyApi.assignJudge(Number(competitionId), {
        correo: correoJuez.trim(),
        encuestaIds: encuestasJuez
      });
      await cargarDatos();
      setCorreoJuez('');
      setEncuestasJuez([]);
      setModalJuez(false);
      toast.success('Juez añadido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo añadir el juez');
    } finally {
      setGuardandoJuez(false);
    }
  }

  async function eliminarJuez(personaId: string) {
    if (!competitionId) return;
    try {
      await votifyApi.removeJudge(Number(competitionId), personaId);
      setJueces(jueces.filter((juez) => juez.persona_id !== personaId));
      toast.success('Juez eliminado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el juez');
    }
  }

  async function eliminarCriterio(criterionId: number) {
    try {
      await votifyApi.deleteCriterion(criterionId);
      setCriterios(criterios.filter((criterio) => criterio.id !== criterionId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el criterio');
    }
  }

  async function eliminarEncuesta(encuesta: Survey) {
    if (!['borrador', 'cerrada'].includes(encuesta.estado)) return;
    if (encuesta.estado === 'borrador') {
      if (!window.confirm(`Eliminar la encuesta "${encuesta.nombre}"?`)) return;
      try {
        await votifyApi.deleteSurvey(encuesta.id);
        setEncuestas(encuestas.filter((item) => item.id !== encuesta.id));
        toast.success('Encuesta eliminada');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la encuesta');
      }
      return;
    }
    if (!window.confirm(`¿Eliminar la encuesta cerrada "${encuesta.nombre}"?`)) return;
    try {
      await votifyApi.deleteSurvey(encuesta.id);
      setEncuestas(encuestas.filter((item) => item.id !== encuesta.id));
      toast.success('Encuesta eliminada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la encuesta');
    }
  }

  if (cargando) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[
          { label: 'Mis eventos', to: '/admin' },
          { label: comp?.evento?.nombre ?? '', to: `/admin/eventos/${comp?.evento_id}/editar` },
          { label: comp?.nombre ?? '' }
        ]} />

        <section className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">Equipos</h2>
            <Button size="sm" onClick={() => setModalEquipo(true)}>
              <Plus size={14} /> Añadir equipo
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {equipos.map((equipo) => (
              <div key={equipo.id} onClick={() => abrirEditarEquipo(equipo)}
                role="button" tabIndex={0}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') abrirEditarEquipo(equipo); }}
                className="bg-white shadow-card border border-gray-100 rounded-xl p-4 text-left w-full hover:shadow-card-hover hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer">
                <p className="font-semibold text-gray-800">{equipo.nombre}</p>
                {equipo.proyecto?.[0] && <p className="text-sm text-indigo-600 mt-1">{equipo.proyecto[0].nombre}</p>}
                <div className="mt-2 space-y-0.5">
                  {equipo.participante?.map((participante) => (
                    <p
                      key={participante.id}
                      className="text-xs text-gray-500"
                    >
                      {participante.nombre} · {participante.correo}{participante.rol ? ` · ${participante.rol}` : ''}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {equipos.length === 0 && <p className="text-sm text-gray-500 py-4">No hay equipos aún</p>}
        </section>

        <hr className="border-gray-100 my-8" />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">Criterios</h2>
            <Button size="sm" onClick={() => setModalCriterio(true)}>
              <Plus size={14} /> Añadir criterio
            </Button>
          </div>
          <div className="space-y-2">
            {criterios.map((criterio) => (
              <div key={criterio.id} className="bg-white shadow-card border border-gray-100 rounded-xl p-4 flex items-start justify-between hover:shadow-card-hover hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer"
                role="button" tabIndex={0}
                onClick={() => abrirEditarCriterio(criterio)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') abrirEditarCriterio(criterio); }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{criterio.titulo}</span>
                    <Badge color={TIPO_COLORS[criterio.tipo]}>{TIPO_LABELS[criterio.tipo]}</Badge>
                    <Badge color="gray">peso: {criterio.peso}</Badge>
                  </div>
                  {criterio.descripcion && <p className="text-xs text-gray-500">{criterio.descripcion}</p>}
                  {criterio.tipo === 'numerico' && (criterio.rango_min != null || criterio.rango_max != null) && (
                    <p className="text-xs text-gray-400 mt-1">Rango: {criterio.rango_min ?? '—'} – {criterio.rango_max ?? '—'}</p>
                  )}
                  {['radio', 'checklist'].includes(criterio.tipo) && Boolean(criterio.criterio_opcion?.length) && (
                    <p className="text-xs text-gray-400 mt-1">{criterio.criterio_opcion?.map((opcion) => opcion.texto).join(' / ')}</p>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); eliminarCriterio(criterio.id); }} className="text-red-400 hover:text-red-600 ml-3">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          {criterios.length === 0 && <p className="text-sm text-gray-500 py-4">No hay criterios aún</p>}
        </section>

        <hr className="border-gray-100 my-8" />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">Encuestas</h2>
            <Link to={`/admin/competiciones/${competitionId}/encuesta/nueva`}>
              <Button size="sm"><Plus size={14} /> Nueva encuesta</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {[...encuestas].sort((a, b) => {
                const orderDiff = (ESTADO_ORDER[a.estado] ?? 99) - (ESTADO_ORDER[b.estado] ?? 99);
                if (orderDiff !== 0) return orderDiff;
                const key = (e: Survey) => {
                  if (e.estado === 'cerrada') return e.hora_cierre ? -new Date(e.hora_cierre).getTime() : 0;
                  if (e.estado === 'abierta') return e.hora_cierre ? new Date(e.hora_cierre).getTime() : Infinity;
                  return e.hora_apertura ? new Date(e.hora_apertura).getTime() : Infinity;
                };
                return key(a) - key(b);
              }).map((encuesta) => (
              <div key={encuesta.id} className="bg-white shadow-card border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-card-hover transition-all duration-200">
                <div>
                  <p className="font-medium text-gray-800">{encuesta.nombre}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge color={encuesta.estado === 'abierta' ? 'green' : encuesta.estado === 'cerrada' ? 'red' : encuesta.estado === 'programada' ? 'yellow' : 'gray'}>{encuesta.estado}</Badge>
                    <Badge color="blue">{encuesta.tipo_votante}</Badge>
                    {encuesta.codigo_sala && <Badge color="purple">Sala: {encuesta.codigo_sala}</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 space-x-2">
                    <span>
                      {etiquetaAperturaEncuesta(encuesta)}: {encuesta.hora_reapertura ? formatFechaLocal(encuesta.hora_reapertura) : encuesta.hora_apertura ? formatFechaLocal(encuesta.hora_apertura) : 'sin programar'}
                    </span>
                    <span>
                      {encuesta.hora_cierre ? etiquetaCierre(encuesta.hora_cierre) : 'Cierra'}: {encuesta.hora_cierre ? formatFechaLocal(encuesta.hora_cierre) : 'sin programar'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/admin/encuestas/${encuesta.id}/resultados`} className="text-sm text-indigo-600 hover:underline">
                    Detalles
                  </Link>
                  {['borrador', 'cerrada'].includes(encuesta.estado) && (
                    <button
                      type="button"
                      onClick={() => eliminarEncuesta(encuesta)}
                      className="text-red-400 hover:text-red-600"
                      title="Eliminar encuesta"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {encuestas.length === 0 && <p className="text-sm text-gray-500 py-4">No hay encuestas aún</p>}
        </section>

        <hr className="border-gray-100 my-8" />

        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">Jurado</h2>
            <Button size="sm" onClick={() => setModalJuez(true)}>
              <UserPlus size={14} /> Añadir juez
            </Button>
          </div>
          <div className="space-y-2">
            {jueces.map((juez) => (
              <div key={juez.persona_id} className="bg-white shadow-card border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-800">{juez.persona?.nombre || '(sin nombre)'}</p>
                  <p className="text-xs text-gray-500">{juez.persona?.correo}</p>
                </div>
                <button onClick={() => eliminarJuez(juez.persona_id)} className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {jueces.length === 0 && <p className="text-sm text-gray-500 py-4">No hay jueces asignados</p>}
          </div>
        </section>
      </div>

      <TeamModal
        open={modalEquipo}
        onClose={() => setModalEquipo(false)}
        value={nuevoEquipo}
        setValue={setNuevoEquipo}
        loading={guardandoEquipo}
        onSave={guardarEquipo}
      />

      <CriterionModal
        open={modalCriterio}
        onClose={() => { setModalCriterio(false); setCriterioEditando(null); setNuevoCriterio(CRITERIO_DRAFT_VACIO); }}
        value={nuevoCriterio}
        setValue={setNuevoCriterio}
        loading={guardandoCriterio}
        onSave={guardarCriterio}
        editing={criterioEditando != null}
      />

      {equipoEditando && (
        <Modal open={modalEditarEquipo} onClose={() => { setModalEditarEquipo(false); setEquipoEditando(null); }} title="Editar equipo" maxWidth="max-w-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del equipo *</label>
              <input value={equipoEditando.nombre} onChange={(e) => setEquipoEditando({ ...equipoEditando, nombre: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del proyecto *</label>
              <input value={equipoEditando.proyectoNombre} onChange={(e) => setEquipoEditando({ ...equipoEditando, proyectoNombre: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del proyecto</label>
              <textarea rows={2} value={equipoEditando.proyectoDesc} onChange={(e) => setEquipoEditando({ ...equipoEditando, proyectoDesc: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Participantes</label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEquipoEditando({
                    ...equipoEditando,
                    participantes: [...equipoEditando.participantes, { nombre: '', correo: '', rol: '' }]
                  })}
                >
                  <Plus size={13} /> Anadir
                </Button>
              </div>
              <div className="space-y-2">
                {equipoEditando.participantes.map((p, i) => (
                  <div key={i}>
                    {p.id ? (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-700">{(p.nombre || p.correo).charAt(0).toUpperCase()}</span>
                        </div>
                        <Link to={`/admin/participantes/${p.id}`} className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 truncate">{p.nombre || p.correo}</p>
                          {p.rol && <p className="text-xs text-gray-400 truncate">{p.rol}</p>}
                        </Link>
                        {equipoEditando.participantes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEquipoEditando({ ...equipoEditando, participantes: equipoEditando.participantes.filter((_, j) => j !== i) })}
                            className="text-red-300 hover:text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap rounded-xl border border-gray-100 bg-gray-50 p-2">
                        <input
                          value={p.nombre}
                          onChange={(event) => {
                            const participantes = [...equipoEditando.participantes];
                            participantes[i] = { ...participantes[i], nombre: event.target.value };
                            setEquipoEditando({ ...equipoEditando, participantes });
                          }}
                          className="flex-1 min-w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Nombre *"
                        />
                        <input
                          type="email"
                          value={p.correo}
                          onChange={(event) => {
                            const participantes = [...equipoEditando.participantes];
                            participantes[i] = { ...participantes[i], correo: event.target.value };
                            setEquipoEditando({ ...equipoEditando, participantes });
                          }}
                          className="flex-1 min-w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Correo *"
                        />
                        <input
                          value={p.rol}
                          onChange={(event) => {
                            const participantes = [...equipoEditando.participantes];
                            participantes[i] = { ...participantes[i], rol: event.target.value };
                            setEquipoEditando({ ...equipoEditando, participantes });
                          }}
                          className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Rol *"
                        />
                        {equipoEditando.participantes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEquipoEditando({ ...equipoEditando, participantes: equipoEditando.participantes.filter((_, j) => j !== i) })}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="danger" loading={guardandoEdicionEquipo} onClick={eliminarEquipo}>Eliminar</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setModalEditarEquipo(false); setEquipoEditando(null); }}>Cancelar</Button>
                <Button loading={guardandoEdicionEquipo} onClick={guardarEdicionEquipo}>Guardar</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <JudgeModal
        open={modalJuez}
        onClose={() => {
          setModalJuez(false);
          setCorreoJuez('');
          setEncuestasJuez([]);
        }}
        correo={correoJuez}
        setCorreo={setCorreoJuez}
        encuestas={encuestas}
        selected={encuestasJuez}
        setSelected={setEncuestasJuez}
        loading={guardandoJuez}
        onSave={guardarJuez}
      />
    </Layout>
  );
}

type TeamDraft = {
  nombre: string;
  proyectoNombre: string;
  proyectoDesc: string;
  participantes: Array<{ nombre: string; correo: string; rol: string }>;
};

function TeamModal({
  open,
  onClose,
  value,
  setValue,
  loading,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  value: TeamDraft;
  setValue: (value: TeamDraft) => void;
  loading: boolean;
  onSave: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Añadir equipo" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del equipo *</label>
          <input value={value.nombre} onChange={(event) => setValue({ ...value, nombre: event.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Equipo Alpha" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del proyecto *</label>
          <input value={value.proyectoNombre} onChange={(event) => setValue({ ...value, proyectoNombre: event.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Mi proyecto" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del proyecto</label>
          <textarea rows={2} value={value.proyectoDesc} onChange={(event) => setValue({ ...value, proyectoDesc: event.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Participantes</label>
            <Button type="button" size="sm" variant="secondary" onClick={() => setValue({ ...value, participantes: [...value.participantes, { nombre: '', correo: '', rol: '' }] })}>
              <Plus size={13} /> Añadir
            </Button>
          </div>
          {value.participantes.map((participante, index) => (
            <div key={index} className="flex gap-2 mb-2 flex-wrap">
              <input
                value={participante.nombre}
                onChange={(event) => {
                  const participantes = [...value.participantes];
                  participantes[index].nombre = event.target.value;
                  setValue({ ...value, participantes });
                }}
                className="flex-1 min-w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Nombre *"
              />
              <input
                value={participante.correo}
                onChange={(event) => {
                  const participantes = [...value.participantes];
                  participantes[index].correo = event.target.value;
                  setValue({ ...value, participantes });
                }}
                className="flex-1 min-w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Correo *"
              />
              <input
                value={participante.rol}
                onChange={(event) => {
                  const participantes = [...value.participantes];
                  participantes[index].rol = event.target.value;
                  setValue({ ...value, participantes });
                }}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Rol *"
              />
              {value.participantes.length > 1 && (
                <button type="button" onClick={() => setValue({ ...value, participantes: value.participantes.filter((_, j) => j !== index) })} className="text-red-400">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={loading} onClick={onSave}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}

type AspectoDraft = {
  texto: string;
  peso: number;
  descriptoresAbiertos: boolean;
  descriptores: Record<string, string>;
};

type CriterionDraft = {
  titulo: string;
  descripcion: string;
  tipo: CriterionType;
  peso: string;
  rango_min: string;
  rango_max: string;
  max_selecciones: string;
  ilimitado: boolean;
  opciones: Array<{ texto: string; peso: number }>;
  rubricaAspectos: AspectoDraft[];
};

function opcionesIniciales(peso: string) {
  const total = Number(peso);
  return [{ texto: '', peso: 0 }, { texto: '', peso: Number.isFinite(total) && total > 0 ? total : 1 }];
}

function aspectosIniciales(peso: string): AspectoDraft[] {
  const total = Number(peso);
  const pesoAspecto = (Number.isFinite(total) && total > 0 ? total : 1) / 2;
  return [
    { texto: 'Calidad técnica', peso: pesoAspecto, descriptores: {}, descriptoresAbiertos: false },
    { texto: 'Presentación', peso: pesoAspecto, descriptores: {}, descriptoresAbiertos: false }
  ];
}

function cambiarTipoCriterio(value: CriterionDraft, tipo: CriterionType): CriterionDraft {
  return {
    ...value,
    tipo,
    rango_min: '',
    rango_max: '',
    max_selecciones: '',
    ilimitado: true,
    opciones: opcionesIniciales(value.peso),
    rubricaAspectos: aspectosIniciales(value.peso)
  };
}

function CriterionModal({
  open,
  onClose,
  value,
  setValue,
  loading,
  onSave,
  editing
}: {
  open: boolean;
  onClose: () => void;
  value: CriterionDraft;
  setValue: (value: CriterionDraft) => void;
  loading: boolean;
  onSave: () => void;
  editing?: boolean;
}) {
  const aspectosValidos = value.rubricaAspectos.filter((a) => a.texto.trim());
  const sumaAspectos = aspectosValidos.reduce((sum, a) => sum + (Number(a.peso) || 0), 0);
  const rubricaPesosOk = aspectosValidos.length === 0 || Math.abs(sumaAspectos - Number(value.peso)) < 0.0001;

  const opcionesConPeso = opcionesConTexto(value.opciones as any);
  const sumaOpciones = opcionesConPeso.reduce((sum: number, o: any) => sum + (Number(o.peso) || 0), 0);
  const opcionesPesosOk = opcionesConPeso.length < 2 || Math.abs(sumaOpciones - Number(value.peso)) < 0.0001;
  const guardarDeshabilitado =
    (value.tipo === 'rubrica' && !rubricaPesosOk) ||
    (['radio', 'checklist'].includes(value.tipo) && !opcionesPesosOk);

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar criterio' : 'Añadir criterio'} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input value={value.titulo} onChange={(e) => setValue({ ...value, titulo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Innovación" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input value={value.descripcion} onChange={(e) => setValue({ ...value, descripcion: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={value.tipo} onChange={(e) => setValue(cambiarTipoCriterio(value, e.target.value as CriterionType))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="numerico">Numérico</option>
              <option value="radio">Radio</option>
              <option value="checklist">Checklist</option>
              <option value="rubrica">Rúbrica</option>
              <option value="comentario">Comentario</option>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
            <input type="number" step="0.1" min="0.1" value={value.peso}
              onChange={(e) => setValue({
                ...value, peso: e.target.value === '' ? '' : String(Math.max(Number(e.target.value) || 0, 0)),
                opciones: reescalarPesosOpciones(value.opciones as any, Math.max(Number(e.target.value) || 0, 0)) as any,
                rubricaAspectos: reescalarPesosOpciones(value.rubricaAspectos as any, Math.max(Number(e.target.value) || 0, 0)) as any
              })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        {value.tipo === 'numerico' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mín</label>
              <input type="number" min="0" value={value.rango_min} onChange={(e) => setValue({ ...value, rango_min: e.target.value === '' ? '' : String(Math.max(Number(e.target.value) || 0, 0)) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Máx</label>
              <input type="number" min="0" value={value.rango_max} onChange={(e) => setValue({ ...value, rango_max: e.target.value === '' ? '' : String(Math.max(Number(e.target.value) || 0, 0)) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="10" />
            </div>
          </div>
        )}
        {value.tipo === 'rubrica' && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-800">Aspectos</label>
              <Button type="button" size="sm" variant="secondary" onClick={() => setValue({
                ...value,
                rubricaAspectos: reescalarPesosOpciones([...value.rubricaAspectos, { texto: '', peso: 0, descriptores: {}, descriptoresAbiertos: false }] as any, Number(value.peso)) as any
              })}>
                <Plus size={13} /> Aspecto
              </Button>
            </div>
            <div className="space-y-2">
              {value.rubricaAspectos.map((aspecto, i) => (
                <div key={i} className="grid grid-cols-[1fr_5rem_auto_auto] gap-2">
                  <input value={aspecto.texto}
                    onChange={(e) => { const a = [...value.rubricaAspectos]; a[i] = { ...a[i], texto: e.target.value }; setValue({ ...value, rubricaAspectos: a }); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={`Aspecto ${i + 1}`} />
                  <input type="number" step="0.1" min="0" value={aspecto.peso ?? 0}
                    onChange={(e) => setValue({ ...value, rubricaAspectos: ajustarPesoOpcion(value.rubricaAspectos as any, i, Number(e.target.value), Number(value.peso)) as any })}
                    className={`border rounded-lg px-3 py-2 text-sm ${!rubricaPesosOk ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} placeholder="Peso" />
                  <button type="button" onClick={() => { const a = [...value.rubricaAspectos]; a[i] = { ...a[i], descriptoresAbiertos: !a[i].descriptoresAbiertos }; setValue({ ...value, rubricaAspectos: a }); }}
                    className="rounded-lg border border-gray-300 px-2 py-2 text-xs font-medium text-gray-600 hover:bg-white">Desc.</button>
                  <button type="button" onClick={() => setValue({ ...value, rubricaAspectos: reescalarPesosOpciones(value.rubricaAspectos.filter((_, j) => j !== i) as any, Number(value.peso)) as any })}
                    className={`text-red-400 ${value.rubricaAspectos.length <= 1 ? 'invisible' : ''}`}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-[1.2fr_repeat(4,1fr)] min-w-[500px] bg-gray-50 text-xs font-semibold text-gray-600">
                <div className="px-3 py-2">Aspecto</div>
                {RUBRICA_NIVELES.map(n => <div key={n.key} className="px-3 py-2 text-center">{n.label}</div>)}
              </div>
              {value.rubricaAspectos.filter(a => a.texto.trim()).map((aspecto, ai) => {
                const realIdx = value.rubricaAspectos.indexOf(aspecto);
                return (
                  <div key={aspecto.texto + ai} className="grid grid-cols-[1.2fr_repeat(4,1fr)] min-w-[500px] border-t border-gray-100 text-xs">
                    <div className="px-3 py-2 font-medium text-gray-700">{aspecto.texto}</div>
                    {RUBRICA_NIVELES.map(nivel => (
                      <div key={nivel.key} className={`m-1 rounded-md border p-2 ${nivel.color}`}>
                        <div className="text-center font-semibold">{((Number(aspecto.peso) || 0) * nivel.factor).toFixed(2)}</div>
                        {aspecto.descriptoresAbiertos && (
                          <textarea rows={2} value={aspecto.descriptores?.[nivel.key] || ''}
                            onChange={(e) => { const a = [...value.rubricaAspectos]; a[realIdx] = { ...a[realIdx], descriptores: { ...(a[realIdx].descriptores ?? {}), [nivel.key]: e.target.value } }; setValue({ ...value, rubricaAspectos: a }); }}
                            className="mt-1 w-full resize-none rounded border border-white/70 bg-white/70 px-2 py-1 text-[11px] text-gray-700" placeholder="Opcional" />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className={`text-xs mt-2 ${rubricaPesosOk ? 'text-gray-500' : 'text-red-500'}`}>
              Asignado {sumaAspectos.toFixed(2)} de {value.peso || 0}
            </p>
          </div>
        )}
        {['radio', 'checklist'].includes(value.tipo) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Opciones</label>
              <Button type="button" size="sm" variant="secondary" onClick={() => setValue({ ...value, opciones: reescalarPesosOpciones([...value.opciones, { texto: '', peso: 0 }] as any, Number(value.peso)) as any })}>
                <Plus size={13} /> Opción
              </Button>
            </div>
            {value.opciones.map((opcion, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem_auto] gap-2 mb-2">
                <input value={opcion.texto}
                  onChange={(e) => { const ops = [...value.opciones]; ops[i] = { ...ops[i], texto: e.target.value }; setValue({ ...value, opciones: ops }); }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={`Opción ${i + 1}`} />
                <input type="number" step="0.1" min="0" value={opcion.peso ?? 0}
                  onChange={(e) => setValue({ ...value, opciones: ajustarPesoOpcion(value.opciones as any, i, Number(e.target.value), Number(value.peso)) as any })}
                  className={`border rounded-lg px-3 py-2 text-sm ${!opcionesPesosOk ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} placeholder="Peso" />
                {value.opciones.length > 2 && (
                  <button type="button" onClick={() => setValue({ ...value, opciones: reescalarPesosOpciones(value.opciones.filter((_, j) => j !== i) as any, Number(value.peso)) as any })} className="text-red-400"><Trash2 size={15} /></button>
                )}
              </div>
            ))}
            <p className={`text-xs mt-1 ${opcionesPesosOk ? 'text-gray-500' : 'text-red-500'}`}>
              Asignado {sumaOpciones.toFixed(2)} de {value.peso || 0}
            </p>
          </div>
        )}
        {value.tipo === 'checklist' && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Máx. selecciones:</label>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={value.ilimitado} onChange={(e) => setValue({ ...value, ilimitado: e.target.checked })} />
              Ilimitado
            </label>
            {!value.ilimitado && (
              <input type="number" min="1" value={value.max_selecciones} onChange={(e) => setValue({ ...value, max_selecciones: e.target.value === '' ? '' : String(Math.max(Number(e.target.value) || 1, 1)) })} className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm" />
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={loading} onClick={onSave} disabled={guardarDeshabilitado}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}

function JudgeModal({
  open,
  onClose,
  correo,
  setCorreo,
  encuestas,
  selected,
  setSelected,
  loading,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  correo: string;
  setCorreo: (correo: string) => void;
  encuestas: Survey[];
  selected: number[];
  setSelected: (ids: number[]) => void;
  loading: boolean;
  onSave: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Añadir juez">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo del juez</label>
          <input type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="juez@ejemplo.com" />
        </div>
        {encuestas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a encuestas</label>
            <p className="text-xs text-gray-500 mb-2">Puedes dejarlo sin marcar para añadirlo solo como juez de la competición.</p>
            {[...encuestas].sort((a, b) => {
                const orderDiff = (ESTADO_ORDER[a.estado] ?? 99) - (ESTADO_ORDER[b.estado] ?? 99);
                if (orderDiff !== 0) return orderDiff;
                const key = (e: Survey) => {
                  if (e.estado === 'cerrada') return e.hora_cierre ? -new Date(e.hora_cierre).getTime() : 0;
                  if (e.estado === 'abierta') return e.hora_cierre ? new Date(e.hora_cierre).getTime() : Infinity;
                  return e.hora_apertura ? new Date(e.hora_apertura).getTime() : Infinity;
                };
                return key(a) - key(b);
              }).map((encuesta) => (
              <label key={encuesta.id} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(encuesta.id)}
                  onChange={(event) => setSelected(event.target.checked ? [...selected, encuesta.id] : selected.filter((id) => id !== encuesta.id))}
                />
                {encuesta.nombre}
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={loading} onClick={onSave}>Añadir</Button>
        </div>
      </div>
    </Modal>
  );
}
