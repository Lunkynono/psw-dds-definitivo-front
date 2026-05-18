import { TrendingUp, Users, Wifi } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Spinner from '../../shared/components/ui/Spinner';
import { votifyApi } from '../../shared/facade/VotifyApiFacade';
import { ResultRow, Survey } from '../../shared/types/domain';

const medalColors = ['text-amber-500', 'text-slate-400', 'text-orange-500'];
const barColors = ['bg-amber-400', 'bg-indigo-500', 'bg-sky-500', 'bg-indigo-500'];

export function ParticipantLiveResultsPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [ranking, setRanking] = useState<ResultRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [conectado, setConectado] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function cargarRanking() {
    if (!surveyId) return;
    try {
      const data = await votifyApi.getSurveyLiveResults(Number(surveyId));
      setRanking(data);
      setConectado(true);
    } catch {
      setConectado(false);
    }
  }

  useEffect(() => {
    async function init() {
      if (!surveyId) return;
      setCargando(true);
      try {
        const surveyData = await votifyApi.getSurvey(Number(surveyId));
        setSurvey(surveyData);
        await cargarRanking();
      } finally {
        setCargando(false);
      }
      intervalRef.current = setInterval(cargarRanking, 10000);
    }

    init();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [surveyId]);

  const totalVotos = ranking.reduce((s, r) => s + (r.votos ?? 0), 0);
  const maxPuntaje = Math.max(...ranking.map((r) => r.puntaje_manual ?? r.puntaje_calculado), 1);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center text-gray-700">
        <p>Encuesta no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 text-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">
              {survey.competicion?.nombre}
            </p>
            <h1 className="text-2xl font-bold mt-1">{survey.nombre}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {totalVotos} votos
              </span>
              <span className={`flex items-center gap-1 ${conectado ? 'text-emerald-600' : 'text-gray-500'}`}>
                <Wifi size={14} />
                {conectado ? 'En vivo' : 'Reconectando...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 text-xs font-medium">EN VIVO</span>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aun no hay votos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ranking.map((row, idx) => {
              const puntaje = row.puntaje_manual ?? row.puntaje_calculado;
              const nombre = row.proyecto?.nombre ?? `Proyecto ${row.proyecto_id}`;
              const descripcion = row.proyecto?.descripcion;
              return (
                <div
                  key={`${row.proyecto_id}-${idx}`}
                  className={`rounded-xl p-5 border transition-all ${
                    idx === 0
                      ? 'bg-amber-50 border-amber-200'
                      : idx === 1
                        ? 'bg-slate-50 border-slate-200'
                        : idx === 2
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-white border-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${medalColors[idx] ?? 'text-gray-500'}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{nombre}</p>
                        {descripcion && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{descripcion}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{puntaje.toFixed(2)}</p>
                      {row.votos != null && <p className="text-xs text-gray-500">{row.votos} votos</p>}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${barColors[idx] ?? 'bg-indigo-500'} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${(puntaje / maxPuntaje) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-8">
          Los resultados se actualizan automaticamente
        </p>

        <div className="mt-4 text-center">
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">
            Volver a mi dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
