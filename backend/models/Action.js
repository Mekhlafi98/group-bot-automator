const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  type: { type: String, enum: ['bulk-message', 'notification'], required: true },
  name: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Action', actionSchema); 