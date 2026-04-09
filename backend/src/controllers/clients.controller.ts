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
        const [rows] = await db.query<ClientRow[]>('SELECT c.nombre, c.apellidos, c.direccion, c.telefono, u.email FROM Clients c JOIN Users u on e.user_id = u.id');
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
        const [newUser] = await db.query('INSERT INTO Users (email, password) VALUES (?, ?)', [email, hashedPwd]);
        const user_id = (newUser as any).insertId;
        await db.query('INSERT INTO Clients (nombre, apellidos, direccion, telefono, role_id, user_id) VALUES (?, ?, ?, ?, ?, ?)', [nombre, apellidos, direccion, telefono, 4, user_id]);
        return res.status(201).json({ message: 'Client and User created successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, direccion, telefono, email, password } = req.body;
        if (!nombre && !apellidos && !direccion && !telefono && !email && !password) {
            return res.status(400).json({ message: 'At least one field is required' });
        }
        const hashedPwd = await bcrypt.hash(password, 10);
        const [userRow] = await db.query<ClientRow[]>('SELECT email from Users WHERE email = ?', [email]);
        if (userRow.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user_id = userRow[0]?.user_id;
        await db.query('UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password) WHERE id = ?', [email, hashedPwd, user_id]);
        const [clientRow] = await db.query<ClientRow[]>('SELECT c.nombre, c.apellidos, c.direccion, c.telefono FROM Clients c WHERE id = ?', [id]);
        if (clientRow.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        await db.query('UPDATE Clients SET nombre = COALESCE(?, nombre), apellidos = COALESCE(?, apellidos), direccion = COALESCE(?, direccion), telefono = COALESCE(?, telefono) WHERE id = ?', [nombre, apellidos, direccion, telefono, id]);
        return res.status(200).json({ message: 'Client and User updated successfully' });
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