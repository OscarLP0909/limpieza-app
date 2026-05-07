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

export const getStaffUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [rows] = await db.query<UserRow[]>(
            "SELECT u.id, u.email, r.rol as role FROM Users u JOIN Roles r ON u.role_id = r.id WHERE u.type = 'staff' OR u.role_id IN (1, 2) ORDER BY u.role_id, u.email"
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
            return res.status(400).json({ message: 'Email, password and role are required' });
        }
        if (!['admin', 'gestor'].includes(role)) {
            return res.status(400).json({ message: 'Role must be admin or gestor' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const [existing] = await db.query<UserRow[]>('SELECT id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const [roleRow] = await db.query<UserRow[]>('SELECT id FROM Roles WHERE rol = ?', [role]);
        if (roleRow.length === 0) {
            return res.status(400).json({ message: 'Role not found' });
        }
        const role_id = roleRow[0].id;

        const hashedPwd = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO Users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
            [email, hashedPwd, role_id, 'staff']
        );
        return res.status(201).json({ message: 'User created successfully' });
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

        const [row] = await db.query<UserRow[]>('SELECT id FROM Users WHERE id = ?', [id]);
        if (row.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.query('DELETE FROM Users WHERE id = ?', [id]);
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};
