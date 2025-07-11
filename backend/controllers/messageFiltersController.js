const MessageFilter = require('../models/MessageFilter');
const TelegramGroup = require('../models/TelegramGroup');
const Workflow = require('../models/Workflow');

// Get all Filters for current user
async function getAllFilters(req, res) {
    try {
        const filters = await MessageFilter.find({
            createdBy: req.user._id
        })
            .populate('groupId', 'title chatId')
            .populate('workflowId', 'name workflowId')
            .populate('channelId', 'phone type')
            .populate('support', 'name number')
            .sort({ createdAt: -1 });

        res.status(200).json(filters);
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get filter by ID (only if created by current user)
async function getFilterById(req, res) {
    try {
        const { id } = req.params;
        const filter = await MessageFilter.findOne({
            _id: id,
            createdBy: req.user._id
        })
            .populate('groupId', 'title chatId')
            .populate('workflowId', 'name workflowId')
            .populate('channelId', 'phone type')
            .populate('support', 'name number');

        if (!filter) {
            return res.status(404).json({ message: 'Filter not found' });
        }

        res.status(200).json(filter);
    } catch (error) {
        console.error('Error fetching filter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get filters by group (only groups created by current user)
async function getFiltersByGroup(req, res) {
    try {
        const { groupId } = req.params;

        // Verify the group belongs to the current user
        const group = await TelegramGroup.findOne({
            _id: groupId,
            createdBy: req.user._id
        });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const filters = await MessageFilter.find({
            groupId: groupId,
            createdBy: req.user._id
        })
            .populate('workflowId', 'name workflowId')
            .populate('channelId', 'phone type')
            .populate('support', 'name number')
            .sort({ createdAt: -1 });

        res.status(200).json(filters);
    } catch (error) {
        console.error('Error fetching group filters:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create new filter
async function createFilter(req, res) {
    try {
        const { groupId, workflowId, channelId, filterName, filterType, filterValue, priority, aiPrompt, support } = req.body;

        if (!channelId || !filterName || !filterType || !filterValue) {
            return res.status(400).json({
                message: 'Channel ID, Filter Name, Filter Type, and Filter Value are required'
            });
        }

        // Verify the group belongs to the current user if provided
        if (groupId && groupId.length > 0) {
            const group = await TelegramGroup.findOne({
                _id: { $in: groupId },
                createdBy: req.user._id
            });

            if (!group) {
                return res.status(400).json({ message: 'One or more groups not found or not accessible' });
            }
        }

        // Verify the workflow belongs to the current user if provided
        if (workflowId) {
            const workflow = await Workflow.findOne({
                _id: workflowId,
                createdBy: req.user.id
            });

            if (!workflow) {
                return res.status(400).json({ message: 'Workflow not found or not accessible' });
            }
        }

        // Verify the channel belongs to the current user if provided
        if (channelId) {
            const WhatsAppChannel = require('../models/WhatsAppChannel');
            const channel = await WhatsAppChannel.findOne({
                _id: channelId,
                createdBy: req.user._id
            });

            if (!channel) {
                return res.status(400).json({ message: 'Channel not found or not accessible' });
            }
        }

        // Validate support if provided
        let validSupport = [];
        if (support && Array.isArray(support) && support.length > 0) {
            const userContacts = await require('../models/Contact').find({
                _id: { $in: support },
                createdBy: req.user._id
            });
            if (userContacts.length !== support.length) {
                return res.status(400).json({ message: 'One or more support contacts not found or not accessible' });
            }
            validSupport = support;
        }

        const filter = new MessageFilter({
            groupId: groupId || [],
            workflowId: workflowId || null,
            channelId,
            filterName,
            filterType,
            filterValue,
            priority: priority || 0,
            aiPrompt: aiPrompt || null,
            support: validSupport,
            createdBy: req.user._id,
        });

        await filter.save();

        const populatedFilter = await MessageFilter.findById(filter._id)
            .populate('groupId', 'title chatId')
            .populate('workflowId', 'name workflowId')
            .populate('channelId', 'phone type')
            .populate('support', 'name number');

        res.status(201).json(populatedFilter);
    } catch (error) {
        console.error('Error creating filter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update filter (only if created by current user)
async function updateFilter(req, res) {
    try {
        const { id } = req.params;
        const { groupId, workflowId, channelId, filterName, filterType, filterValue, isActive, priority, aiPrompt, support } = req.body;

        const filter = await MessageFilter.findOne({
            _id: id,
            createdBy: req.user._id
        });

        if (!filter) {
            return res.status(404).json({ message: 'Filter not found' });
        }

        // If updating groupId, verify the new groups belong to the current user
        if (groupId) {
            const group = await TelegramGroup.findOne({
                _id: { $in: groupId },
                createdBy: req.user._id
            });

            if (!group) {
                return res.status(400).json({ message: 'One or more groups not found or not accessible' });
            }
            filter.groupId = groupId;
        }

        // If updating workflowId, verify the workflow belongs to the current user
        if (workflowId) {
            const workflow = await Workflow.findOne({
                _id: workflowId,
                createdBy: req.user.id
            });

            if (!workflow) {
                return res.status(400).json({ message: 'Workflow not found or not accessible' });
            }
            filter.workflowId = workflowId;
        }

        // If updating channelId, verify the channel belongs to the current user
        if (channelId !== undefined) {
            if (channelId) {
                const WhatsAppChannel = require('../models/WhatsAppChannel');
                const channel = await WhatsAppChannel.findOne({
                    _id: channelId,
                    createdBy: req.user._id
                });

                if (!channel) {
                    return res.status(400).json({ message: 'Channel not found or not accessible' });
                }
            }
            filter.channelId = channelId;
        }

        if (filterName !== undefined) filter.filterName = filterName;
        if (filterType !== undefined) filter.filterType = filterType;
        if (filterValue !== undefined) filter.filterValue = filterValue;
        if (isActive !== undefined) filter.isActive = isActive;
        if (priority !== undefined) filter.priority = priority;
        if (aiPrompt !== undefined) filter.aiPrompt = aiPrompt;

        // If updating support, validate ownership
        if (support) {
            if (!Array.isArray(support)) {
                return res.status(400).json({ message: 'Support must be an array' });
            }
            const userContacts = await require('../models/Contact').find({
                _id: { $in: support },
                createdBy: req.user._id
            });
            if (userContacts.length !== support.length) {
                return res.status(400).json({ message: 'One or more support contacts not found or not accessible' });
            }
            filter.support = support;
        }

        await filter.save();

        const populatedFilter = await MessageFilter.findById(filter._id)
            .populate('groupId', 'title chatId')
            .populate('workflowId', 'name workflowId')
            .populate('channelId', 'phone type')
            .populate('support', 'name number');

        res.status(200).json(populatedFilter);
    } catch (error) {
        console.error('Error updating filter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete filter (only if created by current user)
async function deleteFilter(req, res) {
    try {
        const { id } = req.params;

        const filter = await MessageFilter.findOne({
            _id: id,
            createdBy: req.user._id
        });

        if (!filter) {
            return res.status(404).json({ message: 'Filter not found' });
        }

        await MessageFilter.findByIdAndDelete(id);
        res.status(200).json({ message: 'Filter deleted successfully' });
    } catch (error) {
        console.error('Error deleting filter:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllFilters,
    getFilterById,
    getFiltersByGroup,
    createFilter,
    updateFilter,
    deleteFilter,
}; 