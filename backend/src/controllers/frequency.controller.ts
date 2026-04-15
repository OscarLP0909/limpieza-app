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
        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

export const createFrequencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { frecuencia } = req.body;
        if (!frecuencia || typeof(frecuencia)!=="string") {
            return res.status(400).json({ message: 'Frecuencia es obligatorio y tiene que ser string'});
        }
        const [existFrequency] = await db.query<FrequencyRow[]>('SELECT * from frecuencia WHERE frecuencia = ?', [frecuencia]);
        if (existFrequency.length > 0) {
            return res.status(400).json({ message: 'Esa frecuencia ya existe' });
        }
        const newFrequency = await db.query('INSERT INTO frecuencia (frecuencia) VALUES (?)', [frecuencia]);
        return res.status(201).json({ message: 'Frecuencia creada correctamente' });
    } catch (error) {
        next(error);
    }
};

export const updateFrequencies = async (req: Request, res: Response, next:NextFunction) => {
    try {
        const { id } = req.params;
        const { frecuencia } = req.body;
        if(!frecuencia) {
            return res.status(400).json({ message: 'Frecuencia es obligatorio' });
        }
        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }
        const [row] = await db.query<FrequencyRow[]>('SELECT * FROM frecuencia WHERE id = ?', [id]);
        if(row.length === 0) {
            return res.status(404).json({ message: 'Frecuencia no encontrada' });
        }
        await db.query('UPDATE frecuencia SET frecuencia = ? WHERE id = ?', [frecuencia, id]);
        return res.status(200).json({ message: 'Frecuencia actualizada' });
    } catch (error) {
        next(error);
    }
};

export const deleteFrequency = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }
        const [row] = await db.query<FrequencyRow[]>('SELECT * FROM frecuencia WHERE id = ?', [id]);
        if (row.length === 0) {
            return res.status(404).json({ message: 'Frequency not found' });
        }
        await db.query('DELETE FROM frecuencia WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Frequency deleted successfully' });
    } catch (error: unknown) {
        if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'No se puede eliminar la frecuencia porque tiene trabajos asociados' });
        }
        next(error);
    }
};
