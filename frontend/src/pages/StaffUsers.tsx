import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

interface StaffUser {
  id: number;
  email: string;
  role: string;
}

interface StaffForm {
  email: string;
  password: string;
  role: 'admin' | 'gestor';
}

const EMPTY_FORM: StaffForm = { email: '', password: '', role: 'gestor' };

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Nuevo usuario</h3>
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

export default function StaffUsers() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsers = () => {
    api
      .get<StaffUser[]>('/users')
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.email || !form.password) {
      setError('Email y contraseña son obligatorios');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al crear el usuario';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!await confirm('¿Seguro que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al eliminar';
      addToast(msg, 'error');
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

  const admins = users.filter((u) => u.role === 'admin');
  const gestores = users.filter((u) => u.role === 'gestor');

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Usuarios del sistema</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} usuario{users.length !== 1 ? 's' : ''} (admins y gestores)</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          ➕ Nuevo usuario
        </button>
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Administradores</p>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {admins.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-300">
                    {u.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{u.email}</span>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  {deletingId === u.id ? '...' : 'Eliminar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gestores */}
      {gestores.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Gestores</p>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {gestores.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300">
                    {u.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{u.email}</span>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  {deletingId === u.id ? '...' : 'Eliminar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {users.length === 0 && (
        <div className="card py-16 text-center text-gray-500 dark:text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm">No hay usuarios del sistema</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                name="email"
                type="email"
                className="input"
                maxLength={100}
                placeholder="usuario@empresa.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                name="password"
                type="password"
                className="input"
                maxLength={100}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Rol</label>
              <select name="role" value={form.role} onChange={handleChange} className="input">
                <option value="gestor">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                El gestor puede ver y presupuestar trabajos. El admin tiene acceso completo.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
