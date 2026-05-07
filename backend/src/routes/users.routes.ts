import { Router } from "express";
import { getStaffUsers, createStaffUser, deleteStaffUser } from "../controllers/users.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin'), getStaffUsers);
router.post('/', authenticateToken, authorizeRoles('admin'), createStaffUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteStaffUser);

export default router;
