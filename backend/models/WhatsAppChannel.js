const mongoose = require('mongoose');

const whatsAppChannelSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  secret: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  status: {
    type: String,
    enum: ['CONNECTED', 'DISCONNECTED', 'WAITING QR', 'QRCODE'],
    default: 'DISCONNECTED'
  },
  qr: {
    type: String,
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

// Unique index on phone + createdBy
whatsAppChannelSchema.index({ phone: 1, createdBy: 1 }, { unique: true });

const WhatsAppChannel = mongoose.model('WhatsAppChannel', whatsAppChannelSchema);

module.exports = WhatsAppChannel; 