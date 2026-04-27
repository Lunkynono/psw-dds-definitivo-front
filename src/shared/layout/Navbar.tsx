import { ClipboardList, LayoutDashboard, LogOut, Vote } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';

export function Navbar() {
  const perfil = useAuthStore((state) => state.perfil);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const esAdmin = location.pathname.startsWith('/admin');
  const esJuez = location.pathname.startsWith('/juez');

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
          <Vote size={22} />
          Votify
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              esAdmin ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:block">Admin</span>
          </Link>
          <Link
            to="/juez"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              esJuez ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <ClipboardList size={15} />
            <span className="hidden sm:block">Juez</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {perfil && <span className="text-sm text-gray-600 hidden sm:block">{perfil.nombre}</span>}
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
          <LogOut size={16} />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </nav>
  );
}
