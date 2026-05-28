import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        password: form.password,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al registrarse';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-2">🧹</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Limpieza App</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea tu cuenta de cliente</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Juan"
                  value={form.nombre}
                  onChange={set('nombre')}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Apellidos</label>
                <input
                  type="text"
                  className="input"
                  placeholder="García López"
                  value={form.apellidos}
                  onChange={set('apellidos')}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input"
                placeholder="usuario@ejemplo.com"
                value={form.email}
                onChange={set('email')}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                className="input"
                placeholder="600 123 456"
                value={form.telefono}
                onChange={set('telefono')}
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="label">Dirección</label>
              <input
                type="text"
                className="input"
                placeholder="Calle Mayor 1, Madrid"
                value={form.direccion}
                onChange={set('direccion')}
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="label">Repetir contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                maxLength={100}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
