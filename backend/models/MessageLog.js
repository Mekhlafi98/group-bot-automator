const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
    workflow_id: {
        type: String,
        required: true,
    },
    workflow_name: {
        type: String,
        trim: true,
    },
    execution_id: {
        type: String,
        trim: true,
    },
    node_name: {
        type: String,
        trim: true,
    },
    error_message: {
        type: String,
        required: true,
    },
    error_stack: {
        type: String,
    },
    input_data: {
        type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['error', 'warning', 'info', 'success', 'pending', 'retrying'],
        default: 'error',
    },
    retries_count: {
        type: Number,
        default: 0,
    },
    triggered_by: {
        type: String,
        trim: true,
    },
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
messageLogSchema.index({ workflow_id: 1 });
messageLogSchema.index({ execution_id: 1 });
messageLogSchema.index({ timestamp: -1 });
messageLogSchema.index({ status: 1 });
messageLogSchema.index({ node_name: 1 });
messageLogSchema.index({ createdBy: 1 });

const MessageLog = mongoose.model('MessageLog', messageLogSchema);

module.exports = MessageLog; 