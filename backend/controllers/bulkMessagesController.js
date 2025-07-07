const Contact = require('../models/Contact');
const TelegramGroup = require('../models/TelegramGroup');

// POST /api/bulk-messages
async function sendBulkMessage(req, res) {
    try {
        const { contacts = [], groups = [], message } = req.body;
        if (!message || (!contacts.length && !groups.length)) {
            return res.status(400).json({ message: 'Contacts or groups and message are required.' });
        }

        // Simulate sending
        const results = [];
        for (const contactId of contacts) {
            results.push({ recipientType: 'contact', recipientId: contactId, status: 'sent' });
        }
        for (const groupId of groups) {
            results.push({ recipientType: 'group', recipientId: groupId, status: 'sent' });
        }
        res.json({ success: true, results });
    } catch (error) {
        console.error('Bulk message error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { sendBulkMessage }; 