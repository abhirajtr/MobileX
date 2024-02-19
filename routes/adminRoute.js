const adminController = require('../controllers/adminController');
const { Router } = require('express');
const router = Router();

router.get('/login', adminController.renderLogin);
router.post('/login', adminController.handleLogin);
router.get('/dashboard', adminController.renderDashboard);
router.get('/users', adminController.renderUsers);
router.get('/block-user', adminController.blockUser);
router.get('/unblock-user', adminController.unblockUser);
module.exports = router;