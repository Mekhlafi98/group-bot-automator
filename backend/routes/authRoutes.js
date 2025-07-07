const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const User = require('../models/User.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth.js');
const jwt = require('jsonwebtoken');
const { register } = require('../controllers/auth/registerController.js');
const { login } = require('../controllers/auth/loginController.js');
const { logout } = require('../controllers/auth/logoutController.js');
const { refreshToken } = require('../controllers/auth/refreshTokenController.js');

const router = express.Router();

router.post('/login', login);

router.post('/register', register);

router.post('/logout', logout);

router.post('/refresh', refreshToken);

router.get('/me', requireUser, async (req, res) => {
  return res.status(200).json(req.user);
});

module.exports = router;
