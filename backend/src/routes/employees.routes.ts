import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";



const router = Router();




export default router;