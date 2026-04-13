import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { getServices, createService, updateService, deleteService } from "../controllers/services.controller";


const router = Router();

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Obtener todos los servicios
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Lista de servicios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.get('/', authenticateToken, authorizeRoles('admin'), getServices);

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Crear un servicio
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_servicio
 *               - precio
 *             properties:
 *               tipo_servicio:
 *                 type: string
 *                 example: Limpieza hogar
 *               precio:
 *                 type: number
 *                 example: 50.00
 *     responses:
 *       201:
 *         description: Servicio creado
 *       400:
 *         description: Campos requeridos o duplicados
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticateToken, authorizeRoles('admin'), createService);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Eliminar un servicio
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Servicio eliminado
 *       404:
 *         description: Servicio no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteService);

/**
 * @swagger
 * /services/{id}:
 *   patch:
 *     summary: Actualizar un servicio
 *     tags: [Services]
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
 *               tipo_servicio:
 *                 type: string
 *               precio:
 *                 type: number
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *       404:
 *         description: Servicio no encontrado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateService);



export default router;