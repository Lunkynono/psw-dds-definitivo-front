import { ClipboardList, LayoutDashboard, LucideIcon, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/ui/Button';
import { Modal } from '../../shared/components/ui/Modal';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';

const bloques = [
  {
    icon: LayoutDashboard,
    titulo: 'Administrador',
    descripcion: 'Gestiona eventos, competiciones, equipos y encuestas.',
    color: 'indigo',
    to: '/login?tipo=admin'
  },
  {
    icon: ClipboardList,
    titulo: 'Juez',
    descripcion: 'Evalúa los proyectos asignados en las competiciones.',
    color: 'violet',
    to: '/login?tipo=juez'
  },
  {
    icon: Users,
    titulo: 'Participante',
    descripcion: 'Inscribe tu equipo o proyecto en una competición.',
    color: 'sky',
    action: 'participante'
  }
] as AccessBlock[];

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white'
  },
  sky: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: 'bg-sky-100 text-sky-600',
    btn: 'bg-sky-600 hover:bg-sky-700 text-white'
  }
};

type AccessBlock = {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  color: keyof typeof colorMap;
  to?: string;
  action?: 'participante';
};

type PublicOption = { id: number; nombre: string; imagen_url?: string | null };

const estadoInicialFormulario = {
  eventoId: '',
  competicionId: '',
  nombreEquipo: '',
  proyectoNombre: '',
  proyectoDesc: '',
  participantes: [{ nombre: '', correo: '', rol: '' }]
};

export function AccessPage() {
  const navigate = useNavigate();
  const [modalParticipante, setModalParticipante] = useState(false);
  const [modalDashboard, setModalDashboard] = useState(false);
  const [correoDashboard, setCorreoDashboard] = useState('');
  const [eventos, setEventos] = useState<PublicOption[]>([]);
  const [competiciones, setCompeticiones] = useState<PublicOption[]>([]);
  const [cargandoEventos, setCargandoEventos] = useState(false);
  const [cargandoCompeticiones, setCargandoCompeticiones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formParticipante, setFormParticipante] = useState(estadoInicialFormulario);

  async function abrirModalParticipante() {
    setModalParticipante(true);
    if (eventos.length > 0) return;

    setCargandoEventos(true);
    try {
      setEventos(await votifyApi.getPublicEvents());
    } catch {
      toast.error('No se pudieron cargar los eventos');
    } finally {
      setCargandoEventos(false);
    }
  }

  async function cambiarEvento(eventoId: string) {
    setFormParticipante((prev) => ({ ...prev, eventoId, competicionId: '' }));
    setCompeticiones([]);
    if (!eventoId) return;

    setCargandoCompeticiones(true);
    try {
      setCompeticiones(await votifyApi.getPublicCompetitions(Number(eventoId)));
    } catch {
      toast.error('No se pudieron cargar las competiciones');
    } finally {
      setCargandoCompeticiones(false);
    }
  }

  async function guardarParticipante() {
    if (!formParticipante.eventoId) return toast.error('Selecciona un evento');
    if (!formParticipante.competicionId) return toast.error('Selecciona una competición');
    if (!formParticipante.nombreEquipo.trim() || !formParticipante.proyectoNombre.trim()) {
      return toast.error('Nombre del equipo y proyecto son obligatorios');
    }
    const partsConDatos = formParticipante.participantes.filter(
      (p) => p.nombre.trim() || p.correo.trim() || p.rol.trim()
    );
    if (partsConDatos.length === 0) return toast.error('Añade al menos un participante');
    if (partsConDatos.some((p) => !p.nombre.trim() || !p.correo.trim() || !p.rol.trim())) {
      return toast.error('Nombre, correo y rol son obligatorios para cada participante');
    }

    setGuardando(true);
    try {
      await votifyApi.createTeam(Number(formParticipante.competicionId), {
        equipoNombre: formParticipante.nombreEquipo.trim(),
        proyecto: {
          nombre: formParticipante.proyectoNombre.trim(),
          descripcion: formParticipante.proyectoDesc || null
        },
        participantes: formParticipante.participantes
          .filter((participante) => participante.nombre.trim() && participante.correo.trim())
          .map((participante) => ({
            nombre: participante.nombre.trim(),
            correo: participante.correo.trim(),
            rol: participante.rol.trim() || undefined
          }))
      });

      toast.success('Equipo inscrito correctamente');
      setFormParticipante(estadoInicialFormulario);
      setCompeticiones([]);
      setModalParticipante(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la inscripción');
    } finally {
      setGuardando(false);
    }
  }

  function verDashboardParticipante() {
    if (!correoDashboard.trim()) {
      toast.error('Introduce el correo del participante');
      return;
    }
    navigate(`/participante/dashboard?correo=${encodeURIComponent(correoDashboard.trim())}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-5">
          <Plus size={0} className="hidden" />
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Votify</h1>
        <p className="text-gray-500 mt-2">Selecciona tu rol para continuar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
        {bloques.map(({ icon: Icon, titulo, descripcion, color, to, action }) => {
          const c = colorMap[color];
          return (
            <div key={titulo} className={`flex flex-col items-center text-center rounded-2xl border ${c.border} ${c.bg} p-7 shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${c.icon} shadow-sm`}>
                <Icon size={26} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{titulo}</h2>
              <p className="text-sm text-gray-500 mb-6 flex-1">{descripcion}</p>
              {action === 'participante' ? (
                <div className="w-full space-y-2">
                  <button type="button" onClick={() => setModalDashboard(true)} className={`block w-full py-2.5 rounded-xl font-semibold text-sm transition-colors text-center ${c.btn}`}>
                    Ver mi dashboard
                  </button>
                  <button
                    type="button"
                    onClick={abrirModalParticipante}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors text-center bg-white text-sky-700 border border-sky-200 hover:bg-sky-50"
                  >
                    Inscribir equipo
                  </button>
                </div>
              ) : (
                <Link to={to ?? '/login'} className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors text-center ${c.btn}`}>
                  Entrar como {titulo.toLowerCase()}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <Link to="/" className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Volver al inicio
      </Link>

      <Modal open={modalParticipante} onClose={() => setModalParticipante(false)} title="Inscripción de participante" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evento *</label>
            <select
              value={formParticipante.eventoId}
              onChange={(event) => cambiarEvento(event.target.value)}
              disabled={cargandoEventos}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">{cargandoEventos ? 'Cargando eventos...' : 'Selecciona un evento'}</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>{evento.nombre}</option>
              ))}
            </select>
          </div>

          {formParticipante.eventoId && (() => {
            const ev = eventos.find((e) => String(e.id) === String(formParticipante.eventoId));
            return ev?.imagen_url ? (
              <img src={ev.imagen_url} alt={ev.nombre} className="h-36 w-full rounded-lg object-cover border border-gray-200" />
            ) : null;
          })()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competición *</label>
            <select
              value={formParticipante.competicionId}
              onChange={(event) => setFormParticipante((prev) => ({ ...prev, competicionId: event.target.value }))}
              disabled={!formParticipante.eventoId || cargandoCompeticiones}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">
                {!formParticipante.eventoId
                  ? 'Selecciona primero un evento'
                  : cargandoCompeticiones
                    ? 'Cargando competiciones...'
                    : 'Selecciona una competición'}
              </option>
              {competiciones.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del equipo *</label>
            <input
              value={formParticipante.nombreEquipo}
              onChange={(event) => setFormParticipante((prev) => ({ ...prev, nombreEquipo: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Equipo Alpha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del proyecto *</label>
            <input
              value={formParticipante.proyectoNombre}
              onChange={(event) => setFormParticipante((prev) => ({ ...prev, proyectoNombre: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Mi proyecto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del proyecto</label>
            <textarea
              rows={2}
              value={formParticipante.proyectoDesc}
              onChange={(event) => setFormParticipante((prev) => ({ ...prev, proyectoDesc: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Participantes</label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setFormParticipante((prev) => ({
                  ...prev,
                  participantes: [...prev.participantes, { nombre: '', correo: '', rol: '' }]
                }))}
              >
                <Plus size={13} /> Añadir
              </Button>
            </div>

            {formParticipante.participantes.map((participante, index) => (
              <div key={index} className="flex gap-2 mb-2 flex-wrap">
                <input
                  value={participante.nombre}
                  onChange={(event) => {
                    const participantes = [...formParticipante.participantes];
                    participantes[index] = { ...participantes[index], nombre: event.target.value };
                    setFormParticipante((prev) => ({ ...prev, participantes }));
                  }}
                  className="flex-1 min-w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Nombre"
                />
                <input
                  value={participante.correo}
                  onChange={(event) => {
                    const participantes = [...formParticipante.participantes];
                    participantes[index] = { ...participantes[index], correo: event.target.value };
                    setFormParticipante((prev) => ({ ...prev, participantes }));
                  }}
                  className="flex-1 min-w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Correo"
                />
                <input
                  value={participante.rol}
                  onChange={(event) => {
                    const participantes = [...formParticipante.participantes];
                    participantes[index] = { ...participantes[index], rol: event.target.value };
                    setFormParticipante((prev) => ({ ...prev, participantes }));
                  }}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Rol *"
                />
                {formParticipante.participantes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setFormParticipante((prev) => ({
                      ...prev,
                      participantes: prev.participantes.filter((_, j) => j !== index)
                    }))}
                    className="text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalParticipante(false)}>Cancelar</Button>
            <Button loading={guardando} onClick={guardarParticipante}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modalDashboard} onClose={() => setModalDashboard(false)} title="Dashboard de participante" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo del participante</label>
            <input
              type="email"
              value={correoDashboard}
              onChange={(event) => setCorreoDashboard(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="participante@ejemplo.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalDashboard(false)}>Cancelar</Button>
            <Button onClick={verDashboardParticipante}>Ver dashboard</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
