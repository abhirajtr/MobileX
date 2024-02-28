const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const { Router } = require('express');
const router = Router();
const userFound = require('../middlewares/userFound');
const isBlocked = require('../middlewares/isBlocked');
const isAuthenticated = require('../middlewares/isAuthenticatedUser');
const passport = require('passport');

router.get('/login', userFound, userController.renderLogin);
router.post('/login', userFound, userController.handleLogin);
router.get('/signup', userFound, userController.renderSignup);
router.post('/signup', userFound, userController.handleSignup);
router.get('/verify-email', userFound, userController.renderVerifyEmail);
router.post('/verify-email', userFound, userController.handleVerifyEmail);
router.get('/resend-otp', userFound, userController.handleResendOtp);
router.get('/logout', userController.handleLogout);
router.get('/', isBlocked, userController.renderHome);
router.get('/product-details', userController.renderProductDetails);


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

router.get('/edit-profile', userController.renderEditProfile);
router.post('/edit-details', userController.handleEditDetails);
// Route for initiating Google OAuth 2.0 authentication
router.get('/addNewAddress', profileController.rednerAddNewAddress);
router.post('/addNewAddress', profileController.handleAddNewAddress);
router.get('/editAddress', profileController.handleAddNewAddress);

module.exports = router;