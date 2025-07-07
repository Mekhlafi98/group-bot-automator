const mongoose = require('mongoose');

const SystemStatusSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['operational', 'degraded', 'down'], default: 'operational' },
    lastChecked: { type: Date },
    lastResponseTime: { type: Number },
});

module.exports = mongoose.model('SystemStatus', SystemStatusSchema); 