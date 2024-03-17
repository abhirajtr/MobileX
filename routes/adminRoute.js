const adminController = require('../controllers/admin/adminController');
const userController = require('../controllers/admin/userController');
const productController = require('../controllers/admin/productController');
const orderController = require('../controllers/admin/orderController');
const brandController = require('../controllers/admin/brandController');
const couponController = require('../controllers/admin/couponController');
const isAuthenticated = require('../middlewares/isAuthenticatedAdmin');
const { Router } = require('express');
const router = Router();
const upload = require('../configs/multer');

router.get('/login', adminController.renderLogin);
router.post('/login', adminController.handleLogin);
// router.use(isAuthenticated);
router.get('/dashboard', adminController.renderDashboard); 
router.get('/users', userController.renderUsers);
router.get('/block-user', userController.blockUser);
router.get('/unblock-user', userController.unblockUser);
router.get('/edit-user', userController.renderEditUser);
router.post('/edit-user', userController.handleEdituser);

// Products route
router.get('/products', productController.renderProducts);
router.get('/add-product', productController.renderAddProduct);
router.post('/add-product', upload.array('images', 3), productController.handleAddProduct);
router.get('/edit-product', productController.renderEditProduct);
router.post('/edit-product', productController.handleEditProduct);
router.post('/upload-image', upload.single('image'), productController.handelEditImage);
router.get('/product-block', productController.handleBlockProduct);
router.get('/product-unblock', productController.handleUnblockProduct);
router.get('/product-details', productController.renderProductDetails);


router.get('/category', adminController.renderCategory);
router.post('/create-category', adminController.handleCreateCategory);
router.get('/category-list', adminController.handleListCategory);
router.get('/category-unlist', adminController.handleUnlistCategory);
router.get('/edit-category', adminController.renderEditCategory);
router.post('/edit-category', adminController.handleEditCategory);

// Brand
router.get('/brands', brandController.renderBrands);
router.get('/brand-add', brandController.renderAddBrand);
router.post('/brand-add', brandController.handleAddBrand);

router.get('/orders', orderController.renderOrders);
router.get('/order-details', orderController.renderOrderDetails);
router.post('/updateOrderStatus', orderController.handleUpdateOrderStatus);

// Cuupon
router.get('/coupon', couponController.renderCoupon);
router.post('/coupon-add', couponController.handleAddCoupen);
router.get('/coupon-edit', couponController.renderEditCoupon);
router.post('/coupon-edit', couponController.handleEditCoupon);

router.get('/logout', adminController.handleLogout);

module.exports = router;