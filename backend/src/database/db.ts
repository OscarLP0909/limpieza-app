import dotenv from 'dotenv';
dotenv.config();

import { createPool } from 'mysql2/promise';


const pool = createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306,
    timezone: "+00:00",
});

export default pool;