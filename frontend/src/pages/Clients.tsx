import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { Client } from '../types';
import { useAuth } from '../context/AuthContext';

interface ClientForm {
  nombre: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  email: string;
  password: string;
}

const EMPTY_FORM: ClientForm = {
  nombre: '',
  apellidos: '',
  direccion: '',
  telefono: '',
  email: '',
  password: '',
};

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
      <div className="relative card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
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

export default function Clients() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchClients = () => {
    api
      .get<Client[]>('/clients')
      .then((res) => setClients(res.data))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setForm({
      nombre: client.nombre,
      apellidos: client.apellidos,
      direccion: client.direccion,
      telefono: client.telefono,
      email: client.email,
      password: '',
    });
    setEditingId(client.id);
    setError('');
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete (payload as Partial<ClientForm>).password;

      if (editingId !== null) {
        await api.patch(`/clients/${editingId}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      setShowModal(false);
      fetchClients();
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
    if (!confirm('¿Seguro que quieres eliminar este cliente?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clients.filter(
    (c) =>
      !search ||
      `${c.nombre} ${c.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.includes(search)
  );

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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            ➕ Nuevo cliente
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-sm">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Teléfono</th>
                  <th className="px-6 py-3 text-left font-semibold">Dirección</th>
                  {isAdmin && <th className="px-6 py-3 text-left font-semibold">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {client.nombre} {client.apellidos}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{client.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{client.telefono}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{client.direccion}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(client)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            {deletingId === client.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId !== null ? 'Editar cliente' : 'Nuevo cliente'}
          onClose={() => setShowModal(false)}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label className="label">Apellidos</label>
                <input name="apellidos" value={form.apellidos} onChange={handleChange} className="input" required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">{editingId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="input" placeholder="••••••••" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} className="input" required />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {saving ? 'Guardando...' : editingId !== null ? 'Guardar cambios' : 'Crear cliente'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
