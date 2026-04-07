import { Router } from "express";
import { getWorks, getWorkById, createWork, getWorksByClientId, updateWork, updateWorkStatus } from "../controllers/work.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Aquí puedes agregar las rutas relacionadas con "work", por ejemplo:
router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getWorks);
router.get('/my', authenticateToken, authorizeRoles('cliente'), getWorksByClientId);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'gestor'), getWorkById);
router.post('/', authenticateToken, authorizeRoles('cliente'), createWork);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'gestor'), updateWork);
router.patch('/:id/status', authenticateToken, authorizeRoles('cliente'), updateWorkStatus);

export default router;