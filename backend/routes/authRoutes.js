const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const User = require('../models/User.js');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth.js');
const jwt = require('jsonwebtoken');
const { register } = require('../controllers/auth/registerController.js');
const { login } = require('../controllers/auth/loginController.js');
const { logout } = require('../controllers/auth/logoutController.js');
const { refreshToken } = require('../controllers/auth/refreshTokenController.js');
const { generatePasswordHash, validatePassword } = require('../utils/password.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

router.get('/me', requireUser, async (req, res) => {
  return res.status(200).json(req.user);
});

// Update user profile
router.put('/profile', requireUser, async (req, res) => {
  try {
    const { email, name } = req.body;
    const userId = req.user._id;

    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', requireUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await validatePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await generatePasswordHash(newPassword);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout from all devices
router.post('/logout-all-devices', requireUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate a new refresh token to invalidate all existing sessions
    const newRefreshToken = generateRefreshToken(req.user);

    // Update user with new refresh token
    await User.findByIdAndUpdate(userId, {
      refreshToken: newRefreshToken,
      lastLoginAt: new Date()
    });

    res.status(200).json({
      message: 'Successfully logged out from all devices',
      newRefreshToken
    });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
