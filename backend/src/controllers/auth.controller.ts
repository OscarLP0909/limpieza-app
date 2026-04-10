import type { NextFunction, Request, Response } from "express";
import db from "../database/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface UserRow {
    id: number;
    email: string;
    password: string;
    role_id: number;
    role: string;
    type: 'client' | 'employee';
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || typeof (email) !== 'string' || !password || typeof (password) !== 'string') {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const [user_email] = await db.query('SELECT u.id, u.email, u.password, u.role_id, r.rol as role, u.type FROM users u JOIN Roles r ON u.role_id = r.id WHERE u.email = ?', [email]) as [UserRow[], any];

        if (!user_email || user_email.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user_pwd = await bcrypt.compare(password, user_email[0]!.password);

        if (!user_pwd) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        let clientId = null;
        if (user_email[0]!.type === 'client') {
            const [client] = await db.query('SELECT id FROM clients WHERE user_id = ?', [user_email[0]!.id]) as [[{ id: number }], any];
            clientId = client[0]?.id ?? null;
        }
        const jwtSecret = process.env.JWT_SECRET as string;
        const token = jwt.sign({ id: user_email[0]!.id, role_id: user_email[0]!.role_id, role: user_email[0]!.role, type: user_email[0]!.type, client_id: clientId }, jwtSecret, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días en ms
        });
        return res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        next(error);
    }
};

export const logout = (req: Request, res: Response, next:NextFunction) => {
    try {
        res.clearCookie('token');
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [rows] = await db.query('SELECT u.email, r.rol as role, u.type FROM users u JOIN Roles r ON u.role_id = r.id WHERE u.id = ?', [(req as any).user!.id]) as [UserRow[], any];
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user: rows[0] });
    } catch (error) {
        next(error);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nombre, apellidos, direccion, telefono, email, password } = req.body;
        if (!nombre || !apellidos || !direccion || !telefono || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const [rowEmail] = await db.query('SELECT id FROM Users WHERE email = ?', [email]) as [UserRow[], any];
        if (rowEmail.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashPwd = await bcrypt.hash(password, 10);

        const [newUser] = await db.query('INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)', [email, hashPwd, 4, 'client']);
        const userId = (newUser as any).insertId;
        if(!userId) {
            return res.status(400).json({ message: 'No userId inserted'});
        }
        const [clientNew] = await db.query('INSERT INTO Clients (nombre, apellidos, direccion, telefono, user_id) VALUES (?, ?, ?, ?, ?)', [nombre, apellidos, direccion, telefono, userId]);
        return res.status(200).json({ message: 'Client registered'});

    } catch (error) {
        next(error);
    }
};