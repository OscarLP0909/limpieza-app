import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";

interface WorkRow extends RowDataPacket {
    id: number;
    id_tipo_servicio: number,
    id_cliente: number,
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
        const { id_tipo_servicio, id_frecuencia, direccion_trabajo, fecha_hora } = req.body;
        if (!id_tipo_servicio || !id_frecuencia || !direccion_trabajo || !fecha_hora) {
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
        const { id_employees, duracion } = (req as any).body;
        if (!id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!id_employees || id_employees.length === 0) {
            return res.status(400).json({ message: 'At least one employee es required' });
        }
        if (!duracion) {
            return res.status(400).json({ message: 'Duration is required' });
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
        

        const expira = new Date();
        expira.setDate(expira.getDate() + 15);


        const [existing] = await db.query<RowDataPacket[]>(
            'SELECT id_empleado FROM Trabajo_Empleado WHERE id_trabajo = ?',
            [id]
        );

        const existingIds = existing.map((e: any) => e.id_empleado);
        const newEmployees = id_employees.filter((e: number) => !existingIds.includes(e));

        if (newEmployees.length === 0) {
            return res.status(400).json({ message: 'All employees are already assigned' });
        }

        const precio = precio_rows[0]?.precio;
        const totalEmployees = existingIds.length + newEmployees.length;
        const precio_final = precio * totalEmployees;

        await Promise.all(
            newEmployees.map((employee: number) =>
                db.query(
                    'INSERT INTO Trabajo_Empleado (id_trabajo, id_empleado) VALUES (?, ?)',
                    [id, employee]
                ))
        );

        const updated = await db.query('UPDATE Trabajos SET precio = ?, duracion = ?, estado = ?, presupuesto_expira_en = ? WHERE id = ?', [precio_final, duracion, 'presupuestado', expira, id]);
        res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
        next(error);
    }
};

export const updateWorkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const id_cliente = (req as any).user!.client_id;
        const validStatuses = ["aceptado", "rechazado", "cancelado"];
        const cancelableStatuses = ["presupuestado", "aceptado"];
        if (!id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!status || typeof (status) !== "string") {
            return res.status(403).json({ message: 'Status is required and must be a String' });
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status must be aceptado or rechazado' })
        }
        const [rows] = await db.query<WorkRow[]>('SELECT estado, id_cliente FROM trabajos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Work not found" });
        }
        if (rows[0].id_cliente !== id_cliente) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!cancelableStatuses.includes(rows[0].estado)) {
            return res.status(400).json({ message: 'Work cannot be updated in its current status' });
        }
        if (rows[0].estado === 'aceptado' && status !== 'cancelado') {
            return res.status(400).json({ message: 'Work in aceptado status can only be cancelled' })
        }
        const updateStatus = await db.query('UPDATE trabajos SET estado = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: "Task updated successfully" });
    } catch (error) {
        next(error);
    }
};

export const getAssignedWorks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;
        const [rows] = await db.query<WorkRow[]>('SELECT t.id, c.nombre as Nombre_Cliente, t.direccion_trabajo as Direccion, s.tipo_servicio, t.fecha_hora as Fecha FROM Trabajos t JOIN Trabajo_Empleado te ON te.id_trabajo = t.id JOIN Clients c ON c.id = t.id_cliente JOIN Tipo_Servicio s ON s.id = t.id_tipo_servicio JOIN Employees e ON e.id = te.id_empleado WHERE e.user_id = ?', [user_id]);
        if (rows.length === 0) {
            return res.status(200).json(rows);
        }
        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};