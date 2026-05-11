export interface Work {
  id: number;
  id_tipo_servicio: number;
  id_frecuencia: number;
  direccion_trabajo: string;
  fecha_hora: string | null;
  estado: 'creado' | 'pendiente' | 'presupuestado' | 'aceptado' | 'rechazado' | 'cancelado' | 'cancelacion_solicitada';
  precio: number | null;
  duracion: number | null;
  nombre: string | null;
  tipo_servicio: string | null;
  frecuencia: string | null;
  presupuesto_expira_en: string | null;
  Nombre_Cliente?: string;
  Direccion?: string;
  Fecha?: string;
}

export interface Employee {
  id: number;
  nombre: string;
  apellidos: string;
  telefono: string;
  iban: string;
  nif: string;
  direccion: string;
  status: string;
  email: string;
}

export interface Client {
  id: number;
  nombre: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface Service {
  id: number;
  tipo_servicio: string;
  precio: number;
}
