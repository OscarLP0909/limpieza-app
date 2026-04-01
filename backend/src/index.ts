import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './database/db';

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
}))

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

async function testDatabaseConnection() {
    await pool.query('SELECT 1');
    console.log('Database connection successful');

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

testDatabaseConnection().catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
});



