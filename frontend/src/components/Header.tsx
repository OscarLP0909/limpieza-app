import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/works': 'Trabajos',
  '/clients': 'Clientes',
  '/employees': 'Empleados',
  '/services': 'Servicios',
  '/frequencies': 'frecuencias',
  '/users': 'Usuarios',
  '/new-work': 'Solicitar trabajo',
};

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();

  const title =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/works/') ? 'Detalle del trabajo' : 'Limpieza App');

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        ☰
      </button>

      <h1 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900 dark:text-white leading-none">{user?.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs text-red-600 dark:text-red-400 hover:underline ml-1"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
