const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    label: {
        type: String,
        required: true,
        trim: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastUsedAt: {
        type: Date,
    },
    revoked: {
        type: Boolean,
        default: false,
    },
}, {
    versionKey: false,
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token; 