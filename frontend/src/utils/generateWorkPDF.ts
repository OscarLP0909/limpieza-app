import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Work } from '../types';
import { formatDuracion } from './format';

const BLUE: [number, number, number] = [37, 99, 235];
const BLUE_LIGHT: [number, number, number] = [239, 246, 255];
const YELLOW_BG: [number, number, number] = [254, 249, 195];
const YELLOW_TEXT: [number, number, number] = [133, 77, 14];

type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } };

export function generateWorkPDF(work: Work): void {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('LimpiezaPro', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Documento de trabajo aceptado', 14, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Trabajo #${work.id}`, pageW - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW - 14, 27, { align: 'right' }
  );

  // ── Detalles del trabajo ──────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Detalles del trabajo', 14, 52);

  const fechaFormateada = work.fecha_hora
    ? new Date(work.fecha_hora).toLocaleDateString('es-ES', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  autoTable(doc, {
    startY: 56,
    theme: 'grid',
    head: [['Campo', 'Informacion']],
    body: [
      ['Cliente', work.nombre ?? '—'],
      ['Tipo de servicio', work.tipo_servicio ?? '—'],
      ['Frecuencia', work.frecuencia ?? '—'],
      ['Direccion del trabajo', work.direccion_trabajo ?? '—'],
      ['Fecha y hora', fechaFormateada],
      ['Duracion estimada', work.duracion ? formatDuracion(work.duracion) : '—'],
      ['Estado', 'ACEPTADO'],
    ],
    headStyles: {
      fillColor: BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: BLUE_LIGHT },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: [55, 65, 81] },
      1: { cellWidth: 'auto' },
    },
    styles: { fontSize: 10, cellPadding: 4 },
    didParseCell(data) {
      // Resaltar la fila de Estado en verde
      if (data.row.index === 6) {
        data.cell.styles.textColor = [22, 101, 52];
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index === 1) {
          data.cell.styles.fillColor = [220, 252, 231];
        }
      }
    },
  });

  // ── Informacion economica ─────────────────────────────────────────────────
  const afterTable = (doc as DocWithTable).lastAutoTable.finalY + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Informacion economica', 14, afterTable);

  const precioTotal = Number(work.precio ?? 0);
  const sena = precioTotal / 2;

  autoTable(doc, {
    startY: afterTable + 4,
    theme: 'grid',
    body: [
      ['Precio total del trabajo', `${precioTotal.toFixed(2)} EUR`],
      ['Sena a abonar (50%)', `${sena.toFixed(2)} EUR`],
      ['Resto al finalizar el servicio', `${sena.toFixed(2)} EUR`],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120, textColor: [55, 65, 81] },
      1: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
    },
    styles: { fontSize: 11, cellPadding: 5 },
    didParseCell(data) {
      if (data.row.index === 1) {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.textColor = [29, 78, 216];
      }
    },
  });

  // ── Nota aviso ───────────────────────────────────────────────────────────
  const afterEcon = (doc as DocWithTable).lastAutoTable.finalY + 10;

  const noteText =
    'AVISO: La sena debera abonarse antes del inicio del servicio. ' +
    'El importe restante se pagara al finalizar el trabajo.';

  const noteMaxWidth = pageW - 28 - 8; // box width minus horizontal padding
  doc.setFontSize(9);
  const noteLines: string[] = doc.splitTextToSize(noteText, noteMaxWidth);
  const lineHeight = 5;
  const notePadY = 5;
  const boxHeight = noteLines.length * lineHeight + notePadY * 2;

  doc.setFillColor(...YELLOW_BG);
  doc.roundedRect(14, afterEcon, pageW - 28, boxHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...YELLOW_TEXT);
  doc.text(noteLines, 18, afterEcon + notePadY + lineHeight - 1);

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageH - 18, pageW - 14, pageH - 18);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('2026 LimpiezaPro - Documento generado automaticamente', 14, pageH - 10);
  doc.text(`Trabajo #${work.id}`, pageW - 14, pageH - 10, { align: 'right' });

  doc.save(`LimpiezaPro-Trabajo-${work.id}.pdf`);
}
