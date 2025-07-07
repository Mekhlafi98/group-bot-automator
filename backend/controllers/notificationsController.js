const Contact = require('../models/Contact');
const MessageFilter = require('../models/MessageFilter');

// POST /api/notifications
async function sendNotification(req, res) {
    try {
        const { contactId, filterId, message } = req.body;
        if (!contactId || !filterId || !message) {
            return res.status(400).json({ message: 'contactId, filterId, and message are required.' });
        }
        // Simulate sending notification
        res.json({ success: true, contactId, filterId, message });
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { sendNotification }; 