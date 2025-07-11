const mongoose = require('mongoose');

const messageFilterSchema = new mongoose.Schema({
    groupId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TelegramGroup',
        required: false,
    }],
    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workflow',
        required: false,
        default: null
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WhatsAppChannel',
        required: true,
    },
    filterName: {
        type: String,
        required: true,
    },
    filterType: {
        type: String,
        required: true,
        enum: ['keyword', 'regex', 'sender_role', 'message_type', 'ai_classification'],
    },
    filterValue: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    priority: {
        type: Number,
        default: 0,
    },
    aiPrompt: {
        type: String,
    },
    support: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: false,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});

// Indexes for performance
messageFilterSchema.index({ groupId: 1 });
messageFilterSchema.index({ workflowId: 1 });
messageFilterSchema.index({ channelId: 1 });
messageFilterSchema.index({ isActive: 1 });
messageFilterSchema.index({ createdBy: 1 });

const MessageFilter = mongoose.model('MessageFilter', messageFilterSchema);

module.exports = MessageFilter; 