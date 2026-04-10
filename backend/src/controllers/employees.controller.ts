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
    user_id: number
}

export const getMyEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = (req as any).user!.id;
        const [rows] = await db.query<EmployeeRow[]>(
            'SELECT e.id, e.nombre, e.apellidos, e.telefono, e.iban, e.nif, e.direccion, u.email FROM Employees e JOIN Users u ON e.user_id = u.id WHERE e.user_id = ?',
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
        if (!nombre && !apellidos && !telefono && !direccion && !email && !password) {
            return res.status(400).json({ message: 'At least one field is required' });
        }
        if (password && password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const [rows] = await db.query<EmployeeRow[]>('SELECT id FROM Employees WHERE user_id = ?', [user_id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Employee not found' });

        if (email) {
            const [existEmail] = await db.query<EmployeeRow[]>('SELECT id FROM Users WHERE email = ? AND id != ?', [email, user_id]);
            if (existEmail.length > 0) return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPwd = password ? await bcrypt.hash(password, 10) : undefined;
        await db.query(
            'UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?',
            [email ?? null, hashedPwd ?? null, user_id]
        );
        await db.query(
            'UPDATE Employees SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), telefono = COALESCE(?, telefono), direccion = COALESCE(?, direccion) WHERE user_id = ?',
            [nombre ?? null, apellidos ?? null, telefono ?? null, direccion ?? null, user_id]
        );
        return res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        next(error);
    }
};

export const getEmployees = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const [rows] = await db.query<EmployeeRow[]>('SELECT e.id, e.nombre, e.apellidos, u.email, e.telefono, e.iban, e.nif, e.direccion, e.status FROM Employees e JOIN Users u ON e.user_id = u.id');
        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nombre, apellidos, telefono, iban, nif, direccion, email, password } = req.body;
        if (!nombre || !apellidos || !telefono || !iban || !nif || !direccion || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const [existNif] = await db.query<EmployeeRow[]>('SELECT nombre, apellidos, nif FROM Employees WHERE nif = ?', [nif]);
        if(existNif.length > 0) {
            return res.status(400).json({ message: 'There is already a employee with that nif' });
        }
        const [existIban] = await db.query<EmployeeRow[]>('SELECT nombre, apellidos, nif FROM Employees WHERE iban = ?', [iban]);
        if(existIban.length > 0) {
            return res.status(400).json({ message: 'There is already a employee with that IBAN' });
        }
        const [existEmail] = await db.query<EmployeeRow[]>('SELECT email FROM Users WHERE email = ?', [email]);
        if(existEmail.length > 0) {
            return res.status(400).json({ message: 'There is already a user with that email' });
        }
        const hashedPwd = await bcrypt.hash(password, 10);

        

        const [newUser] = await db.query('INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)', [email, hashedPwd, 3, 'employee']);
        const user_id = (newUser as any).insertId;
        await db.query('INSERT INTO Employees (nombre, apellidos, telefono, iban, nif, direccion, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [nombre, apellidos, telefono, iban, nif, direccion, 'activo', user_id]);
        return res.status(201).json({ message: 'Employee created' });
    } catch (error) {
        next(error);
    }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, telefono, iban, nif, direccion, status, email, password } = req.body;
        if (!nombre && !apellidos && !telefono && !iban && !nif && !direccion && !status && !email && !password) {
            return res.status(400).json({ message: 'At least one field is required' });
        }
        if (!id) {
            return res.status(400).json({ message: 'Id is required' });
        }

        const hashedPwd = password ? await bcrypt.hash(password, 10) : undefined;

        const [row] = await db.query<EmployeeRow[]>('SELECT nombre, apellidos, telefono, iban, nif, direccion, status, user_id FROM Employees WHERE id = ?', [id]);
        if(row.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const user_id = row[0]?.user_id;
        await db.query('UPDATE Employees SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), telefono = COALESCE(?, telefono), iban = COALESCE(?, iban), nif = COALESCE(?, nif), direccion = COALESCE(?, direccion), status = COALESCE(?, status) WHERE id = ?', [nombre, apellidos, telefono, iban, nif, direccion, status, id]);
        await db.query('UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?', [email, hashedPwd, user_id]);
        return res.status(200).json({ message: 'Employee updated' });
    } catch (error) {
        next(error);
    }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const [employeeRow] = await db.query<EmployeeRow[]>('SELECT nombre, apellidos, telefono, iban, nif, direccion, status, user_id FROM Employees WHERE id = ?', [id]);
        if (employeeRow.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const user_id = employeeRow[0]?.user_id;
        const [userRow] = await db.query<EmployeeRow[]>('SELECT email FROM Users WHERE id = ?', [user_id]);
        if(userRow.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        await db.query('DELETE FROM Employees WHERE id = ?', [id]);
        await db.query('DELETE FROM Users WHERE id = ?', [user_id]);
        return res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        next(error);
    }
};