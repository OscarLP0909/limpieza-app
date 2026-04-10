import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Work } from '../../types';

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
  return <span className={classes[estado] ?? 'badge-cancelado'}>{labels[estado] ?? estado}</span>;
}

export default function EmpleadoDashboard() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Work[]>('/works/assigned')
      .then((res) => setWorks(res.data))
      .catch(() => setWorks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = works.filter((w) =>
    ['aceptado', 'presupuestado'].includes(w.estado)
  );
  const others = works.filter(
    (w) => !['aceptado', 'presupuestado'].includes(w.estado)
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/30">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{works.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Total asignados</p>
        </div>
        <div className="card p-4 bg-green-50 dark:bg-green-900/30">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{upcoming.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Próximos</p>
        </div>
        <div className="card p-4 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{others.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Finalizados / Otros</p>
        </div>
      </div>

      {works.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-5xl">📭</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Sin trabajos asignados</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cuando te asignen un trabajo aparecerá aquí.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Próximos trabajos
              </h3>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                        <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                        <th className="px-5 py-3 text-left font-semibold">Servicio</th>
                        <th className="px-5 py-3 text-left font-semibold">Dirección</th>
                        <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                        <th className="px-5 py-3 text-left font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {upcoming.map((work) => (
                        <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                            {work.Nombre_Cliente ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                            {work.tipo_servicio ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {work.Direccion ?? work.direccion_trabajo ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {(work.Fecha ?? work.fecha_hora)
                              ? new Date(work.Fecha ?? work.fecha_hora!).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge estado={work.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Historial
              </h3>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                        <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                        <th className="px-5 py-3 text-left font-semibold">Servicio</th>
                        <th className="px-5 py-3 text-left font-semibold">Dirección</th>
                        <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                        <th className="px-5 py-3 text-left font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {others.map((work) => (
                        <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors opacity-70">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                            {work.Nombre_Cliente ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                            {work.tipo_servicio ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {work.Direccion ?? work.direccion_trabajo ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {(work.Fecha ?? work.fecha_hora)
                              ? new Date(work.Fecha ?? work.fecha_hora!).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge estado={work.estado} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
