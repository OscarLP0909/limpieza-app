import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import type { Work } from '../types';
import { generateWorkPDF } from '../utils/generateWorkPDF';

function StatusBadge({ estado }: { estado: Work['estado'] }) {
  const classes: Record<string, string> = {
    creado: 'badge-pendiente',
    pendiente: 'badge-pendiente',
    presupuestado: 'badge-presupuestado',
    aceptado: 'badge-aceptado',
    rechazado: 'badge-rechazado',
    cancelado: 'badge-cancelado',
  };
  const labels: Record<string, string> = {
    creado: 'Pendiente',
    pendiente: 'Pendiente',
    presupuestado: 'Presupuestado',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
    cancelado: 'Cancelado',
  };
  return <span className={classes[estado] ?? 'badge-cancelado'}>{labels[estado] ?? estado}</span>;
}

const FILTERS = ['todos', 'pendiente', 'presupuestado', 'aceptado', 'rechazado', 'cancelado'] as const;
type FilterType = (typeof FILTERS)[number];

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Work[]>('/works')
      .then((res) => setWorks(res.data))
      .catch(() => setWorks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = works.filter((w) => {
    const matchFilter = filter === 'todos' || w.estado === filter;
    const matchSearch =
      !search ||
      (w.nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (w.tipo_servicio ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (w.direccion_trabajo ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters & search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            className="input"
            placeholder="Buscar por cliente, servicio o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {filtered.length} trabajo{filtered.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No se encontraron trabajos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3 text-left font-semibold">ID</th>
                  <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-6 py-3 text-left font-semibold">Dirección</th>
                  <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold">Precio</th>
                  <th className="px-6 py-3 text-left font-semibold">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      #{work.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {work.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {work.tipo_servicio ?? `Servicio #${work.id_tipo_servicio}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {work.direccion_trabajo}
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
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {work.precio != null ? `${Number(work.precio).toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge estado={work.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/works/${work.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Ver detalle
                        </Link>
                        {work.estado === 'aceptado' && (
                          <button
                            onClick={() => generateWorkPDF(work)}
                            title="Descargar PDF"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                          >
                            PDF
                          </button>
                        )}
                      </div>
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
