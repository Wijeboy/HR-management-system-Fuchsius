import express from 'express';
import ctrl from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const { requireRoles } = authMiddleware;

router.get('/', requireRoles('admin', 'hr', 'manager'), ctrl.listUsers);
router.get('/:employeeId', requireRoles('admin', 'hr', 'manager'), ctrl.getUserByEmployeeId);
router.post('/', requireRoles('admin', 'hr'), ctrl.createUser);
router.put('/:employeeId', requireRoles('admin', 'hr'), ctrl.updateUserByEmployeeId);
router.delete('/:employeeId', requireRoles('admin', 'hr'), ctrl.deleteUserByEmployeeId);

export default router;
