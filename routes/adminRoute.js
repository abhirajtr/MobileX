const adminController = require('../controllers/adminController');
const isAuthenticated = require('../middlewares/isAuthenticatedAdmin');
const { Router } = require('express');
const router = Router();

router.get('/login', adminController.renderLogin);
router.post('/login', adminController.handleLogin);
router.use(isAuthenticated);
router.get('/dashboard', adminController.renderDashboard); 
router.get('/users', adminController.renderUsers);
router.get('/block-user', adminController.blockUser);
router.get('/unblock-user', adminController.unblockUser);
router.get('/edit-user', adminController.renderEditUser);
router.post('/edit-user', adminController.handleEdituser);

module.exports = router;