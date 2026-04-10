import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import type { Work, Employee, Client } from '../../types';

function StatusBadge({ estado }: { estado: Work['estado'] }) {
  const classes: Record<string, string> = {
    creado: 'badge-pendiente',
    pendiente: 'badge-pendiente',
    presupuestado: 'badge-presupuestado',
    aceptado: 'badge-aceptado',
    rechazado: 'badge-rechazado',
    cancelado: 'badge-cancelado',
    cancelacion_solicitada: 'badge-cancelacion',
  };
  const labels: Record<string, string> = {
    creado: 'Pendiente',
    pendiente: 'Pendiente',
    presupuestado: 'Presupuestado',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
    cancelado: 'Cancelado',
    cancelacion_solicitada: 'Cancelación solicitada',
  };
  const normalizado = (estado as string | null) === null ? 'pendiente' : estado;
  return <span className={classes[normalizado] ?? 'badge-cancelado'}>{labels[normalizado] ?? normalizado}</span>;
}

interface Stat {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: string;
}

export default function AdminGestorDashboard() {
  const [works, setWorks] = useState<Work[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Work[]>('/works'),
      api.get<Employee[]>('/employees'),
      api.get<Client[]>('/clients'),
    ])
      .then(([worksRes, empRes, cliRes]) => {
        setWorks(worksRes.data);
        setEmployees(empRes.data);
        setClients(cliRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats: Stat[] = [
    {
      label: 'Total trabajos',
      value: works.length,
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      icon: '🧹',
    },
    {
      label: 'Pendientes',
      value: works.filter((w) => w.estado === 'pendiente' || w.estado === 'creado').length,
      color: 'text-yellow-700 dark:text-yellow-300',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      icon: '⏳',
    },
    {
      label: 'Aceptados',
      value: works.filter((w) => w.estado === 'aceptado').length,
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/30',
      icon: '✅',
    },
    {
      label: 'Empleados',
      value: employees.length,
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      icon: '👷',
    },
    {
      label: 'Clientes',
      value: clients.length,
      color: 'text-indigo-700 dark:text-indigo-300',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      icon: '👤',
    },
    {
      label: 'Presupuestados',
      value: works.filter((w) => w.estado === 'presupuestado').length,
      color: 'text-sky-700 dark:text-sky-300',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      icon: '📋',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const recentWorks = [...works].reverse().slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`card p-4 flex flex-col gap-2 ${stat.bg}`}>
            <span className="text-2xl">{stat.icon}</span>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Cancelaciones solicitadas alert */}
      {works.filter((w) => w.estado === 'cancelacion_solicitada').length > 0 && (
        <div className="card p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 dark:text-orange-400 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {works.filter((w) => w.estado === 'cancelacion_solicitada').length} trabajo(s) con cancelación solicitada
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Un cliente ha pedido cancelar su trabajo. Revísalo y confirma la cancelación.
                </p>
              </div>
            </div>
            <Link to="/works" className="text-sm font-medium text-orange-700 dark:text-orange-300 hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>
      )}

      {/* Presupuestados alert */}
      {works.filter((w) => w.estado === 'presupuestado').length > 0 && (
        <div className="card p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 text-lg">📋</span>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {works.filter((w) => w.estado === 'presupuestado').length} trabajo(s) esperando respuesta del cliente
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Presupuestos enviados pendientes de aceptación o rechazo
                </p>
              </div>
            </div>
            <Link to="/works" className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>
      )}

      {/* Trabajos pendientes de asignar */}
      {works.filter((w) => w.estado === 'pendiente' || w.estado === 'creado').length > 0 && (
        <div className="card p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  {works.filter((w) => w.estado === 'pendiente' || w.estado === 'creado').length} trabajo(s) pendientes de presupuestar
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Asigna empleados para generar el presupuesto
                </p>
              </div>
            </div>
            <Link to="/works" className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>
      )}

      {/* Tabla de trabajos pendientes */}
      {works.filter((w) => w.estado === 'pendiente' || w.estado === 'creado' || (w.estado as string) === '').length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Trabajos pendientes de presupuestar</h2>
            <Link to="/works" className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-yellow-50 dark:bg-yellow-900/20 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-6 py-3 text-left font-semibold">Dirección</th>
                  <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {works
                  .filter((w) => w.estado === 'pendiente' || w.estado === 'creado' || (w.estado as string) === '')
                  .map((work) => (
                    <tr key={work.id} className="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {work.nombre ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {work.tipo_servicio ?? `Servicio #${work.id_tipo_servicio}`}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {work.direccion_trabajo ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {work.fecha_hora
                          ? new Date(work.fecha_hora).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/works/${work.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                        >
                          Presupuestar →
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de trabajos recientes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Trabajos recientes</h2>
          <Link to="/works" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Ver todos →
          </Link>
        </div>
        {recentWorks.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No hay trabajos todavía</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold">Precio</th>
                  <th className="px-6 py-3 text-left font-semibold">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentWorks.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {work.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {work.tipo_servicio ?? `Servicio #${work.id_tipo_servicio}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {work.fecha_hora
                        ? new Date(work.fecha_hora).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {work.precio != null ? `${Number(work.precio).toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge estado={work.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/works/${work.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
