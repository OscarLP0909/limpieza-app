import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Work, Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import { generateWorkPDF } from '../utils/generateWorkPDF';
import { formatDuracion } from '../utils/format';
import { useConfirm } from '../context/ConfirmContext';

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
  return (
    <span className={`text-sm ${classes[normalizado] ?? 'badge-cancelado'}`}>
      {labels[normalizado] ?? normalizado}
    </span>
  );
}

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [work, setWork] = useState<Work | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [duracion, setDuracion] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const confirm = useConfirm();
  const canAssign = user?.role === 'admin' || user?.role === 'gestor';

  useEffect(() => {
    const requests: Promise<unknown>[] = [api.get<Work>(`/works/${id}`)];
    if (canAssign) {
      requests.push(api.get<{ data: Employee[]; pagination: unknown }>('/employees', { params: { limit: 500 } }));
    }

    Promise.all(requests)
      .then(([workRes, empRes]) => {
        setWork((workRes as { data: Work }).data);
        if (empRes) setEmployees((empRes as { data: { data: Employee[] } }).data.data);
      })
      .catch(() => navigate('/works'))
      .finally(() => setLoading(false));
  }, [id, canAssign, navigate]);

  const toggleEmployee = (empId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((e) => e !== empId) : [...prev, empId]
    );
  };

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      setError('Selecciona al menos un empleado');
      return;
    }
    if (!duracion || isNaN(Number(duracion)) || Number(duracion) <= 0) {
      setError('Introduce una duración válida');
      return;
    }
    setError('');
    setAssigning(true);
    try {
      await api.patch(`/works/${id}`, {
        id_employees: selectedEmployees,
        duracion: Number(duracion),
      });
      setSuccess('Empleados asignados y presupuesto enviado al cliente');
      const res = await api.get<Work>(`/works/${id}`);
      setWork(res.data);
      setSelectedEmployees([]);
      setDuracion('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al asignar empleados';
      setError(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!await confirm('¿Seguro que quieres cancelar este trabajo? Se notificará al cliente.')) return;
    setCancelling(true);
    setError('');
    try {
      await api.patch(`/works/${id}/admin-cancel`);
      const res = await api.get<Work>(`/works/${id}`);
      setWork(res.data);
      setSuccess('Trabajo cancelado y cliente notificado');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al cancelar el trabajo';
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!work) return null;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back + PDF */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/works')}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ← Volver a trabajos
        </button>
        {work?.estado === 'aceptado' && (
          <button
            onClick={() => generateWorkPDF(work)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar PDF
          </button>
        )}
      </div>

      {/* Work info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-1">Trabajo #{work.id}</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {work.tipo_servicio ?? `Servicio #${work.id_tipo_servicio}`}
            </h2>
          </div>
          <StatusBadge estado={work.estado} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {work.nombre ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Frecuencia</p>
            <p className="text-gray-900 dark:text-white">
              {work.frecuencia ?? `#${work.id_frecuencia}`}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Dirección</p>
            <p className="text-gray-900 dark:text-white">{work.direccion_trabajo}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Fecha y hora</p>
            <p className="text-gray-900 dark:text-white">
              {work.fecha_hora
                ? new Date(work.fecha_hora).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </p>
          </div>
          {work.precio != null && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Precio</p>
              <p className="text-gray-900 dark:text-white font-semibold text-base">
                {Number(work.precio).toFixed(2)} €
              </p>
            </div>
          )}
          {work.duracion != null && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Duración</p>
              <p className="text-gray-900 dark:text-white">{formatDuracion(work.duracion)}</p>
            </div>
          )}
          {work.presupuesto_expira_en && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Presupuesto expira</p>
              <p className="text-orange-600 dark:text-orange-400">
                {new Date(work.presupuesto_expira_en).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign employees (admin/gestor, only for creado/pendiente works) */}
      {canAssign && (work.estado === 'pendiente' || work.estado === 'creado' || (work.estado as string | null) === null) && (
        <div className="card p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Asignar empleados y generar presupuesto</h3>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="label">Duración estimada (minutos)</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input max-w-xs"
              placeholder="Ej: 90"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
          </div>

          {/* Employee list */}
          <div>
            <label className="label">Seleccionar empleados</label>
            {employees.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay empleados disponibles</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {employees
                  .filter((e) => e.status === 'activo')
                  .map((emp) => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEmployees.includes(emp.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {emp.nombre} {emp.apellidos}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {selectedEmployees.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedEmployees.length} empleado{selectedEmployees.length !== 1 ? 's' : ''} seleccionado{selectedEmployees.length !== 1 ? 's' : ''}
            </p>
          )}

          <button
            onClick={handleAssign}
            disabled={assigning}
            className="btn-primary flex items-center gap-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Asignando...
              </>
            ) : (
              '📋 Asignar y enviar presupuesto'
            )}
          </button>
        </div>
      )}

      {/* Already presupuestado / aceptado message for admin */}
      {canAssign && work.estado !== 'pendiente' && work.estado !== 'creado' && (work.estado as string | null) !== null && (
        <div className="card p-4 bg-gray-50 dark:bg-gray-700/30 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Este trabajo está en estado <strong>{work.estado}</strong>. No se pueden asignar más empleados.
          </p>
          {(work.estado === 'aceptado' || work.estado === 'cancelacion_solicitada') && (
            <>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              )}
              <button
                onClick={handleAdminCancel}
                disabled={cancelling}
                className="btn-danger text-sm py-1.5 px-4"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar trabajo'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
