import { Router } from "express";
import { getWorks, getWorkById, createWork, getWorksByClientId } from "../controllers/work.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Aquí puedes agregar las rutas relacionadas con "work", por ejemplo:
router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getWorks);
router.get('/my', authenticateToken, authorizeRoles('cliente'), getWorksByClientId);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'gestor'), getWorkById);
router.post('/', authenticateToken, authorizeRoles('cliente'), createWork);

export default router;