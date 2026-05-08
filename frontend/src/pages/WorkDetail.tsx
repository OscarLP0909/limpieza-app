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
  client_nombre?: string;
  client_apellidos?: string;
  client_telefono?: string;
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

  const [precio, setPrecio] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [savingPresupuesto, setSavingPresupuesto] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assigningEmployee, setAssigningEmployee] = useState(false);
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

  const handlePresupuestar = async () => {
    if (!precio || isNaN(Number(precio)) || Number(precio) <= 0) {
      setError('Introduce un precio válido');
      return;
    }
    setSavingPresupuesto(true);
    setError('');
    try {
      await api.patch(`/works/${id}/budget`, {
        precio: Number(precio),
        expiracion_dias: expiracion ? Number(expiracion) : 15,
      });
      addToast('Presupuesto enviado correctamente', 'success');
      fetchWork();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al presupuestar';
      setError(msg);
    } finally {
      setSavingPresupuesto(false);
    }
  };

  const handleAssignEmployee = async () => {
    if (!selectedEmployee) return;
    setAssigningEmployee(true);
    try {
      await api.patch(`/works/${id}`, { 
        id_employees: [Number(selectedEmployee)],
        duracion: 60
      });
      addToast('Empleado asignado correctamente', 'success');
      setSelectedEmployee('');
      fetchWork();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al asignar';
      setError(msg);
    } finally {
      setAssigningEmployee(false);
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Precio</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {work.precio != null ? `${Number(work.precio).toFixed(2)} €` : '—'}
            </p>
          </div>
          {work.presupuesto_expira_en && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Presupuesto expira</p>
              <p className="font-medium text-orange-600 dark:text-orange-400">
                {new Date(work.presupuesto_expira_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
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

      {/* Employed assigned */}
      {work.empleados && work.empleados.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Empleados asignados</h3>
          <ul className="space-y-2">
            {work.empleados.map((emp) => (
              <li key={emp.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-base">👷</span>
                {emp.nombre} {emp.apellidos}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Admin/Gestor actions */}
      {canManage && !isFinished && (
        <div className="space-y-4">
          {/* Presupuestar */}
          {(work.estado === 'pendiente' || work.estado === 'creado') && (
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enviar presupuesto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="150.00"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Días para expirar (def. 15)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="input"
                    placeholder="15"
                    value={expiracion}
                    onChange={(e) => setExpiracion(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handlePresupuestar}
                disabled={savingPresupuesto}
                className="btn-primary flex items-center gap-2"
              >
                {savingPresupuesto && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Enviar presupuesto
              </button>
            </div>
          )}

          {/* Assign employee */}
          {employees.length > 0 && (
            <div className="card p-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asignar empleado</h3>
              <div className="flex gap-3">
                <select
                  className="input"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Selecciona un empleado...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellidos}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignEmployee}
                  disabled={!selectedEmployee || assigningEmployee}
                  className="btn-primary whitespace-nowrap"
                >
                  {assigningEmployee ? '...' : 'Asignar'}
                </button>
              </div>
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
