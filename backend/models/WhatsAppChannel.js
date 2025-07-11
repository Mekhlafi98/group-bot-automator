const mongoose = require('mongoose');

const whatsAppChannelSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['whatsapp', 'telegram'],
    default: 'whatsapp',
    required: true,
  },
  webhook_url: {
    type: String,
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

// Index on createdBy for user filtering
whatsAppChannelSchema.index({ createdBy: 1 });

const WhatsAppChannel = mongoose.model('WhatsAppChannel', whatsAppChannelSchema);

module.exports = WhatsAppChannel; 