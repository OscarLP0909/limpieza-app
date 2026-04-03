import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);

export default router;