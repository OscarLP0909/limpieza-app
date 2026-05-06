import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import authRoutes from './routes/auth.routes';
import workRoutes from './routes/work.routes';
import serviceRoutes from './routes/services.routes';
import employeeRoutes from './routes/employees.routes';
import clientRoutes from './routes/clients.routes';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.use('/auth', authRoutes);
app.use('/works', workRoutes);
app.use('/services', serviceRoutes);
app.use('/employees', employeeRoutes);
app.use('/clients', clientRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

export default app;