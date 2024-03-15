const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const { Router } = require('express');
const router = Router();
const userFound = require('../middlewares/userFound');
const isBlocked = require('../middlewares/isBlocked');
const isAuthenticated = require('../middlewares/isAuthenticatedUser');
const passport = require('passport');
// const cartCount = require('../middlewares/cartCount');

// router.use(cartCount);
router.get('/login', userFound, userController.renderLogin);
router.post('/login', userFound, userController.handleLogin);
router.get('/signup', userFound, userController.renderSignup);
router.post('/signup', userFound, userController.handleSignup);
router.get('/verify-email', userFound, userController.renderVerifyEmail);
router.post('/verify-email', userFound, userController.handleVerifyEmail);
router.get('/resend-otp', userFound, userController.handleResendOtp);
router.get('/forgot-password-email', userFound, userController.renderForgotPasswordEmail);
router.post('/forgot-password-email', userFound, userController.handleForgotPasswordEmail);
router.get('/forgot-password-otp', userFound, userController.forgotPasswordOtp);
router.post('/forgot-password-otp', userFound, userController.handleForgotPasswordOtp);
router.get('/forgot-password', userFound, userController.renderForgotPassword);
router.post('/forgot-password', userFound, userController.handleForgotPassword);

router.get('/logout', userController.handleLogout);
router.get('/', isBlocked, userController.renderHome);
router.get('/shop', isBlocked, userController.renderShop);
router.get('/product-details', userController.renderProductDetails);
router.post('/products-sort', userController.renderSortByProducts);


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
router.get('/profile', profileController.renderEditProfile);
router.post('/edit-details', profileController.handleEditDetails);
router.get('/addNewAddress', profileController.rednerAddNewAddress);
router.post('/addNewAddress', profileController.handleAddNewAddress);
router.get('/edit-Address', profileController.renderEditAddress);
router.post('/edit-Address', profileController.handleEditAddress);
router.get('/delete-Address', profileController.handleDeleteAddress);
router.post('/add-wallet-balance', profileController.handleAddWalletBalance);

// Wishlist Controller
router.get("/wishlist", wishlistController.renderWishlist);
router.post("/add-to-wishlist", wishlistController.handleAddToWishlist);
router.get("/wishlist-remove", wishlistController.handleRemoveFromWishlist);

// Cart Controller
router.post('/addToCart', cartController.handleAddToCart);
router.get('/cart', cartController.renderCart);
router.post("/changeQuantity", cartController.changeQuantity)
router.post("/cartQuantityUpdate", cartController.handleUpdateQuantity);
router.get("/checkout", cartController.renderCheckout);
router.post("/remove-product", cartController.handleRemoveProduct);

// Order Controller
router.post("/place-order", orderController.handlePlaceOrder);
router.post("/cancel-order", orderController.handleCancelOrder);
router.post("/verify-payment", orderController.verifypayment);
router.get("/order-success", orderController.renderOrderSuccess);



module.exports = router;