const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    contact_uid: {
        type: String,
        trim: true,
    },
    number: {
        type: String,
        required: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});

// Indexes - compound unique index on number + createdBy
contactSchema.index({ number: 1, createdBy: 1 }, { unique: true });
contactSchema.index({ isActive: 1 });
contactSchema.index({ isBlocked: 1 });
contactSchema.index({ name: 'text' });
contactSchema.index({ createdBy: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact; 