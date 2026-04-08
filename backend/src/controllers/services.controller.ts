import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";

interface ServiceRow extends RowDataPacket {
    id: number;
    tipo_servicio: string;
    precio: number;
};

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
    try{
    const [rowsServices] = await db.query<ServiceRow[]>('SELECT tipo_servicio, precio FROM Tipo_Servicio');
    if(rowsServices.length === 0) {
        return res.status(200).json(rowsServices);
    }
    return res.status(200).json(rowsServices);
    } catch (error) {
        next(error);
    }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
    } catch (error) {
        next(error);
    }
}