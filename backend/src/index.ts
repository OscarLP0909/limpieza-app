import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import pool from './database/db';
import authRoutes from './routes/auth.routes';
import workRoutes from './routes/work.routes';
import serviceRoutes from './routes/services.routes'
import employeeRoutes from './routes/employees.routes';
import clientRoutes from './routes/clients.routes';
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
app.post('/clients-test', (req, res) => {
    res.status(200).json({ message: 'ok' });
});
app.use('/clients', clientRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
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





