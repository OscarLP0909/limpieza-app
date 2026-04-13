import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { createClient, deleteClient, getClients, updateClient } from "../controllers/clients.controller";

const router = Router();

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getClients);

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellidos
 *               - direccion
 *               - telefono
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ejemplo
 *               apellidos:
 *                 type: string
 *                 example: Doe Doe
 *               direccion:
 *                 type: string
 *                 example: Calle Ejemplo 27
 *               telefono:
 *                 type: string
 *                 example: 999887766
 *               email:
 *                 type: string
 *                 example: cliente3@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Creación realizada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.post('/', authenticateToken, authorizeRoles('admin'), createClient);

/**
 * @swagger
 * /clients/{id}:
 *   patch:
 *     summary: Actualizar un cliente
 *     tags: [Clients]
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
 *               direccion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autorizado
 */

router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateClient);

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Eliminar un cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente eliminado
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteClient);

export default router;