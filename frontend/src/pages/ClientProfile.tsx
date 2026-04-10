import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/axios';

interface ProfileData {
  nombre: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  email: string;
}

export default function ClientProfile() {
  const [form, setForm] = useState<ProfileData>({
    nombre: '',
    apellidos: '',
    direccion: '',
    telefono: '',
    email: '',
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get<ProfileData>('/clients/me')
      .then((res) => setForm(res.data))
      .catch(() => setError('No se pudieron cargar los datos del perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...form };
      if (password) payload.password = password;
      await api.patch('/clients/me', payload);
      setSuccess('Perfil actualizado correctamente');
      setPassword('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al actualizar el perfil';
      setError(msg);
    } finally {
      setSaving(false);
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
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mi perfil</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza tus datos personales y de acceso</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input name="nombre" type="text" className="input" value={form.nombre} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Apellidos</label>
            <input name="apellidos" type="text" className="input" value={form.apellidos} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className="label">Correo electrónico</label>
          <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required autoComplete="email" />
        </div>

        <div>
          <label className="label">Teléfono</label>
          <input name="telefono" type="tel" className="input" value={form.telefono} onChange={handleChange} required />
        </div>

        <div>
          <label className="label">Dirección</label>
          <input name="direccion" type="text" className="input" value={form.direccion} onChange={handleChange} required />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="label">Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span></label>
          <input
            name="password"
            type="password"
            className="input"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </form>
    </div>
  );
}
