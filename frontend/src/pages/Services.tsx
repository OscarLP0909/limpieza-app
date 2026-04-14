import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { Service } from '../types';
import Pagination from '../components/Pagination';

const LIMIT = 10;

interface PaginatedServices {
  data: Service[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface ServiceForm {
  tipo_servicio: string;
  precio: string;
}

const EMPTY_FORM: ServiceForm = { tipo_servicio: '', precio: '' };

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchServices = (p: number) => {
    setLoading(true);
    api
      .get<PaginatedServices>('/services', { params: { page: p, limit: LIMIT } })
      .then((res) => {
        setServices(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices(page);
  }, [page]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setForm({ tipo_servicio: svc.tipo_servicio, precio: String(svc.precio) });
    setEditingId(svc.id);
    setError('');
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.tipo_servicio.trim()) return setError('El nombre del servicio es obligatorio');
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) < 0) {
      return setError('El precio debe ser un número positivo');
    }
    setSaving(true);
    try {
      const payload = { tipo_servicio: form.tipo_servicio, precio: Number(form.precio) };
      if (editingId !== null) {
        await api.patch(`/services/${editingId}`, payload);
      } else {
        await api.post('/services', payload);
      }
      setShowModal(false);
      fetchServices(page);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al guardar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este servicio?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/services/${id}`);
      fetchServices(page);
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          ➕ Nuevo servicio
        </button>
      </div>

      {/* Grid */}
      {services.length === 0 ? (
        <div className="card py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No hay servicios creados</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {services.map((svc) => (
              <div key={svc.id} className="card p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{svc.tipo_servicio}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {Number(svc.precio).toFixed(2)} €
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">por empleado</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => openEdit(svc)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    disabled={deletingId === svc.id}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === svc.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPage={setPage}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId !== null ? 'Editar servicio' : 'Nuevo servicio'}
          onClose={() => setShowModal(false)}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="label">Nombre del servicio</label>
              <input
                name="tipo_servicio"
                value={form.tipo_servicio}
                onChange={handleChange}
                className="input"
                placeholder="Ej: Limpieza profunda"
                required
              />
            </div>
            <div>
              <label className="label">Precio por empleado (€)</label>
              <input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                className="input"
                placeholder="Ej: 50.00"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {saving ? 'Guardando...' : editingId !== null ? 'Guardar cambios' : 'Crear servicio'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
