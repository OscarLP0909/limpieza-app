import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";

interface WorkRow extends RowDataPacket {
    id: number;
    id_tipo_servicio: number,
    nombre: string;
    tipo_servicio: string;
    frecuencia: string;
    direccion_trabajo: string;
    estado: string;
    precio: number;
    duracion: number;
    fecha_hora: Date;
    presupuesto_expira_en: Date;
};

export const getWorks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [works] = await db.query<WorkRow[]>('SELECT t.id, c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.precio, t.duracion, t.fecha_hora, t.presupuesto_expira_en FROM Trabajos t JOIN clients c ON t.id_cliente = c.id JOIN Tipo_Servicio s ON t.id_tipo_servicio = s.id JOIN Frecuencia f ON t.id_frecuencia = f.id');
        return res.status(200).json(works);
    } catch (error) {
        next(error);
    }
};

export const getWorkById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const [works] = await db.query<WorkRow[]>('SELECT t.id, c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.precio, t.duracion, t.fecha_hora, t.presupuesto_expira_en FROM Trabajos t JOIN clients c ON t.id_cliente = c.id JOIN Tipo_Servicio s ON t.id_tipo_servicio = s.id JOIN Frecuencia f ON t.id_frecuencia = f.id WHERE t.id = ?', [id]);
        if (works.length === 0) {
            return res.status(404).json({ message: 'Work not found' });
        }
        return res.status(200).json(works[0]);
    } catch (error) {
        next(error);
    }
};

export const createWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_cliente = (req as any).user!.client_id;
        if (!id_cliente) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const {  id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora } = req.body;
        if ( !id_tipo_servicio || !id_frecuencia || !direccion_trabajo || !fecha_hora) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const [result] = await db.query('INSERT INTO Trabajos (id_cliente, id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora) VALUES (?, ?, ?, ?, ?)', [id_cliente, id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora]);
        return res.status(201).json({ id: (result as any).insertId, message: 'Work created successfully' });
    } catch (error) {
        next(error);
    }
};

export const getWorksByClientId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id_cliente = (req as any).user!.client_id;
        if (!id_cliente) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const [works] = await db.query<WorkRow[]>('SELECT t.id, c.nombre, s.tipo_servicio, f.frecuencia, t.direccion_trabajo, t.estado, t.precio, t.duracion, t.fecha_hora, t.presupuesto_expira_en FROM Trabajos t JOIN clients c ON t.id_cliente = c.id JOIN Tipo_Servicio s ON t.id_tipo_servicio = s.id JOIN Frecuencia f ON t.id_frecuencia = f.id WHERE t.id_cliente = ?', [id_cliente]);
        return res.status(200).json(works);
    } catch (error) {
        next(error);
    }
};

export const updateWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { id_employees } = (req as any).body;
        if (!id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if(!id_employees || id_employees.length === 0) {
            return res.status(400).json({ message: 'At least one employee es required'});
        }
        const [rows] = await db.query<WorkRow[]>('SELECT id_tipo_servicio FROM trabajos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Work not found' });
        }
        const id_tipo_servicio = rows[0]?.id_tipo_servicio;
        const [precio_rows] = await db.query<WorkRow[]>('SELECT precio FROM Tipo_Servicio WHERE id = ?', id_tipo_servicio);
        if (precio_rows.length === 0) {
            return res.status(400).json({ message: 'Precio not found' });
        }
        const precio = precio_rows[0]?.precio;
        const precio_final = precio  * id_employees.length;

        const expira = new Date();
        expira.setDate(expira.getDate() + 15);

        const updated = await db.query('UPDATE Trabajos SET precio = ?, estado = ?, presupuesto_expira_en = ? WHERE id = ?', [precio_final, 'presupuestado', expira, id]);

        await Promise.all(
            id_employees.map((employee: number) =>
                db.query(
                    'INSERT INTO Trabajo_Empleado (id_trabajo, id_empleado) VALUES (?, ?)',
                    [id, employee]
                ))
        );
        res.status(200).json({ message: "Task updated successfully" });

        
    } catch (error) {
        next(error);
    }
};