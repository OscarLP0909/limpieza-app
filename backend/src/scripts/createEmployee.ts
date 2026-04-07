import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import pool from "../database/db";

async function createUser() {
    const hash = await bcrypt.hash('employee123', 10);

    // await pool.query('INSERT INTO users (email, password, role_id, type) VALUES (?, ?, ?, ?)', ['employee1@example.com', hash, 3, 'empleado']);
    // await pool.query('INSERT INTO employees (nombre, apellidos, telefono, iban, nif, direccion, status) VALUES (?, ?, ?, ?, ?, ?)', ['Oscar', 'Luque Porca', '789767898', 'iban_ejemplo2', '65768798I', 'Calle 24 Asesinato', 'activo']);

    console.log('Employee created successfully');
    process.exit(0);
}

createUser().catch((err) => {
    console.error('Failed to create user:', err);
    process.exit(1);
});