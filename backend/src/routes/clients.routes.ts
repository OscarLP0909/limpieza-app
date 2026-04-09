import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { createClient, deleteClient, getClients, updateClient } from "../controllers/clients.controller";

const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getClients);
router.post('/', authenticateToken, authorizeRoles('admin'), createClient);
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateClient);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteClient);

export default router;