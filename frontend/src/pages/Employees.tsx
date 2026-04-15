import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import type { Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const LIMIT = 10;

interface PaginatedEmployees {
  data: Employee[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface EmployeeForm {
  nombre: string;
  apellidos: string;
  telefono: string;
  iban: string;
  nif: string;
  direccion: string;
  email: string;
  password: string;
  status: string;
}

const EMPTY_FORM: EmployeeForm = {
  nombre: '',
  apellidos: '',
  telefono: '',
  iban: '',
  nif: '',
  direccion: '',
  email: '',
  password: '',
  status: 'activo',
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

export default function Employees() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEmployees = (p: number, s: string) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, limit: LIMIT };
    if (s) params.search = s;
    api
      .get<PaginatedEmployees>('/employees', { params })
      .then((res) => {
        setEmployees(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isFirstRender.current) return;
    setPage(1);
    fetchEmployees(1, debouncedSearch);
  }, [debouncedSearch]); // eslint-disable-line

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchEmployees(1, '');
      return;
    }
    fetchEmployees(page, debouncedSearch);
  }, [page]); // eslint-disable-line

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setForm({
      nombre: emp.nombre,
      apellidos: emp.apellidos,
      telefono: emp.telefono,
      iban: emp.iban,
      nif: emp.nif,
      direccion: emp.direccion,
      email: emp.email,
      password: '',
      status: emp.status,
    });
    setEditingId(emp.id);
    setError('');
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete (payload as Partial<EmployeeForm>).password;

      if (editingId !== null) {
        await api.patch(`/employees/${editingId}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      setShowModal(false);
      fetchEmployees(page, debouncedSearch);
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
    if (!await confirm('¿Seguro que quieres eliminar este empleado? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees(page, debouncedSearch);
    } catch {
      addToast('Error al eliminar el empleado', 'error');
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre, email o NIF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            ➕ Nuevo empleado
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} empleado{total !== 1 ? 's' : ''}
          </p>
        </div>
        {employees.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <p className="text-3xl mb-2">👷</p>
            <p className="text-sm">No se encontraron empleados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Teléfono</th>
                  <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">NIF</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  {isAdmin && <th className="px-4 py-3 text-left font-semibold">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                      <div>{emp.nombre} {emp.apellidos}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{emp.email}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{emp.email}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 hidden md:table-cell">{emp.telefono}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs hidden lg:table-cell">{emp.nif}</td>
                    <td className="px-4 py-4">
                      <span className={emp.status === 'activo' ? 'badge-activo' : 'badge-inactivo'}>
                        {emp.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(emp)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            disabled={deletingId === emp.id}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            {deletingId === emp.id ? '...' : 'Eliminar'}
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

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={LIMIT}
          onPage={setPage}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId !== null ? 'Editar empleado' : 'Nuevo empleado'}
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
                <input name="nombre" value={form.nombre} onChange={handleChange} className="input" maxLength={50} required />
              </div>
              <div>
                <label className="label">Apellidos</label>
                <input name="apellidos" value={form.apellidos} onChange={handleChange} className="input" maxLength={100} required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input" maxLength={100} required />
            </div>
            <div>
              <label className="label">{editingId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="input" maxLength={100} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} className="input" maxLength={20} required />
              </div>
              <div>
                <label className="label">NIF</label>
                <input name="nif" value={form.nif} onChange={handleChange} className="input" maxLength={20} required />
              </div>
            </div>
            <div>
              <label className="label">IBAN</label>
              <input name="iban" value={form.iban} onChange={handleChange} className="input" maxLength={34} required />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} className="input" maxLength={200} required />
            </div>
            {editingId !== null && (
              <div>
                <label className="label">Estado</label>
                <select name="status" value={form.status} onChange={handleChange} className="input">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {saving ? 'Guardando...' : editingId !== null ? 'Guardar cambios' : 'Crear empleado'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
