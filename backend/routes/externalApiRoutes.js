const express = require('express');
const router = express.Router();
const { verifyApiToken } = require('../utils/auth');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');

// Security middleware for external APIs
const externalApiAuth = async (req, res, next) => {
    const apiToken = req.headers['x-api-token'];

    if (!apiToken) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'API token is required'
        });
    }

    try {
        const userId = await verifyApiToken(apiToken);
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API token'
            });
        }

        // Add user info to request
        req.externalUser = userId;
        next();
    } catch (error) {
        console.error('External API auth error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Authentication failed'
        });
    }
};

// Rate limiting for external APIs
const externalApiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply security middleware to all external API routes
router.use(helmet());
router.use(externalApiRateLimit);
router.use(externalApiAuth);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'group-bot-automator-external-api'
    });
});

// ============================================================================
// CONTACTS ENDPOINTS
// ============================================================================

// Get user's contacts (external)
router.get('/contacts', async (req, res) => {
    try {
        const Contact = require('../models/Contact');
        const contacts = await Contact.find({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { contacts },
            count: contacts.length
        });
    } catch (error) {
        console.error('External contacts error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch contacts'
        });
    }
});

// Get contact by ID (external)
router.get('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const Contact = require('../models/Contact');
        const contact = await Contact.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!contact) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: { contact }
        });
    } catch (error) {
        console.error('External get contact error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch contact'
        });
    }
});

// Create a new contact (external)
router.post('/contacts', async (req, res) => {
    try {
        const { name, phone, email, group, status = 'active' } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Name and phone are required'
            });
        }

        const Contact = require('../models/Contact');
        const contact = await Contact.create({
            name,
            phone,
            email,
            group,
            status,
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { contact },
            message: 'Contact created successfully'
        });
    } catch (error) {
        console.error('External create contact error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create contact'
        });
    }
});

// Update a contact (external)
router.put('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const Contact = require('../models/Contact');
        const contact = await Contact.findOneAndUpdate(
            { _id: id, createdBy: req.externalUser },
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!contact) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: { contact },
            message: 'Contact updated successfully'
        });
    } catch (error) {
        console.error('External update contact error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update contact'
        });
    }
});

// Delete a contact (external)
router.delete('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const Contact = require('../models/Contact');
        const contact = await Contact.findOneAndDelete({
            _id: id,
            createdBy: req.externalUser
        });

        if (!contact) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('External delete contact error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete contact'
        });
    }
});

// Toggle contact status (external)
router.patch('/contacts/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        const Contact = require('../models/Contact');
        const contact = await Contact.findOne({
            _id: id,
            createdBy: req.externalUser
        });

        if (!contact) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Contact not found'
            });
        }

        contact.status = contact.status === 'active' ? 'inactive' : 'active';
        await contact.save();

        res.json({
            success: true,
            data: { contact },
            message: `Contact ${contact.status} successfully`
        });
    } catch (error) {
        console.error('External toggle contact status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to toggle contact status'
        });
    }
});

// Search contacts (external)
router.get('/contacts/search', async (req, res) => {
    try {
        const { q, group, status } = req.query;
        const Contact = require('../models/Contact');

        let query = { createdBy: req.externalUser };

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } }
            ];
        }

        if (group) query.group = group;
        if (status) query.status = status;

        const contacts = await Contact.find(query).select('-__v');

        res.json({
            success: true,
            data: { contacts },
            count: contacts.length
        });
    } catch (error) {
        console.error('External search contacts error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to search contacts'
        });
    }
});

// ============================================================================
// WORKFLOWS ENDPOINTS
// ============================================================================

// Get user's workflows (external)
router.get('/workflows', async (req, res) => {
    try {
        const Workflow = require('../models/Workflow');
        const workflows = await Workflow.find({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { workflows },
            count: workflows.length
        });
    } catch (error) {
        console.error('External workflows error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch workflows'
        });
    }
});

// Get workflow by ID (external)
router.get('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const Workflow = require('../models/Workflow');
        const workflow = await Workflow.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!workflow) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            data: { workflow }
        });
    } catch (error) {
        console.error('External get workflow error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch workflow'
        });
    }
});

// Create a new workflow (external)
router.post('/workflows', async (req, res) => {
    try {
        const { name, description, steps, status = 'active' } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Name is required'
            });
        }

        const Workflow = require('../models/Workflow');
        const workflow = await Workflow.create({
            name,
            description,
            steps,
            status,
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { workflow },
            message: 'Workflow created successfully'
        });
    } catch (error) {
        console.error('External create workflow error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create workflow'
        });
    }
});

// Update a workflow (external)
router.put('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const Workflow = require('../models/Workflow');
        const workflow = await Workflow.findOneAndUpdate(
            { _id: id, createdBy: req.externalUser },
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!workflow) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            data: { workflow },
            message: 'Workflow updated successfully'
        });
    } catch (error) {
        console.error('External update workflow error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update workflow'
        });
    }
});

// Delete a workflow (external)
router.delete('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const Workflow = require('../models/Workflow');
        const workflow = await Workflow.findOneAndDelete({
            _id: id,
            createdBy: req.externalUser
        });

        if (!workflow) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            message: 'Workflow deleted successfully'
        });
    } catch (error) {
        console.error('External delete workflow error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete workflow'
        });
    }
});

// ============================================================================
// TELEGRAM GROUPS ENDPOINTS
// ============================================================================

// Get user's telegram groups (external)
router.get('/groups', async (req, res) => {
    try {
        const TelegramGroup = require('../models/TelegramGroup');
        const groups = await TelegramGroup.find({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { groups },
            count: groups.length
        });
    } catch (error) {
        console.error('External groups error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch groups'
        });
    }
});

// Get group by ID (external)
router.get('/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const TelegramGroup = require('../models/TelegramGroup');
        const group = await TelegramGroup.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!group) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Group not found'
            });
        }

        res.json({
            success: true,
            data: { group }
        });
    } catch (error) {
        console.error('External get group error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch group'
        });
    }
});

// Create a new group (external)
router.post('/groups', async (req, res) => {
    try {
        const { name, chatId, description, status = 'active' } = req.body;

        if (!name || !chatId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Name and chat ID are required'
            });
        }

        const TelegramGroup = require('../models/TelegramGroup');
        const group = await TelegramGroup.create({
            name,
            chatId,
            description,
            status,
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { group },
            message: 'Group created successfully'
        });
    } catch (error) {
        console.error('External create group error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create group'
        });
    }
});

// Update a group (external)
router.put('/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const TelegramGroup = require('../models/TelegramGroup');
        const group = await TelegramGroup.findOneAndUpdate(
            { _id: id, createdBy: req.externalUser },
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!group) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Group not found'
            });
        }

        res.json({
            success: true,
            data: { group },
            message: 'Group updated successfully'
        });
    } catch (error) {
        console.error('External update group error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update group'
        });
    }
});

// Delete a group (external)
router.delete('/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const TelegramGroup = require('../models/TelegramGroup');
        const group = await TelegramGroup.findOneAndDelete({
            _id: id,
            createdBy: req.externalUser
        });

        if (!group) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Group not found'
            });
        }

        res.json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (error) {
        console.error('External delete group error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete group'
        });
    }
});

// ============================================================================
// MESSAGE FILTERS ENDPOINTS
// ============================================================================

// Get user's message filters (external)
router.get('/filters', async (req, res) => {
    try {
        const MessageFilter = require('../models/MessageFilter');
        const filters = await MessageFilter.find({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { filters },
            count: filters.length
        });
    } catch (error) {
        console.error('External filters error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch filters'
        });
    }
});

// Get filter by ID (external)
router.get('/filters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const MessageFilter = require('../models/MessageFilter');
        const filter = await MessageFilter.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!filter) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Filter not found'
            });
        }

        res.json({
            success: true,
            data: { filter }
        });
    } catch (error) {
        console.error('External get filter error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch filter'
        });
    }
});

// Create a new filter (external)
router.post('/filters', async (req, res) => {
    try {
        const {
            filterType,
            filterValue,
            groupId,
            workflowId,
            priority = 0,
            isActive = true
        } = req.body;

        if (!filterType || !filterValue) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Filter type and value are required'
            });
        }

        const MessageFilter = require('../models/MessageFilter');
        const filter = await MessageFilter.create({
            filterType,
            filterValue,
            groupId,
            workflowId,
            priority,
            isActive,
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { filter },
            message: 'Filter created successfully'
        });
    } catch (error) {
        console.error('External create filter error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create filter'
        });
    }
});

// Update a filter (external)
router.put('/filters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const MessageFilter = require('../models/MessageFilter');
        const filter = await MessageFilter.findOneAndUpdate(
            { _id: id, createdBy: req.externalUser },
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!filter) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Filter not found'
            });
        }

        res.json({
            success: true,
            data: { filter },
            message: 'Filter updated successfully'
        });
    } catch (error) {
        console.error('External update filter error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update filter'
        });
    }
});

// Delete a filter (external)
router.delete('/filters/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const MessageFilter = require('../models/MessageFilter');
        const filter = await MessageFilter.findOneAndDelete({
            _id: id,
            createdBy: req.externalUser
        });

        if (!filter) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Filter not found'
            });
        }

        res.json({
            success: true,
            message: 'Filter deleted successfully'
        });
    } catch (error) {
        console.error('External delete filter error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete filter'
        });
    }
});

// Get filters by group (external)
router.get('/filters/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const MessageFilter = require('../models/MessageFilter');
        const filters = await MessageFilter.find({
            groupId,
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { filters },
            count: filters.length
        });
    } catch (error) {
        console.error('External filters by group error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch filters'
        });
    }
});

// ============================================================================
// WEBHOOKS ENDPOINTS
// ============================================================================

// Get user's webhooks (external)
router.get('/webhooks', async (req, res) => {
    try {
        const Webhook = require('../models/Webhook');
        const webhooks = await Webhook.find({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { webhooks },
            count: webhooks.length
        });
    } catch (error) {
        console.error('External webhooks error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch webhooks'
        });
    }
});

// Get webhook by ID (external)
router.get('/webhooks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const Webhook = require('../models/Webhook');
        const webhook = await Webhook.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!webhook) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Webhook not found'
            });
        }

        res.json({
            success: true,
            data: { webhook }
        });
    } catch (error) {
        console.error('External get webhook error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch webhook'
        });
    }
});

// Create a new webhook (external)
router.post('/webhooks', async (req, res) => {
    try {
        const {
            url,
            method = 'POST',
            entityType = 'all',
            events = [],
            enabled = true,
            description,
            payload,
            headers = {}
        } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'URL is required'
            });
        }

        const Webhook = require('../models/Webhook');
        const webhook = await Webhook.create({
            url,
            method,
            entityType,
            events,
            enabled,
            description,
            payload,
            headers,
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { webhook },
            message: 'Webhook created successfully'
        });
    } catch (error) {
        console.error('External create webhook error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create webhook'
        });
    }
});

// Update a webhook (external)
router.put('/webhooks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const Webhook = require('../models/Webhook');
        const webhook = await Webhook.findOneAndUpdate(
            { _id: id, createdBy: req.externalUser },
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!webhook) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Webhook not found'
            });
        }

        res.json({
            success: true,
            data: { webhook },
            message: 'Webhook updated successfully'
        });
    } catch (error) {
        console.error('External update webhook error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update webhook'
        });
    }
});

// Delete a webhook (external)
router.delete('/webhooks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const Webhook = require('../models/Webhook');
        const webhook = await Webhook.findOneAndDelete({
            _id: id,
            createdBy: req.externalUser
        });

        if (!webhook) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Webhook not found'
            });
        }

        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });
    } catch (error) {
        console.error('External delete webhook error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete webhook'
        });
    }
});

// ============================================================================
// MESSAGE LOGS ENDPOINTS
// ============================================================================

// Get message logs (external)
router.get('/logs', async (req, res) => {
    try {
        const { limit = 50, offset = 0, status, workflowId, groupId } = req.query;

        const MessageLog = require('../models/MessageLog');
        let query = { createdBy: req.externalUser };

        if (status) query.status = status;
        if (workflowId) query.workflowId = workflowId;
        if (groupId) query.groupId = groupId;

        const logs = await MessageLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .select('-__v');

        const total = await MessageLog.countDocuments(query);

        res.json({
            success: true,
            data: { logs },
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + logs.length
            }
        });
    } catch (error) {
        console.error('External logs error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch logs'
        });
    }
});

// Get log by ID (external)
router.get('/logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const MessageLog = require('../models/MessageLog');
        const log = await MessageLog.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!log) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Log not found'
            });
        }

        res.json({
            success: true,
            data: { log }
        });
    } catch (error) {
        console.error('External get log error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch log'
        });
    }
});

// Get logs by workflow (external)
router.get('/logs/workflow/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { limit = 50, offset = 0, status } = req.query;

        const MessageLog = require('../models/MessageLog');
        let query = {
            workflowId,
            createdBy: req.externalUser
        };

        if (status) query.status = status;

        const logs = await MessageLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .select('-__v');

        const total = await MessageLog.countDocuments(query);

        res.json({
            success: true,
            data: { logs },
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + logs.length
            }
        });
    } catch (error) {
        console.error('External logs by workflow error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch logs'
        });
    }
});

// Get logs by status (external)
router.get('/logs/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const MessageLog = require('../models/MessageLog');
        const query = {
            status,
            createdBy: req.externalUser
        };

        const logs = await MessageLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .select('-__v');

        const total = await MessageLog.countDocuments(query);

        res.json({
            success: true,
            data: { logs },
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + logs.length
            }
        });
    } catch (error) {
        console.error('External logs by status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch logs'
        });
    }
});

// ============================================================================
// ACTIONS ENDPOINTS
// ============================================================================

// Get user's actions (external)
router.get('/actions', async (req, res) => {
    try {
        const Action = require('../models/Action');
        const actions = await Action.find({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { actions },
            count: actions.length
        });
    } catch (error) {
        console.error('External actions error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch actions'
        });
    }
});

// Get action by ID (external)
router.get('/actions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const Action = require('../models/Action');
        const action = await Action.findOne({
            _id: id,
            createdBy: req.externalUser
        }).select('-__v');

        if (!action) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Action not found'
            });
        }

        res.json({
            success: true,
            data: { action }
        });
    } catch (error) {
        console.error('External get action error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch action'
        });
    }
});

// Create a new action (external)
router.post('/actions', async (req, res) => {
    try {
        const { type, data, status = 'pending' } = req.body;

        if (!type) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Action type is required'
            });
        }

        const Action = require('../models/Action');
        const action = await Action.create({
            type,
            data,
            status,
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { action },
            message: 'Action created successfully'
        });
    } catch (error) {
        console.error('External create action error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create action'
        });
    }
});

// Execute an action (external)
router.post('/actions/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const Action = require('../models/Action');
        const action = await Action.findOne({
            _id: id,
            createdBy: req.externalUser
        });

        if (!action) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Action not found'
            });
        }

        // Update action status to executing
        action.status = 'executing';
        await action.save();

        // Here you would typically trigger the actual action execution
        // For now, we'll just update the status
        setTimeout(async () => {
            action.status = 'completed';
            await action.save();
        }, 1000);

        res.json({
            success: true,
            data: { action },
            message: 'Action execution started'
        });
    } catch (error) {
        console.error('External execute action error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to execute action'
        });
    }
});

// ============================================================================
// BULK MESSAGES ENDPOINTS
// ============================================================================

// Send bulk message (external)
router.post('/bulk-messages', async (req, res) => {
    try {
        const {
            message,
            contactIds = [],
            groupIds = [],
            workflowId,
            scheduledAt
        } = req.body;

        if (!message) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Message content is required'
            });
        }

        if (contactIds.length === 0 && groupIds.length === 0) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'At least one contact or group must be specified'
            });
        }

        // Create action for bulk messaging
        const Action = require('../models/Action');
        const action = await Action.create({
            type: 'bulk-message',
            data: {
                message,
                contactIds,
                groupIds,
                workflowId,
                scheduledAt
            },
            status: 'pending',
            createdBy: req.externalUser
        });

        res.status(201).json({
            success: true,
            data: { action },
            message: 'Bulk message scheduled successfully'
        });
    } catch (error) {
        console.error('External bulk message error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to schedule bulk message'
        });
    }
});

// Get bulk message status (external)
router.get('/bulk-messages/:actionId', async (req, res) => {
    try {
        const { actionId } = req.params;
        const Action = require('../models/Action');
        const action = await Action.findOne({
            _id: actionId,
            type: 'bulk-message',
            createdBy: req.externalUser
        }).select('-__v');

        if (!action) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Bulk message not found'
            });
        }

        res.json({
            success: true,
            data: { action }
        });
    } catch (error) {
        console.error('External get bulk message error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch bulk message status'
        });
    }
});

// ============================================================================
// SYSTEM STATUS ENDPOINTS
// ============================================================================

// Get system status (external)
router.get('/system-status', async (req, res) => {
    try {
        const SystemStatus = require('../models/SystemStatus');
        const status = await SystemStatus.findOne({
            createdBy: req.externalUser
        }).select('-__v');

        res.json({
            success: true,
            data: { status }
        });
    } catch (error) {
        console.error('External system status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch system status'
        });
    }
});

// Update system status (external)
router.put('/system-status', async (req, res) => {
    try {
        const { status, details } = req.body;

        if (!status) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Status is required'
            });
        }

        const SystemStatus = require('../models/SystemStatus');
        let systemStatus = await SystemStatus.findOne({
            createdBy: req.externalUser
        });

        if (systemStatus) {
            systemStatus.status = status;
            systemStatus.details = details;
            systemStatus.lastUpdated = new Date();
            await systemStatus.save();
        } else {
            systemStatus = await SystemStatus.create({
                status,
                details,
                createdBy: req.externalUser
            });
        }

        res.json({
            success: true,
            data: { status: systemStatus },
            message: 'System status updated successfully'
        });
    } catch (error) {
        console.error('External update system status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update system status'
        });
    }
});

// ============================================================================
// NOTIFICATIONS ENDPOINTS
// ============================================================================

// Get user's notifications (external)
router.get('/notifications', async (req, res) => {
    try {
        const { limit = 50, offset = 0, read } = req.query;

        // Since we don't have a Notification model, we'll return a placeholder
        // In a real implementation, you would query the actual notifications
        const notifications = [];

        res.json({
            success: true,
            data: { notifications },
            count: notifications.length,
            pagination: {
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: false
            }
        });
    } catch (error) {
        console.error('External notifications error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch notifications'
        });
    }
});

// Mark notification as read (external)
router.patch('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        // Placeholder implementation
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('External mark notification read error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to mark notification as read'
        });
    }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

// Get user statistics (external)
router.get('/stats', async (req, res) => {
    try {
        const Contact = require('../models/Contact');
        const Workflow = require('../models/Workflow');
        const TelegramGroup = require('../models/TelegramGroup');
        const MessageFilter = require('../models/MessageFilter');
        const Webhook = require('../models/Webhook');
        const MessageLog = require('../models/MessageLog');

        const [
            totalContacts,
            totalWorkflows,
            totalGroups,
            totalFilters,
            totalWebhooks,
            totalLogs,
            recentLogs
        ] = await Promise.all([
            Contact.countDocuments({ createdBy: req.externalUser }),
            Workflow.countDocuments({ createdBy: req.externalUser }),
            TelegramGroup.countDocuments({ createdBy: req.externalUser }),
            MessageFilter.countDocuments({ createdBy: req.externalUser }),
            Webhook.countDocuments({ createdBy: req.externalUser }),
            MessageLog.countDocuments({ createdBy: req.externalUser }),
            MessageLog.find({ createdBy: req.externalUser })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('status createdAt')
        ]);

        const stats = {
            contacts: {
                total: totalContacts,
                active: await Contact.countDocuments({ createdBy: req.externalUser, status: 'active' }),
                inactive: await Contact.countDocuments({ createdBy: req.externalUser, status: 'inactive' })
            },
            workflows: {
                total: totalWorkflows,
                active: await Workflow.countDocuments({ createdBy: req.externalUser, status: 'active' }),
                inactive: await Workflow.countDocuments({ createdBy: req.externalUser, status: 'inactive' })
            },
            groups: {
                total: totalGroups,
                active: await TelegramGroup.countDocuments({ createdBy: req.externalUser, status: 'active' }),
                inactive: await TelegramGroup.countDocuments({ createdBy: req.externalUser, status: 'inactive' })
            },
            filters: {
                total: totalFilters,
                active: await MessageFilter.countDocuments({ createdBy: req.externalUser, isActive: true }),
                inactive: await MessageFilter.countDocuments({ createdBy: req.externalUser, isActive: false })
            },
            webhooks: {
                total: totalWebhooks,
                active: await Webhook.countDocuments({ createdBy: req.externalUser, enabled: true }),
                inactive: await Webhook.countDocuments({ createdBy: req.externalUser, enabled: false })
            },
            logs: {
                total: totalLogs,
                recent: recentLogs.length,
                byStatus: {
                    success: await MessageLog.countDocuments({ createdBy: req.externalUser, status: 'success' }),
                    failed: await MessageLog.countDocuments({ createdBy: req.externalUser, status: 'failed' }),
                    pending: await MessageLog.countDocuments({ createdBy: req.externalUser, status: 'pending' })
                }
            }
        };

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        console.error('External stats error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch statistics'
        });
    }
});

module.exports = router; 