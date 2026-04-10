import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";
import bcrypt from "bcryptjs";

interface UserRow extends RowDataPacket {
    id: number;
    email: string;
    role: string;
    role_id: number;
}

export const getStaffUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const [rows] = await db.query<UserRow[]>(
            'SELECT u.id, u.email, r.rol as role FROM Users u JOIN Roles r ON u.role_id = r.id WHERE u.role_id IN (1, 2) ORDER BY u.role_id, u.email'
        );
        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

export const createStaffUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, contraseña y rol son obligatorios' });
        }
        if (!['admin', 'gestor'].includes(role)) {
            return res.status(400).json({ message: 'El rol debe ser admin o gestor' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const [existEmail] = await db.query<UserRow[]>('SELECT id FROM Users WHERE email = ?', [email]);
        if (existEmail.length > 0) {
            return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
        }

        const role_id = role === 'admin' ? 1 : 2;
        const hashedPwd = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
            [email, hashedPwd, role_id, 'employee']
        );
        return res.status(201).json({ message: 'Usuario creado correctamente' });
    } catch (error) {
        next(error);
    }
};

export const deleteStaffUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const requestingUserId = (req as any).user!.id;

        if (Number(id) === requestingUserId) {
            return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
        }

        const [rows] = await db.query<UserRow[]>(
            'SELECT id, role_id FROM Users WHERE id = ? AND role_id IN (1, 2)', [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        await db.query('DELETE FROM Users WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
