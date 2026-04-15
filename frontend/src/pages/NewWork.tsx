import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Service } from '../types';

interface Frequency {
  id: number;
  frecuencia: string;
}

export default function NewWork() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [form, setForm] = useState({
    id_tipo_servicio: '',
    id_frecuencia: '',
    direccion_trabajo: '',
    fecha_hora: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: Service[]; pagination: unknown }>('/services', { params: { limit: 100 } }),
      api.get<Frequency[]>('/frequencies'),
    ])
      .then(([svcRes, freqRes]) => {
        setServices(svcRes.data.data);
        setFrequencies(freqRes.data);
      })
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.id_tipo_servicio) return setError('Selecciona un tipo de servicio');
    if (!form.id_frecuencia) return setError('Selecciona la frecuencia');
    if (!form.direccion_trabajo.trim()) return setError('Introduce la dirección del trabajo');
    if (!form.fecha_hora) return setError('Selecciona la fecha y hora');

    setSubmitting(true);
    try {
      await api.post('/works', {
        id_tipo_servicio: Number(form.id_tipo_servicio),
        id_frecuencia: Number(form.id_frecuencia),
        direccion_trabajo: form.direccion_trabajo,
        fecha_hora: form.fecha_hora,
      });
      setSuccess('¡Trabajo solicitado correctamente! Recibirás un presupuesto pronto.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al crear el trabajo';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        ← Volver
      </button>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Solicitar un trabajo de limpieza
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo de servicio */}
          <div>
            <label className="label">Tipo de servicio</label>
            {loadingServices ? (
              <div className="input flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                Cargando servicios...
              </div>
            ) : (
              <select
                name="id_tipo_servicio"
                value={form.id_tipo_servicio}
                onChange={handleChange}
                className="input"
              >
                <option value="">Selecciona un servicio...</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.tipo_servicio}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Frecuencia */}
          <div>
            <label className="label">Frecuencia</label>
            <select
              name="id_frecuencia"
              value={form.id_frecuencia}
              onChange={handleChange}
              className="input"
            >
              <option value="">Selecciona la frecuencia...</option>
              {frequencies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.frecuencia}
                </option>
              ))}
            </select>
          </div>

          {/* Dirección */}
          <div>
            <label className="label">Dirección del trabajo</label>
            <input
              name="direccion_trabajo"
              type="text"
              className="input"
              maxLength={200}
              placeholder="Calle Mayor 1, 2ºA, Madrid"
              value={form.direccion_trabajo}
              onChange={handleChange}
              required
            />
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="label">Fecha y hora preferida</label>
            <input
              name="fecha_hora"
              type="datetime-local"
              className="input"
              value={form.fecha_hora}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              📋 Una vez enviada la solicitud, recibirás un presupuesto por email en las próximas horas.
              Tendrás 15 días para aceptarlo o rechazarlo.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando solicitud...
              </>
            ) : (
              '🧹 Solicitar trabajo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
