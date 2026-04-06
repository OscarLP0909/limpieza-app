import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import pool from "../database/db";

async function createUser() {
    const hash = await bcrypt.hash('client456', 10);

    await pool.query('INSERT INTO users (email, password, role_id, type) VALUES (?, ?, ?, ?)', ['client1@example.com', hash, 4, 'client']);

    console.log('User created successfully');
    process.exit(0);
}

createUser().catch((err) => {
    console.error('Failed to create user:', err);
    process.exit(1);
});