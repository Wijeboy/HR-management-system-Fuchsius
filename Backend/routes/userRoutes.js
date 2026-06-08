const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { requireRoles } = require('../middleware/authMiddleware');

router.get('/', requireRoles('admin', 'hr', 'manager'), ctrl.listUsers);
router.get('/:employeeId', requireRoles('admin', 'hr', 'manager'), ctrl.getUserByEmployeeId);
router.post('/', requireRoles('admin', 'hr'), ctrl.createUser);
router.put('/:employeeId', requireRoles('admin', 'hr'), ctrl.updateUserByEmployeeId);
router.delete('/:employeeId', requireRoles('admin', 'hr'), ctrl.deleteUserByEmployeeId);

module.exports = router;
