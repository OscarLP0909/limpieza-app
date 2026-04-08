import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { getServices } from "../controllers/services.controller";


const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin'), getServices);

export default router;