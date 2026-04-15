import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";

interface ServiceRow extends RowDataPacket {
    id: number;
    tipo_servicio: string;
    precio: number;
};

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rowsServices] = await db.query<ServiceRow[]>(
            'SELECT id, tipo_servicio, precio FROM Tipo_Servicio LIMIT ? OFFSET ?',
            [limit, offset]
        );
        const [total] = await db.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM Tipo_Servicio'
        );

        return res.status(200).json({
            data: rowsServices,
            pagination: { page, limit, total: total[0].total, totalPages: Math.ceil(total[0].total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tipo_servicio, precio } = req.body;
        if (!tipo_servicio || !precio) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (typeof (tipo_servicio) !== "string" || precio < 0) {
            return res.status(400).json({ message: 'Fields incorrect, check them' });
        }
        const [existsRows] = await db.query<ServiceRow[]>('SELECT tipo_servicio FROM Tipo_Servicio WHERE tipo_servicio = ?', [tipo_servicio]);
        if (existsRows.length > 0) {
            return res.status(400).json({ message: 'Already exists' });
        }
        await db.query<ServiceRow[]>('INSERT INTO Tipo_Servicio (tipo_servicio, precio) VALUES (?, ?)', [tipo_servicio, precio]);
        return res.status(201).json({ message: 'New Service created' });
    } catch (error) {
        next(error);
    }
};

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { tipo_servicio, precio } = req.body;

        if (!tipo_servicio && !precio) {
            return res.status(400).json({ message: 'At least one field is required' });
        }
        if (typeof (tipo_servicio) !== "string" && tipo_servicio) {
            return res.status(400).json({ message: 'Tipo Servicio must be a string' });
        }
        if (precio && precio < 0) {
            return res.status(400).json({ message: 'Precio must be positive' });
        }
        const [row] = await db.query<ServiceRow[]>('SELECT tipo_servicio, precio FROM Tipo_Servicio WHERE id = ?', [id]);
        if (row.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }
        await db.query('UPDATE Tipo_Servicio SET tipo_servicio = COALESCE(?, tipo_servicio), precio = COALESCE(?, precio) WHERE id = ?', [tipo_servicio, precio, id]);
        return res.status(200).json({ message: 'Service updated' });
    } catch (error) {
        next(error);
    }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const [row] = await db.query<ServiceRow[]>('SELECT tipo_servicio, precio FROM Tipo_Servicio WHERE id = ?', [id]);
        if (row.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }
        await db.query('DELETE FROM Tipo_Servicio WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error: unknown) {
        if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'No se puede eliminar el servicio porque tiene trabajos asociados' });
        }
        next(error);
    }
};