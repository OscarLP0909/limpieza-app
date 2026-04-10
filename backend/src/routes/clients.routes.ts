import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { createClient, deleteClient, getClients, getMyProfile, updateMyProfile } from "../controllers/clients.controller";

const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getClients);
router.get('/me', authenticateToken, authorizeRoles('cliente'), getMyProfile);
router.patch('/me', authenticateToken, authorizeRoles('cliente'), updateMyProfile);
router.post('/', authenticateToken, authorizeRoles('admin'), createClient);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteClient);

export default router;