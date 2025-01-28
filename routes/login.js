const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

router.post('/', loginController.loginAndSetToken);
router.get('/info', loginController.info);
module.exports = router;

