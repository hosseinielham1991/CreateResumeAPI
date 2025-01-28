const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');

router.post('/checkingSignup', signupController.checkingSignup);
router.post('/checkingForgotpassword', signupController.checkingForgotpassword);
router.post('/sendcode', signupController.sendCodeRegister);
module.exports = router;

