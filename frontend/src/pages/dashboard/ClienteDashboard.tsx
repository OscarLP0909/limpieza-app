import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

function SenaModal({
  work,
  onConfirm,
  onCancel,
}: {
  work: Work;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const total = Number(work.precio ?? 0);
  const sena = total / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl">
            💶
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Confirmar aceptación
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Para aceptar este trabajo deberás abonar una <strong>seña del 50%</strong> del precio total antes del inicio del servicio.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Precio total</span>
            <span className="font-medium text-gray-900 dark:text-white">{total.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm border-t border-blue-200 dark:border-blue-800 pt-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">Seña a pagar ahora (50%)</span>
            <span className="font-bold text-blue-700 dark:text-blue-300 text-base">{sena.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Resto al finalizar</span>
            <span>{sena.toFixed(2)} €</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Al confirmar, aceptas las condiciones del servicio. El equipo se pondrá en contacto contigo para gestionar el pago de la seña.
        </p>

        <div className="flex gap-3 pt-1">
          <button onClick={onConfirm} className="btn-primary flex-1">
            Confirmar y aceptar
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkCard({ work, onStatusChange }: { work: Work; onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [showSenaModal, setShowSenaModal] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/works/${work.id}/status`, { status });
      onStatusChange();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al actualizar el estado';
      alert(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestCancel = async () => {
    setUpdating(true);
    try {
      await api.post(`/works/${work.id}/request-cancel`);
      setCancelRequested(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al enviar la solicitud';
      alert(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleAceptar = () => setShowSenaModal(true);

  const handleConfirmSena = () => {
    setShowSenaModal(false);
    handleStatus('aceptado');
  };

  return (
    <>
      {showSenaModal && (
        <SenaModal
          work={work}
          onConfirm={handleConfirmSena}
          onCancel={() => setShowSenaModal(false)}
        />
      )}
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {work.tipo_servicio ?? `Servicio #${work.id_tipo_servicio}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {work.frecuencia ?? `Frecuencia #${work.id_frecuencia}`}
          </p>
        </div>
        <StatusBadge estado={work.estado} />
      </div>

      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span className="truncate">{work.direccion_trabajo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>
            {work.fecha_hora
              ? new Date(work.fecha_hora).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </span>
        </div>
        {work.precio != null && (
          <div className="flex items-center gap-2">
            <span>💶</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Number(work.precio).toFixed(2)} €
            </span>
          </div>
        )}
        {work.presupuesto_expira_en && work.estado === 'presupuestado' && (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <span>⏰</span>
            <span className="text-xs">
              Presupuesto expira:{' '}
              {new Date(work.presupuesto_expira_en).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {work.estado === 'presupuestado' && (
        <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
          <button
            disabled={updating}
            onClick={handleAceptar}
            className="flex-1 btn-primary text-sm py-1.5"
          >
            Aceptar
          </button>
          <button
            disabled={updating}
            onClick={() => handleStatus('rechazado')}
            className="flex-1 btn-danger text-sm py-1.5"
          >
            Rechazar
          </button>
        </div>
      )}
      {(work.estado === 'aceptado' || work.estado === 'cancelacion_solicitada') && (
        <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
          {work.estado === 'cancelacion_solicitada' || cancelRequested ? (
            <p className="text-xs text-center text-orange-600 dark:text-orange-400 py-1.5">
              Solicitud enviada al responsable. Te avisaremos cuando se cancele.
            </p>
          ) : (
            <button
              disabled={updating}
              onClick={handleRequestCancel}
              className="w-full btn-secondary text-sm py-1.5 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Solicitar cancelación
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}

export default function ClienteDashboard() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorks = () => {
    setLoading(true);
    api
      .get<{ data: Work[]; pagination: unknown }>('/works/my', { params: { limit: 500 } })
      .then((res) => setWorks(res.data.data))
      .catch(() => setWorks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="text-center">
          <p className="text-6xl mb-4">🧹</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Pide tu primer trabajo!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
            Todavía no tienes ningún trabajo solicitado. Haz clic en el botón para empezar.
          </p>
        </div>
        <Link to="/new-work" className="btn-primary flex items-center gap-2 px-6 py-3">
          <span>➕</span>
          Solicitar trabajo
        </Link>
      </div>
    );
  }

  const active = works.filter((w) => !['rechazado', 'cancelado'].includes(w.estado));
  const past = works.filter((w) => ['rechazado', 'cancelado'].includes(w.estado));


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mis trabajos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {works.length} trabajo{works.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link to="/new-work" className="btn-primary flex items-center gap-2">
          <span>➕</span>
          Pedir trabajo
        </Link>
      </div>

      {/* Active works */}
      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Activos ({active.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((work) => (
              <WorkCard key={work.id} work={work} onStatusChange={fetchWorks} />
            ))}
          </div>
        </div>
      )}

      {/* Past works */}
      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Historial ({past.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {past.map((work) => (
              <WorkCard key={work.id} work={work} onStatusChange={fetchWorks} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
