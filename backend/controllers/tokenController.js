const Token = require('../models/Token');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// List all tokens for the current user
async function listTokens(req, res) {
    const tokens = await Token.find({ user: req.user._id }).select('-tokenHash');
    res.json(tokens);
}

// Create a new API token
async function createToken(req, res) {
    const { label } = req.body;
    if (!label) return res.status(400).json({ message: 'Label is required' });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const token = await Token.create({
        user: req.user._id,
        label,
        tokenHash,
    });

    // Only show the raw token once
    res.status(201).json({
        _id: token._id,
        label: token.label,
        createdAt: token.createdAt,
        revoked: token.revoked,
        token: rawToken,
    });
}

// Revoke (delete) a token
async function revokeToken(req, res) {
    const { id } = req.params;
    const token = await Token.findOne({ _id: id, user: req.user._id });
    if (!token) return res.status(404).json({ message: 'Token not found' });
    token.revoked = true;
    await token.save();
    res.json({ message: 'Token revoked' });
}

module.exports = { listTokens, createToken, revokeToken }; 