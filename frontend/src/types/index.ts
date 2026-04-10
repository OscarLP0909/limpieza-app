export interface User {
  id?: number;
  email: string;
  role: 'admin' | 'gestor' | 'empleado' | 'cliente';
  role_id?: number;
  type: 'client' | 'employee';
  client_id?: number;
}

export interface Work {
  id: number;
  id_cliente?: number;
  nombre?: string;          // getWorks / getWorksByClientId / getWorkById
  Nombre_Cliente?: string;  // getAssignedWorks (empleado)
  id_tipo_servicio?: number;
  tipo_servicio?: string;
  id_frecuencia?: number;
  frecuencia?: string;
  direccion_trabajo?: string;
  Direccion?: string;       // getAssignedWorks (empleado)
  estado: 'creado' | 'pendiente' | 'presupuestado' | 'aceptado' | 'rechazado' | 'cancelado';
  precio?: number | null;
  duracion?: number | null;
  fecha_hora?: string;
  Fecha?: string;           // getAssignedWorks (empleado)
  presupuesto_expira_en?: string | null;
}

export interface Employee {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  iban: string;
  nif: string;
  direccion: string;
  status: string;
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

export interface StatCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}
