const TelegramGroup = require('../models/TelegramGroup');
const Webhook = require('../models/Webhook');
const { sendWebhook } = require('../utils/webhookUtils');

// Get all telegram groups for current user
async function getAllGroups(req, res) {
    try {
        const groups = await TelegramGroup.find({
            createdBy: req.user._id
        }).sort({ createdAt: -1 });
        res.status(200).json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get group by ID (only if created by current user)
async function getGroupById(req, res) {
    try {
        const { id } = req.params;
        const group = await TelegramGroup.findOne({
            _id: id,
            createdBy: req.user._id
        });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.status(200).json(group);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create new group
async function createGroup(req, res) {
    try {
        const { chatId, title, type, contacts } = req.body;

        if (!chatId) {
            return res.status(400).json({ message: 'Chat ID is required' });
        }

        // Check if group already exists for this user
        const existingGroup = await TelegramGroup.findOne({
            chatId,
            createdBy: req.user._id
        });
        if (existingGroup) {
            return res.status(409).json({ message: 'Group with this chat ID already exists' });
        }

        const group = new TelegramGroup({
            chatId,
            title,
            type: type || 'group',
            contacts: contacts || [],
            createdBy: req.user._id,
        });

        await group.save();

        // Trigger webhooks for group creation
        try {
            const webhooks = await Webhook.find({
                entityType: 'telegram-group',
                events: 'create',
                enabled: true,
                createdBy: req.user._id
            });

            for (const webhook of webhooks) {
                const eventData = {
                    event: 'create',
                    entityType: 'telegram-group',
                    entityId: group._id,
                    data: group.toObject(),
                    timestamp: new Date().toISOString()
                };

                await sendWebhook(webhook, eventData);
            }
        } catch (webhookError) {
            console.error('Error triggering webhooks:', webhookError);
            // Don't fail the main request if webhooks fail
        }

        res.status(201).json(group);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update group (only if created by current user)
async function updateGroup(req, res) {
    try {
        const { id } = req.params;
        const { title, type, isActive, contacts } = req.body;

        const group = await TelegramGroup.findOne({
            _id: id,
            createdBy: req.user._id
        });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (title !== undefined) group.title = title;
        if (type !== undefined) group.type = type;
        if (isActive !== undefined) group.isActive = isActive;
        if (contacts !== undefined) group.contacts = contacts;

        await group.save();
        res.status(200).json(group);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete group (soft delete, only if created by current user)
async function deleteGroup(req, res) {
    try {
        const { id } = req.params;

        const group = await TelegramGroup.findOne({
            _id: id,
            createdBy: req.user._id
        });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        group.isActive = false;
        await group.save();

        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
}; 