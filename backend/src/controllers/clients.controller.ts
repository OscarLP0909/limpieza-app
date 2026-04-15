import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";
import bcrypt from "bcryptjs";

interface ClientRow extends RowDataPacket {
    id: number,
    nombre: string,
    apellidos: string,
    direccion: string,
    telefono: string,
    email: string,
    role_id: number,
    user_id: number
}

export const getClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = ((req.query.search as string) || '').trim();

        const conditions: string[] = [];
        const baseParams: unknown[] = [];

        if (search) {
            conditions.push('(c.nombre LIKE ? OR c.apellidos LIKE ? OR u.email LIKE ? OR c.telefono LIKE ?)');
            baseParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const joins = 'FROM Clients c JOIN Users u ON c.user_id = u.id';

        const [rows] = await db.query<ClientRow[]>(
            `SELECT c.id, c.nombre, c.apellidos, c.direccion, c.telefono, u.email ${joins} ${where} LIMIT ? OFFSET ?`,
            [...baseParams, limit, offset]
        );
        const [total] = await db.query<RowDataPacket[]>(
            `SELECT COUNT(*) as total ${joins} ${where}`,
            baseParams
        );

        return res.status(200).json({
            data: rows,
            pagination: { page, limit, total: total[0].total, totalPages: Math.ceil(total[0].total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

export const createClient = async (req: Request, res: Response, next: NextFunction) => {
    const conn = await db.getConnection();
    try {
        const { nombre, apellidos, direccion, telefono, email, password } = req.body;
        if (!nombre || !apellidos || !direccion || !telefono || !email || !password) {
            conn.release();
            return res.status(400).json({ message: 'All fields are required' });
        }
        const [existUser] = await conn.query<ClientRow[]>('SELECT id FROM Users WHERE email = ?', [email]);
        if (existUser.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPwd = await bcrypt.hash(password, 10);

        await conn.beginTransaction();
        const [newUser] = await conn.query(
            'INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
            [email, hashedPwd, 4, 'client']
        );
        const user_id = (newUser as any).insertId;
        await conn.query(
            'INSERT INTO Clients (nombre, apellidos, direccion, telefono, role_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellidos, direccion, telefono, 4, user_id]
        );
        await conn.commit();
        return res.status(201).json({ message: 'Client and User created successfully' });
    } catch (error) {
        await conn.rollback();
        next(error);
    } finally {
        conn.release();
    }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, direccion, telefono, email, password } = req.body;

        const [clientRow] = await db.query<ClientRow[]>('SELECT user_id FROM Clients WHERE id = ?', [id]);
        if (clientRow.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const user_id = clientRow[0].user_id;

        if (email || password) {
            const hashedPwd = password ? await bcrypt.hash(password, 10) : null;
            await db.query(
                'UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?',
                [email || null, hashedPwd, user_id]
            );
        }
        await db.query(
            'UPDATE Clients SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), direccion = COALESCE(?, direccion), telefono = COALESCE(?, telefono) WHERE id = ?',
            [nombre || null, apellidos || null, direccion || null, telefono || null, id]
        );

        return res.status(200).json({ message: 'Client updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
    const conn = await db.getConnection();
    try {
        const { id } = req.params;
        const [clientRow] = await conn.query<ClientRow[]>('SELECT user_id FROM Clients WHERE id = ?', [id]);
        if (clientRow.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Client not found' });
        }
        const user_id = clientRow[0].user_id;

        await conn.beginTransaction();
        await conn.query('DELETE FROM Clients WHERE id = ?', [id]);
        await conn.query('DELETE FROM Users WHERE id = ?', [user_id]);
        await conn.commit();
        return res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error: unknown) {
        await conn.rollback();
        if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'No se puede eliminar el cliente porque tiene trabajos asociados' });
        }
        next(error);
    } finally {
        conn.release();
    }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;
        const [rows] = await db.query<ClientRow[]>(
            'SELECT c.id, c.nombre, c.apellidos, c.direccion, c.telefono, u.email FROM Clients c JOIN Users u ON c.user_id = u.id WHERE c.user_id = ?',
            [user_id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;
        const { nombre, apellidos, direccion, telefono, email, password } = req.body;

        if (password && password.length < 6) {
            return res.status(400).json({ message: 'La contrasena debe tener al menos 6 caracteres' });
        }
        if (email) {
            const [existing] = await db.query<ClientRow[]>('SELECT id FROM Users WHERE email = ? AND id != ?', [email, user_id]);
            if (existing.length > 0) return res.status(400).json({ message: 'Email ya en uso' });
        }

        const hashedPwd = password ? await bcrypt.hash(password, 10) : null;
        await db.query(
            'UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?',
            [email || null, hashedPwd, user_id]
        );
        await db.query(
            'UPDATE Clients SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), direccion = COALESCE(?, direccion), telefono = COALESCE(?, telefono) WHERE user_id = ?',
            [nombre || null, apellidos || null, direccion || null, telefono || null, user_id]
        );

        return res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        next(error);
    }
};
