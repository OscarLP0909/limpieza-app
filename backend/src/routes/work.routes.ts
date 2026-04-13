import { Router } from "express";
import { getWorks, getWorkById, createWork, getWorksByClientId, updateWork, updateWorkStatus, getAssignedWorks } from "../controllers/work.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();


/**
 * @swagger
 * /works:
 *   get:
 *     summary: Obtener todos los trabajos
 *     tags: [Works]
 *     responses:
 *       200:
 *         description: Lista de trabajos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getWorks);

/**
 * @swagger
 * /works/my:
 *   get:
 *     summary: Obtener trabajos del cliente logueado
 *     tags: [Works]
 *     responses:
 *       200:
 *         description: Lista de trabajos del cliente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.get('/my', authenticateToken, authorizeRoles('cliente'), getWorksByClientId);

/**
 * @swagger
 * /works/assigned:
 *   get:
 *     summary: Obtener trabajos asignados al empleado logueado
 *     tags: [Works]
 *     responses:
 *       200:
 *         description: Lista de trabajos asignados
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 */
router.get('/assigned', authenticateToken, authorizeRoles('empleado'), getAssignedWorks);

/**
 * @swagger
 * /works/{id}:
 *   get:
 *     summary: Obtener un trabajo por ID
 *     tags: [Works]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trabajo encontrado
 *       404:
 *         description: Trabajo no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', authenticateToken, authorizeRoles('admin', 'gestor'), getWorkById);

/**
 * @swagger
 * /works:
 *   post:
 *     summary: Crear un trabajo
 *     tags: [Works]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_tipo_servicio
 *               - id_frecuencia
 *               - direccion_trabajo
 *               - fecha_hora
 *             properties:
 *               id_tipo_servicio:
 *                 type: integer
 *                 example: 1
 *               id_frecuencia:
 *                 type: integer
 *                 example: 1
 *               direccion_trabajo:
 *                 type: string
 *                 example: Calle Mayor 1
 *               fecha_hora:
 *                 type: string
 *                 example: "2026-05-01 10:00:00"
 *     responses:
 *       201:
 *         description: Trabajo creado
 *       400:
 *         description: Campos requeridos
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticateToken, authorizeRoles('cliente'), createWork);

/**
 * @swagger
 * /works/{id}:
 *   patch:
 *     summary: Asignar empleados y presupuestar un trabajo
 *     tags: [Works]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_employees
 *               - duracion
 *             properties:
 *               id_employees:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               duracion:
 *                 type: integer
 *                 example: 60
 *     responses:
 *       200:
 *         description: Trabajo actualizado
 *       400:
 *         description: Campos requeridos
 *       404:
 *         description: Trabajo no encontrado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'gestor'), updateWork);

/**
 * @swagger
 * /works/{id}/status:
 *   patch:
 *     summary: Actualizar estado del trabajo por el cliente
 *     tags: [Works]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: aceptado
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Trabajo no encontrado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/status', authenticateToken, authorizeRoles('cliente'), updateWorkStatus);


export default router;