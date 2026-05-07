import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './routes/auth.routes';
import workRoutes from './routes/work.routes';
import serviceRoutes from './routes/services.routes';
import employeeRoutes from './routes/employees.routes';
import clientRoutes from './routes/clients.routes';
import userRoutes from './routes/users.routes';
import frequencyRoutes from './routes/frequency.routes';

import type { Request, Response, NextFunction } from 'express';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));

app.use('/auth', authRoutes);
app.use('/works', workRoutes);
app.use('/services', serviceRoutes);
app.use('/employees', employeeRoutes);
app.use('/clients', clientRoutes);
app.use('/users', userRoutes);
app.use('/frequencies', frequencyRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
        message: isProd ? 'Internal server error' : err.message,
        ...(!isProd && { stack: err.stack }),
    });
});

export default app;
