import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { getServices, createService, updateService, deleteService } from "../controllers/services.controller";


const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin'), getServices);
router.post('/', authenticateToken, authorizeRoles('admin'), createService);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteService);
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateService);



export default router;