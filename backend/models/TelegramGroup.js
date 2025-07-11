const mongoose = require('mongoose');

const telegramGroupSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['group', 'supergroup', 'channel'],
        default: 'group',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
    }],
    welcome_message: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});

// Indexes - compound unique index on chatId + createdBy
telegramGroupSchema.index({ chatId: 1, createdBy: 1 }, { unique: true });
telegramGroupSchema.index({ isActive: 1 });
telegramGroupSchema.index({ createdBy: 1 });

const TelegramGroup = mongoose.model('TelegramGroup', telegramGroupSchema);

module.exports = TelegramGroup; 