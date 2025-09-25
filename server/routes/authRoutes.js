const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const User = require('../models/userModel.js');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;