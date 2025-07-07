const Webhook = require('../models/Webhook');
const { getAvailableEntityTypes, getEntityTypeInfo } = require('../utils/entityTypes');

// Get available entity types
async function getEntityTypes(req, res) {
    try {
        const entityTypes = getAvailableEntityTypes();
        res.json(entityTypes);
    } catch (error) {
        console.error('Error fetching entity types:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// List all webhooks for the current user
async function getAllWebhooks(req, res) {
    try {
        const webhooks = await Webhook.find({ createdBy: req.user._id });

        // Add entity type info to each webhook
        const webhooksWithInfo = webhooks.map(webhook => {
            const entityInfo = getEntityTypeInfo(webhook.entityType);
            return {
                ...webhook.toObject(),
                entityInfo
            };
        });

        res.json(webhooksWithInfo);
    } catch (error) {
        console.error('Error fetching webhooks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get a webhook by ID
async function getWebhookById(req, res) {
    try {
        const webhook = await Webhook.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });

        const entityInfo = getEntityTypeInfo(webhook.entityType);
        res.json({
            ...webhook.toObject(),
            entityInfo
        });
    } catch (error) {
        console.error('Error fetching webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create a webhook
async function createWebhook(req, res) {
    try {
        const { url, method, entityType, events, enabled, description, payload, headers, linkedEntityId } = req.body;

        if (!url || !entityType || !events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate entity type
        const availableTypes = getAvailableEntityTypes();
        const isValidEntityType = availableTypes.some(type => type.value === entityType);
        if (!isValidEntityType) {
            return res.status(400).json({ message: 'Invalid entity type' });
        }

        const webhook = new Webhook({
            url,
            method: method || 'POST',
            entityType,
            events,
            enabled: enabled !== undefined ? enabled : true,
            description,
            payload: payload || '{{data}}',
            headers: headers || {},
            createdBy: req.user._id,
            linkedEntityId: linkedEntityId && linkedEntityId.trim() !== '' ? linkedEntityId : undefined,
        });

        await webhook.save();

        const entityInfo = getEntityTypeInfo(webhook.entityType);
        res.status(201).json({
            ...webhook.toObject(),
            entityInfo
        });
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update a webhook
async function updateWebhook(req, res) {
    try {
        const { url, method, entityType, events, enabled, description, payload, headers, linkedEntityId } = req.body;
        const webhook = await Webhook.findOne({ _id: req.params.id, createdBy: req.user._id });

        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });

        // Validate entity type if provided
        if (entityType) {
            const availableTypes = getAvailableEntityTypes();
            const isValidEntityType = availableTypes.some(type => type.value === entityType);
            if (!isValidEntityType) {
                return res.status(400).json({ message: 'Invalid entity type' });
            }
        }

        if (url !== undefined) webhook.url = url;
        if (method !== undefined) webhook.method = method;
        if (entityType !== undefined) webhook.entityType = entityType;
        if (events !== undefined) webhook.events = events;
        if (enabled !== undefined) webhook.enabled = enabled;
        if (description !== undefined) webhook.description = description;
        if (payload !== undefined) webhook.payload = payload;
        if (headers !== undefined) webhook.headers = headers;
        if (linkedEntityId !== undefined) webhook.linkedEntityId = linkedEntityId && linkedEntityId.trim() !== '' ? linkedEntityId : undefined;

        await webhook.save();

        const entityInfo = getEntityTypeInfo(webhook.entityType);
        res.json({
            ...webhook.toObject(),
            entityInfo
        });
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete a webhook
async function deleteWebhook(req, res) {
    try {
        const webhook = await Webhook.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });
        res.json({ message: 'Webhook deleted' });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getEntityTypes,
    getAllWebhooks,
    getWebhookById,
    createWebhook,
    updateWebhook,
    deleteWebhook,
}; 