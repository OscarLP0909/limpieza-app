import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import pool from './database/db';
import authRoutes from './routes/auth.routes';
import workRoutes from './routes/work.routes';
import serviceRoutes from './routes/services.routes';
import employeeRoutes from './routes/employees.routes';
import clientRoutes from './routes/clients.routes';
import userRoutes from './routes/users.routes';
import frequencyRoutes from './routes/frequency.routes';
import './cron/presupuesto.cron';
import cookieParser from 'cookie-parser';



const app = express();

app.use(express.json());


app.use(cookieParser());

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
}))

app.use('/auth', authRoutes);
app.use('/works', workRoutes);
app.use('/services', serviceRoutes);
app.use('/employees', employeeRoutes);
app.use('/clients', clientRoutes);
app.use('/users', userRoutes);
app.use('/frequencies', frequencyRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Global error handler — must be last middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
        message: isProd ? 'Internal server error' : err.message,
        ...(!isProd && { stack: err.stack }),
    });
});

const PORT = process.env.PORT || 3000;

async function bootstrap() {
    await pool.query('SELECT 1');
    console.log('Database connection successful');

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

bootstrap().catch((err) => {
    console.error('Failed to bootstrap the application:', err);
    process.exit(1);
});





