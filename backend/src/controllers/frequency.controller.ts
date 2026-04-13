import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import db from "../database/db";

interface FrequencyRow extends RowDataPacket {
    id: number,
    frecuencia: string
}

export const getFrequencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [rows] = await db.query<FrequencyRow[]>("SELECT * FROM frecuencia");
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

export const createFrequencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { frecuencia } = req.body;
        if (!frecuencia || typeof(frecuencia)!=="string") {
            res.status(400).json({ message: 'Frecuencia es obligatorio y tiene que ser string'});
        }
        const [existFrequency] = await db.query<FrequencyRow[]>('SELECT * from frecuencia WHERE frecuencia = ?', [frecuencia]);
        if (existFrequency.length > 0) {
            res.status(400).json({ message: 'Esa frecuencia ya existe' });
        }
        const newFrequency = await db.query('INSERT INTO frecuencia (frecuencia) VALUES (?)', [frecuencia]);
        res.status(201).json({ message: 'Frecuencia creada correctamente' });
    } catch (error) {
        next(error);
    }
}
