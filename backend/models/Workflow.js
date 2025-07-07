const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    workflowId: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false,
});

// Indexes - compound unique index on workflowId + createdBy
workflowSchema.index({ workflowId: 1, createdBy: 1 }, { unique: true });
workflowSchema.index({ isActive: 1 });
workflowSchema.index({ createdBy: 1 });

const Workflow = mongoose.model('Workflow', workflowSchema);

module.exports = Workflow; 