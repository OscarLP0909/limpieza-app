import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navByRole: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
    { label: 'Trabajos', path: '/works', icon: '🧹' },
    { label: 'Empleados', path: '/employees', icon: '👷' },
    { label: 'Clientes', path: '/clients', icon: '👤' },
    { label: 'Servicios', path: '/services', icon: '📋' },
    { label: 'Usuarios', path: '/staff-users', icon: '🔑' },
  ],
  gestor: [
    { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
    { label: 'Trabajos', path: '/works', icon: '🧹' },
    { label: 'Empleados', path: '/employees', icon: '👷' },
    { label: 'Clientes', path: '/clients', icon: '👤' },
  ],
  empleado: [
    { label: 'Mis Trabajos', path: '/dashboard', icon: '🧹' },
    { label: 'Mi Perfil', path: '/employee-profile', icon: '👤' },
  ],
  cliente: [
    { label: 'Mis Trabajos', path: '/dashboard', icon: '🏠' },
    { label: 'Pedir Trabajo', path: '/new-work', icon: '➕' },
    { label: 'Mi Perfil', path: '/profile', icon: '👤' },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role ?? 'cliente';
  const items = navByRole[role] ?? [];

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-64
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        flex flex-col z-20
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      {/* Logo + close button (mobile) */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
            L
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">LimpiezaPro</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
          Menú
        </p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
      </div>
    </aside>
  );
}
