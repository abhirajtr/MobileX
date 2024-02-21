const adminController = require('../controllers/adminController');
const isAuthenticated = require('../middlewares/isAuthenticatedAdmin');
const { Router } = require('express');
const router = Router();
const upload = require('../configs/multer');

router.get('/login', adminController.renderLogin);
router.post('/login', adminController.handleLogin);
router.use(isAuthenticated);
router.get('/dashboard', adminController.renderDashboard); 
router.get('/users', adminController.renderUsers);
router.get('/block-user', adminController.blockUser);
router.get('/unblock-user', adminController.unblockUser);
router.get('/edit-user', adminController.renderEditUser);
router.post('/edit-user', adminController.handleEdituser);
router.get('/products', adminController.renderProducts);
router.get('/add-product', adminController.renderAddProduct);
router.post('/add-product', upload.array('image', 3), adminController.handleAddProduct);
router.get('/category', adminController.renderCategory);
router.post('/create-category', adminController.handleCreateCategory);
router.get('/category-list', adminController.handleListCategory);
router.get('/category-unlist', adminController.handleUnlistCategory);
router.get('/edit-category', adminController.renderEditCategory);
router.post('/edit-category', adminController.handleEditCategory);

module.exports = router;