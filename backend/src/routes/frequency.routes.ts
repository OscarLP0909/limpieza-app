import { Router } from "express";
import { createFrequencies, deleteFrequency, getFrequencies, updateFrequencies } from "../controllers/frequency.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin'), getFrequencies);
router.post('/', authenticateToken, authorizeRoles('admin'), createFrequencies);
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateFrequencies);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteFrequency);

export default router;