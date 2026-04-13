import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../controllers/employees.controller";



const router = Router();

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Obtener todos los empleados
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Lista de empleados
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getEmployees);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Crear un empleado
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellidos
 *               - telefono
 *               - iban
 *               - nif
 *               - direccion
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Carlos
 *               apellidos:
 *                 type: string
 *                 example: Martínez
 *               telefono:
 *                 type: string
 *                 example: "622333444"
 *               iban:
 *                 type: string
 *                 example: ES9121000418450200051332
 *               nif:
 *                 type: string
 *                 example: 12345678A
 *               direccion:
 *                 type: string
 *                 example: Calle Sevilla 10
 *               email:
 *                 type: string
 *                 example: carlos@limpieza.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Empleado creado
 *       400:
 *         description: Campos requeridos o duplicados
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticateToken, authorizeRoles('admin'), createEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   patch:
 *     summary: Actualizar un empleado
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               telefono:
 *                 type: string
 *               iban:
 *                 type: string
 *               nif:
 *                 type: string
 *               direccion:
 *                 type: string
 *               status:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Empleado actualizado
 *       404:
 *         description: Empleado no encontrado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Eliminar un empleado
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empleado eliminado
 *       404:
 *         description: Empleado no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteEmployee);


export default router;