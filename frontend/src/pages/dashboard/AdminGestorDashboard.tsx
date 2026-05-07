import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import type { Work } from '../../types';

interface Paginated<T> {
  data: T[];
  pagination: { total: number; totalPages: number; page: number; limit: number };
}

function StatusBadge({ estado }: { estado: Work['estado'] }) {
  const classes: Record<string, string> = {
    creado: 'badge-pendiente', pendiente: 'badge-pendiente',
    presupuestado: 'badge-presupuestado', aceptado: 'badge-aceptado',
    rechazado: 'badge-rechazado', cancelado: 'badge-cancelado',
    cancelacion_solicitada: 'badge-cancelacion',
  };
  const labels: Record<string, string> = {
    creado: 'Pendiente', pendiente: 'Pendiente', presupuestado: 'Presupuestado',
    aceptado: 'Aceptado', rechazado: 'Rechazado', cancelado: 'Cancelado',
    cancelacion_solicitada: 'Cancel. solicitada',
  };
  return <span className={classes[estado] ?? 'badge-cancelado'}>{labels[estado] ?? estado}</span>;
}

export default function AdminGestorDashboard() {
  const [works, setWorks] = useState<Work[]>([]);
  const [totalWorks, setTotalWorks] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Paginated<Work>>('/works', { params: { limit: 500 } }),
      api.get<Paginated<unknown>>('/employees', { params: { limit: 1 } }),
      api.get<Paginated<unknown>>('/clients', { params: { limit: 1 } }),
    ])
      .then(([worksRes, empRes, cliRes]) => {
        setWorks(worksRes.data.data);
        setTotalWorks(worksRes.data.pagination.total);
        setTotalEmployees(empRes.data.pagination.total);
        setTotalClients(cliRes.data.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = works.filter((w) => w.estado === 'pendiente' || w.estado === 'creado');
  const accepted = works.filter((w) => w.estado === 'aceptado');
  const cancelRequested = works.filter((w) => w.estado === 'cancelacion_solicitada');
  const recent = [...works].sort((a, b) => b.id - a.id).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total trabajos', value: totalWorks, color: 'blue' },
          { label: 'Pendientes', value: pending.length, color: 'yellow' },
          { label: 'Aceptados', value: accepted.length, color: 'green' },
          { label: 'Cancel. solicit.', value: cancelRequested.length, color: 'orange' },
          { label: 'Empleados', value: totalEmployees, color: 'purple' },
          { label: 'Clientes', value: totalClients, color: 'indigo' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Cancel requested alert */}
      {cancelRequested.length > 0 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            ⚠️ {cancelRequested.length} trabajo{cancelRequested.length !== 1 ? 's' : ''} con cancelación solicitada
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cancelRequested.map((w) => (
              <Link key={w.id} to={`/works/${w.id}`} className="text-xs text-orange-700 dark:text-orange-400 hover:underline">
                #{w.id} {w.nombre}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent works */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Últimos trabajos</h2>
          <Link to="/works" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver todos</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">No hay trabajos aún</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Servicio</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recent.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">#{work.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{work.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{work.tipo_servicio ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                      {work.fecha_hora ? new Date(work.fecha_hora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge estado={work.estado} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/works/${work.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver</Link>
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
