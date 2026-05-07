export function formatDuracion(horas: number | null | undefined): string {
  if (!horas) return '—';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas === 1) return '1 hora';
  return `${horas} horas`;
}

export function formatDate(date: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-ES', opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
}
