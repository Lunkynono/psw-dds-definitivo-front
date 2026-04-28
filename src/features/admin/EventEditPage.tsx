import { Camera, ChevronRight, Plus, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '../../shared/components/ui/Breadcrumb';
import { useAuthStore } from '../../app/store/auth.store';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { Modal } from '../../shared/components/ui/Modal';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';
import { Competition, EventSummary } from '../../shared/types/domain';

const TABS = ['Información', 'Competiciones'];

type EventForm = {
  nombre: string;
  lugar?: string;
  descripcion?: string;
};

export function EventEditPage() {
  const { eventId } = useParams();
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [evento, setEvento] = useState<EventSummary | null>(null);
  const [competiciones, setCompeticiones] = useState<Competition[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [modalCompeticion, setModalCompeticion] = useState(false);
  const [nuevaComp, setNuevaComp] = useState({ nombre: '', descripcion: '' });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventForm>();

  useEffect(() => {
    async function cargarDatos() {
      if (!eventId || !userId) return;
      try {
        const [ev, comps] = await Promise.all([
          votifyApi.getEvent(Number(eventId)),
          votifyApi.getPublicCompetitions(Number(eventId))
        ]);

        if (ev.organizador_id && ev.organizador_id !== userId) {
          toast.error('Sin acceso');
          navigate('/admin');
          return;
        }

        setEvento(ev);
        setCompeticiones(comps as Competition[]);
        reset({ nombre: ev.nombre, lugar: ev.lugar || '', descripcion: ev.descripcion || '' });
      } catch {
        toast.error('Error al cargar el evento');
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [eventId, userId, navigate, reset]);

  async function guardarInfo(data: EventForm) {
    if (!eventId) return;
    setGuardando(true);
    try {
      await votifyApi.updateEvent(Number(eventId), {
        nombre: data.nombre,
        lugar: data.lugar || null,
        descripcion: data.descripcion || null
      });
      toast.success('Evento actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function agregarCompeticion() {
    if (!eventId) return;
    if (!nuevaComp.nombre.trim()) return toast.error('El nombre es obligatorio');
    try {
      const data = await votifyApi.createCompetition(Number(eventId), {
        nombre: nuevaComp.nombre.trim(),
        descripcion: nuevaComp.descripcion || null
      }) as Competition;
      setCompeticiones([...competiciones, data]);
      setNuevaComp({ nombre: '', descripcion: '' });
      setModalCompeticion(false);
      toast.success('Competición añadida');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al añadir competición');
    }
  }

  async function subirImagen(file: File) {
    if (!eventId) return;
    setSubiendoImagen(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const extension = file.name.split('.').pop() ?? 'jpg';
      const { imagenUrl } = await votifyApi.uploadEventImage(Number(eventId), {
        base64,
        contentType: file.type,
        extension
      });
      setEvento((prev) => prev ? { ...prev, imagen_url: imagenUrl } : prev);
      toast.success('Imagen actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir imagen');
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function guardarCompeticion(comp: Competition) {
    try {
      await votifyApi.updateCompetition(comp.id, {
        nombre: comp.nombre,
        descripcion: comp.descripcion || null
      });
      toast.success('Guardado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
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
        <Breadcrumb items={[{ label: 'Mis eventos', to: '/admin' }, { label: evento?.nombre ?? '' }]} />

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                tab === i ? 'bg-white text-indigo-700 font-semibold shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="space-y-4">
            {evento?.imagen_url && (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img src={evento.imagen_url} alt="Imagen del evento" className="w-full h-48 object-cover" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del evento</label>
              <label className={`flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${subiendoImagen ? 'opacity-50 pointer-events-none' : ''}`}>
                <Camera size={15} />
                {subiendoImagen ? 'Subiendo...' : evento?.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={subiendoImagen}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) subirImagen(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <form onSubmit={handleSubmit(guardarInfo)} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <Input label="Nombre *" error={errors.nombre?.message} {...register('nombre', { required: 'Obligatorio' })} />
              <Input label="Lugar" {...register('lugar')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  {...register('descripcion')}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={guardando}>Guardar cambios</Button>
              </div>
            </form>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setModalCompeticion(true)}>
                <Plus size={16} /> Añadir competición
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {competiciones.map((comp) => (
                <Link
                  key={comp.id}
                  to={`/admin/competiciones/${comp.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:border-gray-200 transition-all duration-200"
                >
                  <div className="h-24 w-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <Trophy size={28} className="text-indigo-200" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug">
                        {comp.nombre}
                      </h2>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
                    </div>
                    {comp.descripcion && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1.5">{comp.descripcion}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {competiciones.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No hay competiciones aún</p>}
          </div>
        )}
      </div>

      <Modal open={modalCompeticion} onClose={() => setModalCompeticion(false)} title="Nueva competición">
        <div className="space-y-4">
          <input
            placeholder="Nombre de la competición *"
            value={nuevaComp.nombre}
            onChange={(event) => setNuevaComp({ ...nuevaComp, nombre: event.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          <input
            placeholder="Descripción (opcional)"
            value={nuevaComp.descripcion}
            onChange={(event) => setNuevaComp({ ...nuevaComp, descripcion: event.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalCompeticion(false)}>Cancelar</Button>
            <Button onClick={agregarCompeticion}>Añadir</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
