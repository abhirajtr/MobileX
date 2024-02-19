const userController = require('../controllers/userController');
const { Router } = require('express');
const router = Router();

router.get('/', userController.renderHome);
router.get('/login', userController.renderLogin);
router.get('/signup', userController.renderSignup);
router.post('/signup', userController.handleSignup);
router.get('/verify-email', userController.renderVerifyEmail);
router.post('/verify-email', userController.handleVerifyEmail);
router.get('/resend-otp', userController.handleResendOtp);


module.exports = router;