const authController = require('../controllers/user/authContoller');
const userController = require('../controllers/user/productsController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const couponController = require('../controllers/user/couponController');
const { Router } = require('express');
const router = Router();
const userFound = require('../middlewares/userFound');
const isBlocked = require('../middlewares/isBlocked');
const isAuthenticated = require('../middlewares/isAuthenticatedUser');
const passport = require('passport');
// const cartCount = require('../middlewares/cartCount');


// Products controller
router.get('/', isBlocked, userController.renderHome);
router.get('/shop', isBlocked, userController.renderShop);
router.post('/shop', isBlocked, userController.sortAndFilter);
router.get('/product-details', userController.renderProductDetails);

// Authentication contollers
router.get('/login', userFound, authController.renderLogin);
router.post('/login', userFound, authController.handleLogin);
router.get('/signup', userFound, authController.renderSignup);
router.post('/signup', userFound, authController.handleSignup);
router.get('/verify-email', userFound, authController.renderVerifyEmail);
router.post('/verify-email', userFound, authController.handleVerifyEmail);
router.get('/resend-otp', userFound, authController.handleResendOtp);
router.get('/forgot-password-email', userFound, authController.renderForgotPasswordEmail);
router.post('/forgot-password-email', userFound, authController.handleForgotPasswordEmail);
router.get('/forgot-password-otp', userFound, authController.forgotPasswordOtp);
router.post('/forgot-password-otp', userFound, authController.handleForgotPasswordOtp);
router.get('/forgot-password', userFound, authController.renderForgotPassword);
router.post('/forgot-password', userFound, authController.handleForgotPassword);
router.get('/logout', authController.handleLogout);




// Route for initiating Google OAuth 2.0 authentication
router.get('/auth/google',
passport.authenticate('google', { scope: ['email', 'profile'] })
);

router.get('/auth/google/callback', passport.authenticate('google', { successRedirect:'/', failureRedirect: '/auth/failure' }), (req, res) => {
    console.log('user details' ,req.user);
});
router.get('/auth/failure', (req, res) => {
    res.send('<h1>Google authentication failure</h1>');
})

router.use(isBlocked);
router.use(isAuthenticated);

// Profile Controller
router.get('/profile', profileController.renderProfile);
router.post('/edit-details', profileController.handleEditDetails);
router.get('/addNewAddress', profileController.rednerAddNewAddress);
router.post('/addNewAddress', profileController.handleAddNewAddress);
router.get('/edit-Address', profileController.renderEditAddress);
router.post('/edit-Address', profileController.handleEditAddress);
router.get('/delete-Address', profileController.handleDeleteAddress);
router.post('/add-wallet-balance', profileController.handleAddWalletBalance);
router.post('/verify-wallet-payment', profileController.verifyWalletPayment);
router.get('/order-details', profileController.renderOrderDeatils);

// Wishlist Controller
router.get("/wishlist", wishlistController.renderWishlist);
router.post("/add-to-wishlist", wishlistController.handleAddToWishlist);
router.get("/wishlist-remove", wishlistController.handleRemoveFromWishlist);

// Cart Controller
router.post('/addToCart', cartController.handleAddToCart);
router.get('/cart', cartController.renderCart);
// router.post("/changeQuantity", cartController.changeQuantity)
router.post("/cartQuantityUpdate", cartController.handleUpdateQuantity);
router.get("/checkout", cartController.renderCheckout);
router.post("/remove-product", cartController.handleRemoveProduct);

// Order Controller
router.post("/place-order", orderController.handlePlaceOrder);
// router.post("/cancel-order", orderController.handleCancelOrder);
router.get("/return-order", orderController.handleReturnProduct);
router.post("/verify-payment", orderController.verifypayment);
router.get("/order-success", orderController.renderOrderSuccess);
router.get("/cancel-order", orderController.handleCancelOrder);
router.post("/pay-pending", orderController.payPending);
router.post("/verify-payment-pending", orderController.verifypaymentPending);
router.get('/download-invoice', orderController.handleInvoiceDownload);

// Coupon Controller

router.post('/apply-coupon', couponController.handleApplyCoupon);
router.post('/redeem-referralCode', profileController.redeemReferralCode);



module.exports = router;