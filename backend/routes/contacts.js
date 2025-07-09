const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const router = express.Router();
const {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    toggleContactStatus,
    searchContacts,
} = require('../controllers/contactsController');
const { verifyApiToken } = require('../utils/auth');

// Apply authentication middleware to all routes
router.use(requireUser);

// Get all contacts
router.get('/', getAllContacts);

// Search contacts
router.get('/search', searchContacts);

// Get contact by ID
router.get('/:id', getContactById);

// Create new contact
router.post('/', createContact);

// Update contact
router.put('/:id', updateContact);

// Delete contact
router.delete('/:id', deleteContact);

// Toggle contact status
router.patch('/:id/toggle-status', toggleContactStatus);

// Public API token endpoint for external integrations
router.get('/external', async (req, res) => {
    const apiToken = req.headers['x-api-token'];
    console.log('Received x-api-token:', apiToken);
    const userId = await verifyApiToken(apiToken);
    console.log('verifyApiToken result:', userId);
    if (!userId) return res.status(401).json({ message: 'Invalid API token' });
    // Ensure userId is a string
    const userIdStr = typeof userId === 'object' && userId.toString ? userId.toString() : userId;
    // Fetch contacts for this user
    const Contact = require('../models/Contact');
    const contacts = await Contact.find({ createdBy: userIdStr });
    res.json({ contacts });
});

module.exports = router; 