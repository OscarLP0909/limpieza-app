/** Convierte minutos a formato legible: "1 h 30 min", "2 h", "45 min" */
export function formatDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min} min`;
}
