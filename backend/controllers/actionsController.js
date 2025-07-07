const Action = require('../models/Action');
const Contact = require('../models/Contact');
const TelegramGroup = require('../models/TelegramGroup');

// Create a new action
async function createAction(req, res) {
    try {
        const { type, name, config } = req.body;
        if (!type || !name || !config) {
            return res.status(400).json({ message: 'type, name, and config are required.' });
        }
        const action = new Action({
            type,
            name,
            config,
            createdBy: req.user._id
        });
        await action.save();
        res.status(201).json(action);
    } catch (error) {
        console.error('Create action error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// List all actions for the user
async function listActions(req, res) {
    try {
        const actions = await Action.find({ createdBy: req.user._id });
        res.json(actions);
    } catch (error) {
        console.error('List actions error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Execute an action
async function executeAction(req, res) {
    try {
        const { id } = req.params;
        const action = await Action.findOne({ _id: id, createdBy: req.user._id });
        if (!action) return res.status(404).json({ message: 'Action not found' });

        if (action.type === 'bulk-message') {
            const { contacts = [], groups = [], message } = action.config;
            // Simulate sending
            const results = [];
            for (const contactId of contacts) {
                results.push({ recipientType: 'contact', recipientId: contactId, status: 'sent' });
            }
            for (const groupId of groups) {
                results.push({ recipientType: 'group', recipientId: groupId, status: 'sent' });
            }
            return res.json({ success: true, results });
        }
        // Add more action types as needed
        res.status(400).json({ message: 'Unknown action type' });
    } catch (error) {
        console.error('Execute action error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { createAction, listActions, executeAction }; 