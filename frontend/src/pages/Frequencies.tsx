import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

interface Frequency {
  id: number;
  frecuencia: string;
}

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

export default function Frequencies() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchFrequencies = () => {
    api
      .get<Frequency[]>('/frequencies')
      .then((res) => setFrequencies(res.data))
      .catch(() => setFrequencies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFrequencies();
  }, []);

  const openCreate = () => {
    setValue('');
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (freq: Frequency) => {
    setValue(freq.frecuencia);
    setEditingId(freq.id);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!value.trim()) return setError('La frecuencia es obligatoria');
    setSaving(true);
    try {
      if (editingId !== null) {
        await api.patch(`/frequencies/${editingId}`, { frecuencia: value.trim() });
      } else {
        await api.post('/frequencies', { frecuencia: value.trim() });
      }
      setShowModal(false);
      fetchFrequencies();
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
    if (!await confirm('¿Seguro que quieres eliminar esta frecuencia?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/frequencies/${id}`);
      fetchFrequencies();
    } catch {
      addToast('Error al eliminar la frecuencia', 'error');
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
          ➕ Nueva frecuencia
        </button>
      </div>

      {/* Grid */}
      {frequencies.length === 0 ? (
        <div className="card py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="text-3xl mb-2">🔁</p>
          <p className="text-sm">No hay frecuencias creadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {frequencies.map((freq) => (
            <div key={freq.id} className="card p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔁</span>
                <p className="font-semibold text-gray-900 dark:text-white">{freq.frecuencia}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(freq)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(freq.id)}
                  disabled={deletingId === freq.id}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  {deletingId === freq.id ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId !== null ? 'Editar frecuencia' : 'Nueva frecuencia'}
          onClose={() => setShowModal(false)}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="label">Nombre de la frecuencia</label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="input"
                maxLength={50}
                placeholder="Ej: Semanal, Quincenal, Mensual..."
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                {saving ? 'Guardando...' : editingId !== null ? 'Guardar cambios' : 'Crear frecuencia'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
