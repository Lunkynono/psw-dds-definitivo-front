import { ClipboardList, LayoutDashboard, LogOut, UserRound, Vote } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';

export function Navbar() {
  const perfil = useAuthStore((state) => state.perfil);
  const rol = useAuthStore((state) => state.rol);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const esAdmin = location.pathname.startsWith('/admin');
  const esJuez = location.pathname.startsWith('/juez');
  const esParticipante = location.pathname.startsWith('/participante');

  function handleLogout() {
    logout();
    navigate('/');
  }

  const inicial = perfil?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm px-4 py-0 flex items-center justify-between h-14">
      <div className="flex items-center gap-5">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Vote size={15} className="text-white" />
          </div>
          <span className="text-gray-900">Votify</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {rol !== 'participante' && !esParticipante && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                esAdmin
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:block">Admin</span>
            </Link>
          )}
          {rol !== 'participante' && !esParticipante && (
            <Link
              to="/juez"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                esJuez
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <ClipboardList size={15} />
              <span className="hidden sm:block">Juez</span>
            </Link>
          )}
          {(rol === 'participante' || esParticipante) && (
            <Link
              to="/participante"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                esParticipante
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <UserRound size={15} />
              <span className="hidden sm:block">Participante</span>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {perfil && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-700">{inicial}</span>
            </div>
            <span className="text-sm text-gray-700 font-medium hidden sm:block">{perfil.nombre}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut size={15} />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </nav>
  );
}
