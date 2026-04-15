import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";
import bcrypt from "bcryptjs";

interface EmployeeRow extends RowDataPacket {
    id: number,
    nombre: string,
    apellidos: string,
    telefono: string,
    iban: string,
    nif: string,
    direccion: string,
    status: string,
    user_id: number,
    email: string
}

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = ((req.query.search as string) || '').trim();

        const conditions: string[] = [];
        const baseParams: unknown[] = [];

        if (search) {
            conditions.push('(e.nombre LIKE ? OR e.apellidos LIKE ? OR u.email LIKE ? OR e.nif LIKE ?)');
            baseParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const joins = 'FROM Employees e JOIN Users u ON e.user_id = u.id';

        const [rows] = await db.query<EmployeeRow[]>(
            `SELECT e.id, e.nombre, e.apellidos, u.email, e.telefono, e.iban, e.nif, e.direccion, e.status ${joins} ${where} LIMIT ? OFFSET ?`,
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

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    const conn = await db.getConnection();
    try {
        const { nombre, apellidos, telefono, iban, nif, direccion, email, password } = req.body;
        if (!nombre || !apellidos || !telefono || !iban || !nif || !direccion || !email || !password) {
            conn.release();
            return res.status(400).json({ message: 'All fields are required' });
        }
        const [existNif] = await conn.query<EmployeeRow[]>('SELECT id FROM Employees WHERE nif = ?', [nif]);
        if (existNif.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'There is already an employee with that NIF' });
        }
        const [existIban] = await conn.query<EmployeeRow[]>('SELECT id FROM Employees WHERE iban = ?', [iban]);
        if (existIban.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'There is already an employee with that IBAN' });
        }
        const [existEmail] = await conn.query<EmployeeRow[]>('SELECT id FROM Users WHERE email = ?', [email]);
        if (existEmail.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'There is already a user with that email' });
        }
        const hashedPwd = await bcrypt.hash(password, 10);

        await conn.beginTransaction();
        const [newUser] = await conn.query(
            'INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
            [email, hashedPwd, 3, 'employee']
        );
        const user_id = (newUser as any).insertId;
        await conn.query(
            'INSERT INTO Employees (nombre, apellidos, telefono, iban, nif, direccion, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellidos, telefono, iban, nif, direccion, 'activo', user_id]
        );
        await conn.commit();
        return res.status(201).json({ message: 'Employee created' });
    } catch (error) {
        await conn.rollback();
        next(error);
    } finally {
        conn.release();
    }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, telefono, iban, nif, direccion, status, email, password } = req.body;

        const [row] = await db.query<EmployeeRow[]>('SELECT user_id FROM Employees WHERE id = ?', [id]);
        if (row.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const user_id = row[0].user_id;

        const hashedPwd = password ? await bcrypt.hash(password, 10) : null;
        await db.query(
            'UPDATE Employees SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), telefono = COALESCE(?, telefono), iban = COALESCE(?, iban), nif = COALESCE(?, nif), direccion = COALESCE(?, direccion), status = COALESCE(?, status) WHERE id = ?',
            [nombre || null, apellidos || null, telefono || null, iban || null, nif || null, direccion || null, status || null, id]
        );
        await db.query(
            'UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?',
            [email || null, hashedPwd, user_id]
        );
        return res.status(200).json({ message: 'Employee updated' });
    } catch (error) {
        next(error);
    }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    const conn = await db.getConnection();
    try {
        const { id } = req.params;
        const [employeeRow] = await conn.query<EmployeeRow[]>('SELECT user_id FROM Employees WHERE id = ?', [id]);
        if (employeeRow.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Employee not found' });
        }
        const user_id = employeeRow[0].user_id;

        await conn.beginTransaction();
        await conn.query('DELETE FROM Employees WHERE id = ?', [id]);
        await conn.query('DELETE FROM Users WHERE id = ?', [user_id]);
        await conn.commit();
        return res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error: unknown) {
        await conn.rollback();
        if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'No se puede eliminar el empleado porque tiene trabajos asociados' });
        }
        next(error);
    } finally {
        conn.release();
    }
};

export const getMyEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;
        const [rows] = await db.query<EmployeeRow[]>(
            'SELECT e.id, e.nombre, e.apellidos, e.telefono, e.iban, e.nif, e.direccion, e.status, u.email FROM Employees e JOIN Users u ON e.user_id = u.id WHERE e.user_id = ?',
            [user_id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
        return res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

export const updateMyEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;
        const { nombre, apellidos, telefono, direccion, email, password } = req.body;

        if (password && password.length < 6) {
            return res.status(400).json({ message: 'La contrasena debe tener al menos 6 caracteres' });
        }
        if (email) {
            const [existing] = await db.query<EmployeeRow[]>('SELECT id FROM Users WHERE email = ? AND id != ?', [email, user_id]);
            if (existing.length > 0) return res.status(400).json({ message: 'Email ya en uso' });
        }

        const hashedPwd = password ? await bcrypt.hash(password, 10) : null;
        await db.query(
            'UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?',
            [email || null, hashedPwd, user_id]
        );
        await db.query(
            'UPDATE Employees SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), telefono = COALESCE(?, telefono), direccion = COALESCE(?, direccion) WHERE user_id = ?',
            [nombre || null, apellidos || null, telefono || null, direccion || null, user_id]
        );

        return res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        next(error);
    }
};
