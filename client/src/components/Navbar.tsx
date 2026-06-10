import { Link, useNavigate } from 'react-router-dom';
import { Usuario } from '../types';

interface NavbarProps {
  usuario: Usuario;
  onLogout: () => void;
}

export function Navbar({ usuario, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/login');
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              CF
            </div>
            <span className="text-lg font-semibold text-gray-900">CondoFlow</span>
          </Link>

          {usuario.perfil === 'ADMIN' && (
            <Link
              to="/sindicos"
              className="text-sm text-gray-600 transition hover:text-gray-900"
            >
              Síndicos
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{usuario.nome}</p>
            <p className="text-xs text-gray-500">
              {usuario.perfil === 'ADMIN' ? 'Administradora' : 'Síndico'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}