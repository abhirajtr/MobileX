const adminController = require('../controllers/admin/adminController');
const userController = require('../controllers/admin/userController');
const productController = require('../controllers/admin/productController');
const isAuthenticated = require('../middlewares/isAuthenticatedAdmin');
const { Router } = require('express');
const router = Router();
const upload = require('../configs/multer');

router.get('/login', adminController.renderLogin);
router.post('/login', adminController.handleLogin);
router.use(isAuthenticated);
router.get('/dashboard', adminController.renderDashboard); 
router.get('/users', userController.renderUsers);
router.get('/block-user', userController.blockUser);
router.get('/unblock-user', userController.unblockUser);
router.get('/edit-user', userController.renderEditUser);
router.post('/edit-user', userController.handleEdituser);
router.get('/products', productController.renderProducts);
router.get('/add-product', productController.renderAddProduct);
router.post('/add-product', upload.array('images', 4), productController.handleAddProduct);
router.get('/edit-product', productController.renderEditProduct);
router.post('/edit-product', productController.handleEditProduct);
router.get('/product-block', productController.handleBlockProduct);
router.get('/product-unblock', productController.handleUnblockProduct);
router.get('/product-details', productController.renderProductDetails);

router.get('/category', adminController.renderCategory);
router.post('/create-category', adminController.handleCreateCategory);
router.get('/category-list', adminController.handleListCategory);
router.get('/category-unlist', adminController.handleUnlistCategory);
router.get('/edit-category', adminController.renderEditCategory);
router.post('/edit-category', adminController.handleEditCategory);
router.get('/brands', adminController.renderBrands);
router.get('/brand-add', adminController.renderAddBrand);
router.post('/brand-add', adminController.handleAddBrand);
router.get('/logout', adminController.handleLogout);


module.exports = router;