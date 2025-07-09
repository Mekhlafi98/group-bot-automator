const jwt = require('jsonwebtoken');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function generateAccessToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function verifyApiToken(rawToken) {
    if (!rawToken) return null;
    const tokens = await Token.find({ revoked: false });
    for (const tokenDoc of tokens) {
        if (await bcrypt.compare(rawToken, tokenDoc.tokenHash)) {
            // Optionally, update lastUsedAt
            tokenDoc.lastUsedAt = new Date();
            await tokenDoc.save();
            return tokenDoc.user;
        }
    }
    return null;
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyApiToken,
}; 