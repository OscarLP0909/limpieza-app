import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import pool from "../database/db";

async function createTestUsers() {
    const adminHash = await bcrypt.hash('Admin1234!', 10);
    const gestorHash = await bcrypt.hash('Gestor1234!', 10);
    const empleadoHash = await bcrypt.hash('Empleado1234!', 10);
    const clienteHash = await bcrypt.hash('Cliente1234!', 10);

    // Admin
    const [adminUser]: any = await pool.query(
        'INSERT INTO users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
        ['admin@limpieza.com', adminHash, 1, 'employee']
    );
    await pool.query(
        'INSERT INTO employees (nombre, apellidos, telefono, nif, direccion, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'Demo', '600000001', '00000001A', 'Calle Demo 1', adminUser.insertId]
    );

    // Gestor
    const [gestorUser]: any = await pool.query(
        'INSERT INTO users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
        ['gestor@limpieza.com', gestorHash, 2, 'employee']
    );
    await pool.query(
        'INSERT INTO employees (nombre, apellidos, telefono, nif, direccion, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['Gestor', 'Demo', '600000002', '00000002B', 'Calle Demo 2', gestorUser.insertId]
    );

    // Empleado
    const [empleadoUser]: any = await pool.query(
        'INSERT INTO users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
        ['empleado@limpieza.com', empleadoHash, 3, 'employee']
    );
    await pool.query(
        'INSERT INTO employees (nombre, apellidos, telefono, nif, direccion, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        ['Empleado', 'Demo', '600000003', '00000003C', 'Calle Demo 3', empleadoUser.insertId]
    );

    // Cliente
    const [clienteUser]: any = await pool.query(
        'INSERT INTO users (email, password, role_id, type) VALUES (?, ?, ?, ?)',
        ['cliente@limpieza.com', clienteHash, 4, 'client']
    );
    await pool.query(
        'INSERT INTO clients (nombre, apellidos, telefono, direccion, user_id) VALUES (?, ?, ?, ?, ?)',
        ['Cliente', 'Demo', '600000004', 'Calle Demo 4', clienteUser.insertId]
    );

    console.log('✅ Usuarios de prueba creados correctamente');
    process.exit(0);
}

createTestUsers().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});