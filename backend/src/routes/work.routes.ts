import { Router } from "express";
import { getWorks, getWorkById, createWork } from "../controllers/work.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Aquí puedes agregar las rutas relacionadas con "work", por ejemplo:
router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getWorks);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'gestor'), getWorkById);
router.post('/', authenticateToken, authorizeRoles('client'), createWork);

export default router;