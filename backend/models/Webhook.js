const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: 'POST',
        required: true,
    },
    entityType: {
        type: String,
        required: true,
        trim: true,
    },
    events: [{
        type: String,
        enum: ['create', 'update', 'delete'],
    }],
    enabled: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
        trim: true,
    },
    payload: {
        type: String,
        trim: true,
        default: '{{data}}',
    },
    headers: {
        type: Map,
        of: String,
        default: {},
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    linkedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: undefined,
    },
}, {
    timestamps: true,
    versionKey: false,
});

webhookSchema.index({ url: 1, createdBy: 1 });
webhookSchema.index({ entityType: 1 });
webhookSchema.index({ createdBy: 1 });

const Webhook = mongoose.model('Webhook', webhookSchema);

module.exports = Webhook; 