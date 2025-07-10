const WhatsAppChannel = require('../models/WhatsAppChannel');

// Create a new channel
exports.createChannel = async (req, res) => {
  try {
    const { session, secret, token, status, qr } = req.body;
    const createdBy = req.user._id;
    const channel = await WhatsAppChannel.create({ session, secret, token, status, qr, createdBy });
    res.status(201).json(channel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all channels for the user
exports.getChannels = async (req, res) => {
  try {
    const channels = await WhatsAppChannel.find({ createdBy: req.user._id });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single channel by ID
exports.getChannel = async (req, res) => {
  try {
    const channel = await WhatsAppChannel.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a channel
exports.updateChannel = async (req, res) => {
  try {
    const update = req.body;
    const channel = await WhatsAppChannel.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      update,
      { new: true }
    );
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a channel
exports.deleteChannel = async (req, res) => {
  try {
    const channel = await WhatsAppChannel.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 