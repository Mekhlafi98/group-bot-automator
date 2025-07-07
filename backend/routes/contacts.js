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

module.exports = router; 