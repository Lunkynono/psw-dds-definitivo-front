import { Camera, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { Layout } from '../../shared/layout/Layout';

type EventForm = {
  nombre: string;
  lugar?: string;
  descripcion?: string;
};

type CompetitionDraft = {
  nombre: string;
  descripcion: string;
};

export function EventCreatePage() {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [imagen, setImagen] = useState<File | null>(null);
  const [competiciones, setCompeticiones] = useState<CompetitionDraft[]>([{ nombre: '', descripcion: '' }]);
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>();

  function agregarCompeticion() {
    setCompeticiones([...competiciones, { nombre: '', descripcion: '' }]);
  }

  function eliminarCompeticion(idx: number) {
    setCompeticiones(competiciones.filter((_, i) => i !== idx));
  }

  function actualizarCompeticion(idx: number, campo: keyof CompetitionDraft, valor: string) {
    const nuevas = [...competiciones];
    nuevas[idx][campo] = valor;
    setCompeticiones(nuevas);
  }

  async function onSubmit(data: EventForm) {
    if (!userId) return;
    const compValidas = competiciones.filter((competicion) => competicion.nombre.trim());
    setGuardando(true);
    try {
      const evento = await votifyApi.createEvent(userId, {
        nombre: data.nombre,
        lugar: data.lugar || null,
        descripcion: data.descripcion || null,
        competiciones: compValidas.map((competicion) => ({
          nombre: competicion.nombre.trim(),
          descripcion: competicion.descripcion || null
        }))
      });

      if (imagen) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imagen);
          });
          await votifyApi.uploadEventImage(evento.id, {
            base64,
            contentType: imagen.type,
            extension: imagen.name.split('.').pop() ?? 'jpg'
          });
        } catch {
          toast.error('Evento creado pero la imagen no se pudo subir');
        }
      }

      toast.success('Evento creado correctamente');
      navigate(`/admin/eventos/${evento.id}/editar`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el evento');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/admin" className="hover:text-indigo-600">Mis eventos</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Nuevo evento</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear evento</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-700">Información del evento</h2>
            <Input
              label="Nombre del evento *"
              placeholder="Hackathon 2025"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            <Input label="Lugar" placeholder="Ciudad, sede..." {...register('lugar')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Descripción del evento..."
                {...register('descripcion')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del evento</label>
              <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Camera size={15} />
                {imagen ? imagen.name : 'Seleccionar imagen'}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => setImagen(e.target.files?.[0] ?? null)} />
              </label>
              {imagen && (
                <img src={URL.createObjectURL(imagen)} alt="Vista previa" className="mt-3 h-36 w-full rounded-lg object-cover border border-gray-200" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Competiciones</h2>
              <Button type="button" variant="secondary" size="sm" onClick={agregarCompeticion}>
                <Plus size={14} />
                Añadir competición
              </Button>
            </div>
            <div className="space-y-4">
              {competiciones.map((comp, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Competición {idx + 1}</span>
                    {competiciones.length > 1 && (
                      <button type="button" onClick={() => eliminarCompeticion(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre de la competición *"
                    value={comp.nombre}
                    onChange={(event) => actualizarCompeticion(idx, 'nombre', event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={comp.descripcion}
                    onChange={(event) => actualizarCompeticion(idx, 'descripcion', event.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin')}>
              Cancelar
            </Button>
            <Button type="submit" loading={guardando}>
              Crear evento
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
