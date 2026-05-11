import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Work, Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import { generateWorkPDF } from '../utils/generateWorkPDF';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

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
    cancelacion_solicitada: 'Cancelación solicitada',
  };
  return <span className={classes[estado] ?? 'badge-cancelado'}>{labels[estado] ?? estado}</span>;
}

interface WorkDetailData extends Work {
  empleados?: { id: number; nombre: string; apellidos: string }[];
  precio_servicio?: number | null;
  client_nombre?: string;
  client_apellidos?: string;
  client_telefono?: string;
  client_email?: string;
}

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { addToast } = useToast();

  const [work, setWork] = useState<WorkDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');

  const canManage = user?.role === 'admin' || user?.role === 'gestor';

  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [duracionHoras, setDuracionHoras] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchWork = () => {
    api
      .get<WorkDetailData>(`/works/${id}`)
      .then((res) => setWork(res.data))
      .catch(() => setError('No se pudo cargar el trabajo'));
  };

  useEffect(() => {
    setLoading(true);
    const reqs: Promise<unknown>[] = [
      api.get<WorkDetailData>(`/works/${id}`).then((res) => setWork(res.data)),
    ];
    if (canManage) {
      reqs.push(
        api
          .get<{ data: Employee[] }>('/employees', { params: { limit: 500 } })
          .then((res) => setEmployees(res.data.data))
      );
    }
    Promise.all(reqs)
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, [id, canManage]); // eslint-disable-line

  const toggleEmployee = (empId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((e) => e !== empId) : [...prev, empId]
    );
  };

  const handleSubmitAssignment = async () => {
    if (selectedEmployees.length === 0) {
      setError('Selecciona al menos un empleado');
      return;
    }
    if (!duracionHoras || isNaN(Number(duracionHoras)) || Number(duracionHoras) <= 0) {
      setError('Introduce una duración válida en horas');
      return;
    }
    setSavingAssignment(true);
    setError('');
    try {
      await api.patch(`/works/${id}`, {
        id_employees: selectedEmployees,
        duracion: Number(duracionHoras),
      });
      addToast('Empleados asignados y presupuesto enviado', 'success');
      setSelectedEmployees([]);
      setDuracionHoras('');
      fetchWork();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al asignar';
      setError(msg);
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!await confirm('¿Seguro que quieres cancelar este trabajo? Se notificará al cliente.')) return;
    setCancelling(true);
    try {
      await api.patch(`/works/${id}/status`, { status: 'cancelado' });
      addToast('Trabajo cancelado', 'info');
      fetchWork();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al cancelar';
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!await confirm('¿Confirmar la cancelación solicitada por el cliente?')) return;
    setCancelling(true);
    try {
      await api.patch(`/works/${id}/status`, { status: 'cancelado' });
      addToast('Cancelación confirmada', 'info');
      fetchWork();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
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

  if (error && !work) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Volver</button>
      </div>
    );
  }

  if (!work) return null;

  const isFinished = ['cancelado', 'rechazado'].includes(work.estado);
  const canAssign = work.estado === 'pendiente' || work.estado === 'creado';
  const assignedIds = new Set((work.empleados ?? []).map((e) => e.id));
  const availableEmployees = employees.filter((e) => !assignedIds.has(e.id) && e.status === 'activo');

  const previewPrice =
    work.precio_servicio != null
      ? work.precio_servicio * ((work.empleados?.length ?? 0) + selectedEmployees.length)
      : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        ← Volver
      </button>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Work info */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {work.tipo_servicio ?? `Servicio #${work.id_tipo_servicio}`}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{work.frecuencia ?? '—'}</p>
          </div>
          <StatusBadge estado={work.estado} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cliente</p>
            <p className="font-medium text-gray-900 dark:text-white">{work.nombre ?? '—'}</p>
          </div>
          {work.client_email && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Correo del cliente</p>
              <p className="font-medium text-gray-900 dark:text-white">{work.client_email}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Dirección</p>
            <p className="font-medium text-gray-900 dark:text-white">{work.direccion_trabajo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Fecha</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {work.fecha_hora
                ? new Date(work.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Precio del servicio</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {work.precio_servicio != null ? `${Number(work.precio_servicio).toFixed(2)} € / empleado` : '—'}
            </p>
          </div>
          {work.precio != null && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Presupuesto total</p>
              <p className="font-medium text-blue-600 dark:text-blue-400">
                {Number(work.precio).toFixed(2)} €
              </p>
            </div>
          )}
          {work.duracion != null && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Duración</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {(work.duracion / 60 % 1 === 0)
                  ? `${work.duracion / 60} h`
                  : `${(work.duracion / 60).toFixed(1)} h`}
              </p>
            </div>
          )}
          {work.presupuesto_expira_en && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Presupuesto expira</p>
              <p className="font-medium text-orange-600 dark:text-orange-400">
                {new Date(work.presupuesto_expira_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
          {work.empleados && work.empleados.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Empleados asignados</p>
              <div className="flex flex-wrap gap-2">
                {work.empleados.map((emp) => (
                  <span
                    key={emp.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    👷 {emp.nombre} {emp.apellidos}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {work.estado === 'aceptado' && (
          <button
            onClick={() => generateWorkPDF(work)}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            📄 Descargar PDF
          </button>
        )}
      </div>

      {/* Admin/Gestor actions */}
      {canManage && !isFinished && (
        <div className="space-y-4">
          {/* Assign employees + budget */}
          {canAssign && availableEmployees.length > 0 && (
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asignar empleados y presupuestar</h3>

              <div>
                <label className="label">Duración (horas)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="input w-40"
                  placeholder="2"
                  value={duracionHoras}
                  onChange={(e) => setDuracionHoras(e.target.value)}
                />
              </div>

              <div>
                <p className="label mb-2">Empleados</p>
                <div className="space-y-2">
                  {availableEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {emp.nombre} {emp.apellidos}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {previewPrice != null && selectedEmployees.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Presupuesto estimado:{' '}
                    <span className="font-semibold">{previewPrice.toFixed(2)} €</span>
                    {' '}({(work.empleados?.length ?? 0) + selectedEmployees.length} empleado{(work.empleados?.length ?? 0) + selectedEmployees.length !== 1 ? 's' : ''})
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmitAssignment}
                disabled={savingAssignment || selectedEmployees.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {savingAssignment && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Enviar presupuesto
              </button>
            </div>
          )}

          {/* Cancel / confirm cancel */}
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Gestión</h3>
            <div className="flex flex-wrap gap-3">
              {work.estado === 'cancelacion_solicitada' && (
                <button
                  onClick={handleConfirmCancellation}
                  disabled={cancelling}
                  className="btn-danger flex items-center gap-2"
                >
                  Confirmar cancelación del cliente
                </button>
              )}
              {work.estado !== 'cancelado' && work.estado !== 'rechazado' && (
                <button
                  onClick={handleAdminCancel}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Cancelar trabajo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
