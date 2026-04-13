import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Campos requeridos
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registro de usuario
 *     tags: [Auth]
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
 *                 example: ejemplo2@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Registro exitoso
 *       400:
 *         description: Campos requeridos
 *       401:
 *         description: Credenciales inválidas
 */

router.post('/register', register);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout de usuario
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso
 *       401:
 *         description: No autorizado
 */
router.post('/logout', authenticateToken, logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener datos del usuario logueado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', authenticateToken, me);

export default router;