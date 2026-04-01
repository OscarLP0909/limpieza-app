import { createPool } from 'mysql2/promise';


const pool = createPool({
    user: process.env.MYSQL_USER as string,
    password: process.env.MYSQL_PASSWORD as string,
    database: process.env.MYSQL_DATABASE as string,
    host: process.env.MYSQL_HOST as string,
    port: parseInt(process.env.MYSQL_PORT as string),
    timezone: "+00:00",
});

export default pool;