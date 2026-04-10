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
    role_id: number,
    user_id: number
}

export const getClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [rows] = await db.query<ClientRow[]>('SELECT c.nombre, c.apellidos, c.direccion, c.telefono, u.email FROM Clients c JOIN Users u on c.user_id = u.id');
        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

export const createClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nombre, apellidos, direccion, telefono, email, password } = req.body;
        if (!nombre || !apellidos || !direccion || !telefono || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const hashedPwd = await bcrypt.hash(password, 10);
        const [existUser] = await db.query<ClientRow[]>('SELECT email FROM Users WHERE email = ?', [email]);
        if (existUser.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const [newUser] = await db.query('INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)', [email, hashedPwd, 4, 'client']);
        const user_id = (newUser as any).insertId;
        await db.query('INSERT INTO Clients (nombre, apellidos, direccion, telefono, role_id, user_id) VALUES (?, ?, ?, ?, ?, ?)', [nombre, apellidos, direccion, telefono, 4, user_id]);
        return res.status(201).json({ message: 'Client and User created successfully' });
    } catch (error) {
        next(error);
    }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client_id = (req as any).user!.client_id;
        const user_id = (req as any).user!.id;
        if (!client_id) return res.status(403).json({ message: 'Forbidden' });
        const [rows] = await db.query<ClientRow[]>(
            'SELECT c.id, c.nombre, c.apellidos, c.direccion, c.telefono, u.email FROM Clients c JOIN Users u ON c.user_id = u.id WHERE c.id = ? AND u.id = ?',
            [client_id, user_id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client_id = (req as any).user!.client_id;
        const user_id = (req as any).user!.id;
        if (!client_id) return res.status(403).json({ message: 'Forbidden' });

        const { nombre, apellidos, direccion, telefono, email, password } = req.body;
        if (!nombre && !apellidos && !direccion && !telefono && !email && !password) {
            return res.status(400).json({ message: 'At least one field is required' });
        }
        if (password && password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Check email not taken by another user
        if (email) {
            const [existEmail] = await db.query<ClientRow[]>('SELECT id FROM Users WHERE email = ? AND id != ?', [email, user_id]);
            if (existEmail.length > 0) return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPwd = password ? await bcrypt.hash(password, 10) : undefined;
        await db.query(
            'UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?',
            [email ?? null, hashedPwd ?? null, user_id]
        );
        await db.query(
            'UPDATE Clients SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), direccion = COALESCE(?, direccion), telefono = COALESCE(?, telefono) WHERE id = ?',
            [nombre ?? null, apellidos ?? null, direccion ?? null, telefono ?? null, client_id]
        );
        return res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: 'ID invalid' });
        }
        const [clientRow] = await db.query<ClientRow[]>('SELECT nombre, apellidos FROM Clients WHERE id = ?', [id]);
        if (clientRow.length === 0) {
            res.status(404).json({ message: 'Client not found' });
        }
        const user_id = clientRow[0]?.user_id;
        const [userRow] = await db.query<ClientRow[]>('SELECT email FROM Users where id = ?', [user_id]);
        if (userRow.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        await db.query('DELETE FROM Users WHERE id = ?', user_id);
        await db.query('DELETE FROM Clients WHERE id = ?', id);
        return res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        next(error);
    }
}