import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getMyEmployeeProfile, updateMyEmployeeProfile } from "../controllers/employees.controller";



const router = Router();

router.get('/', authenticateToken, authorizeRoles('admin', 'gestor'), getEmployees);
router.get('/me', authenticateToken, authorizeRoles('empleado'), getMyEmployeeProfile);
router.patch('/me', authenticateToken, authorizeRoles('empleado'), updateMyEmployeeProfile);
router.post('/', authenticateToken, authorizeRoles('admin'), createEmployee);
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateEmployee);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteEmployee);


export default router;