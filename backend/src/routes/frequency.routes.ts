import { Router } from "express";
import { getFrequencies } from "../controllers/frequency.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin'), getFrequencies);

export default router;