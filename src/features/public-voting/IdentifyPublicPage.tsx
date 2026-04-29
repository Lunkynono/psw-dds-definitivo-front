import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';

type IdentifyForm = {
  correo: string;
};

type RoomResponse = {
  id: number;
  nombre: string;
  estado: string;
  competicion?: { nombre: string };
};

export function IdentifyPublicPage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [encuesta, setEncuesta] = useState<RoomResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<IdentifyForm>();

  useEffect(() => {
    async function cargar() {
      try {
        if (!codigo) throw new Error('Sala no disponible');
        const data = await votifyApi.getPublicRoom(codigo) as RoomResponse;
        if (!data || data.estado !== 'abierta') {
          toast.error('Sala no disponible');
          navigate('/sala');
          return;
        }
        setEncuesta(data);
      } catch {
        toast.error('Sala no disponible');
        navigate('/sala');
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [codigo, navigate]);

  async function onSubmit(data: IdentifyForm) {
    if (!codigo || !encuesta) return;
    setEnviando(true);
    try {
      await votifyApi.identifyPublicVoter(codigo, { correo: data.correo.trim() });
      localStorage.setItem('votify_sala', JSON.stringify({
        correo: data.correo.trim(),
        codigo,
        encuesta_id: encuesta.id
      }));
      navigate(`/sala/${codigo}/votar`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo verificar tu registro. Inténtalo de nuevo.');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="mb-5">
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{encuesta?.competicion?.nombre}</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{encuesta?.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1">Introduce tu correo para votar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
            <input
              type="email"
              {...register('correo', {
                required: 'El correo es obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="correo@ejemplo.com"
            />
            {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
          </div>

          <div className="flex gap-3">
            <Link
              to="/sala"
              className="w-full text-center border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Volver
            </Link>
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {enviando ? 'Verificando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
