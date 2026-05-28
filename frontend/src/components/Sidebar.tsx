import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'Trabajos', path: '/works', icon: '📋', roles: ['admin', 'gestor'] },
  { label: 'Clientes', path: '/clients', icon: '👥', roles: ['admin', 'gestor'] },
  { label: 'Empleados', path: '/employees', icon: '👷', roles: ['admin', 'gestor'] },
  { label: 'Servicios', path: '/services', icon: '🧹', roles: ['admin', 'gestor'] },
  { label: 'Frecuencias', path: '/frequencies', icon: '🔁', roles: ['admin'] },
  { label: 'Usuarios', path: '/users', icon: '🔑', roles: ['admin'] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center px-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">🧹 Limpieza</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
