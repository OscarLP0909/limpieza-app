import { jsPDF } from 'jspdf';
import type { Work } from '../types';

export function generateWorkPDF(work: Work) {
  const doc = new jsPDF();
  const margin = 20;
  let y = 20;

  const line = (text: string, indent = 0) => {
    doc.text(text, margin + indent, y);
    y += 8;
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  line('Confirmación de Trabajo Aceptado');
  y += 4;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  line(`Referencia: #${work.id}`);
  y += 4;

  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  line('Datos del trabajo');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  line(`Cliente: ${work.nombre ?? '—'}`, 4);
  line(`Servicio: ${work.tipo_servicio ?? '—'}`, 4);
  line(`Frecuencia: ${work.frecuencia ?? '—'}`, 4);
  line(`Dirección: ${work.direccion_trabajo}`, 4);

  if (work.fecha_hora) {
    const fecha = new Date(work.fecha_hora).toLocaleDateString('es-ES', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    line(`Fecha: ${fecha}`, 4);
  }

  if (work.precio != null) {
    y += 4;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    line('Precio');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    line(`Total: ${Number(work.precio).toFixed(2)} €`, 4);
    line(`Seña (50%): ${(Number(work.precio) / 2).toFixed(2)} €`, 4);
    line(`Resto al finalizar: ${(Number(work.precio) / 2).toFixed(2)} €`, 4);
  }

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    'Este documento confirma la aceptación del servicio. El equipo se pondrá en contacto para gestionar la seña.',
    margin,
    y,
    { maxWidth: 170 }
  );

  doc.save(`trabajo-${work.id}.pdf`);
}
