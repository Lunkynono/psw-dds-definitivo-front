import { TrendingUp, Vote } from 'lucide-react';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';

type RoomResponse = {
  id: number;
  estado: string;
  nombre: string;
};

export function EnterRoomPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoResultados, setCargandoResultados] = useState(false);

  async function buscarEncuesta(cod: string) {
    return votifyApi.getPublicRoom(cod) as Promise<RoomResponse>;
  }

  async function handleEntrar(event: FormEvent) {
    event.preventDefault();
    if (!codigo.trim()) return;
    setCargando(true);
    try {
      const encuesta = await buscarEncuesta(codigo.toUpperCase());
      if (encuesta.estado !== 'abierta') {
        toast.error('Esta votación no está abierta');
        return;
      }
      navigate(`/sala/${codigo.toUpperCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo buscar la sala');
    } finally {
      setCargando(false);
    }
  }

  async function handleVerResultados() {
    if (!codigo.trim()) return;
    setCargandoResultados(true);
    try {
      await buscarEncuesta(codigo.toUpperCase());
      navigate(`/sala/${codigo.toUpperCase()}/resultados`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo buscar la sala');
    } finally {
      setCargandoResultados(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
            <Vote size={28} className="text-indigo-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Votify</h1>
        <p className="text-sm text-gray-500 mb-6">Introduce el código de sala para votar</p>

        <form onSubmit={handleEntrar} className="space-y-4">
          <input
            value={codigo}
            onChange={(event) => setCodigo(event.target.value.toUpperCase())}
            maxLength={6}
            className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500 uppercase"
            placeholder="XXXXXX"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={cargando || codigo.length < 4}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-base hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {cargando ? 'Buscando...' : 'Votar'}
          </button>
          <button
            type="button"
            onClick={handleVerResultados}
            disabled={cargandoResultados || codigo.length < 4}
            className="w-full flex items-center justify-center gap-2 border-2 border-indigo-200 text-indigo-600 py-3 rounded-xl font-medium text-base hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            <TrendingUp size={18} />
            {cargandoResultados ? 'Buscando...' : 'Ver resultados en vivo'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3">¿Eres admin, juez o participante?</p>
          <Link
            to="/acceso"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Acceder al sistema →
          </Link>
        </div>
      </div>
    </div>
  );
}
