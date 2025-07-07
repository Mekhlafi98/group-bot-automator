const User = require('../../models/User');

async function logout(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ message: 'User logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { logout };
