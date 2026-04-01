import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // Verificar si el token está presente en las cookies
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    // Verificar y decodificar el token
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        // Agregar la información del usuario al objeto de solicitud para su uso en rutas protegidas
        req.user = {
            id: payload.id,
            role_id: payload.role_id,
            role: payload.role,
            type: payload.type,
        };
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    }
};