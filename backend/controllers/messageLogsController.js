const MessageLog = require('../models/MessageLog');

// Get all error logs with pagination and filtering for current user
async function getAllLogs(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            workflow_id,
            node_name,
            startDate,
            endDate,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;
        const filter = { createdBy: req.user._id };

        // Apply filters
        if (status && status !== 'all') filter.status = status;
        if (workflow_id && workflow_id !== 'all') filter.workflow_id = workflow_id;
        if (node_name) filter.node_name = { $regex: node_name, $options: 'i' };

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const logs = await MessageLog.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MessageLog.countDocuments(filter);

        res.status(200).json({
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get log by ID (only if created by current user)
async function getLogById(req, res) {
    try {
        const { id } = req.params;
        const log = await MessageLog.findOne({
            _id: id,
            createdBy: req.user._id
        });

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        res.status(200).json(log);
    } catch (error) {
        console.error('Error fetching log:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create new error log
async function createLog(req, res) {
    try {
        const {
            workflow_id,
            workflow_name,
            execution_id,
            node_name,
            error_message,
            error_stack,
            input_data,
            status,
            retries_count,
            triggered_by
        } = req.body;

        if (!workflow_id || !error_message) {
            return res.status(400).json({
                message: 'Workflow ID and error message are required'
            });
        }

        const log = new MessageLog({
            workflow_id,
            workflow_name,
            execution_id,
            node_name,
            error_message,
            error_stack,
            input_data,
            status: status || 'error',
            retries_count: retries_count || 0,
            triggered_by,
            timestamp: new Date(),
            createdBy: req.user._id,
        });

        await log.save();
        res.status(201).json(log);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update log (only if created by current user)
async function updateLog(req, res) {
    try {
        const { id } = req.params;
        const {
            workflow_name,
            execution_id,
            node_name,
            error_message,
            error_stack,
            input_data,
            status,
            retries_count,
            triggered_by
        } = req.body;

        const log = await MessageLog.findOne({
            _id: id,
            createdBy: req.user._id
        });
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        if (workflow_name !== undefined) log.workflow_name = workflow_name;
        if (execution_id !== undefined) log.execution_id = execution_id;
        if (node_name !== undefined) log.node_name = node_name;
        if (error_message !== undefined) log.error_message = error_message;
        if (error_stack !== undefined) log.error_stack = error_stack;
        if (input_data !== undefined) log.input_data = input_data;
        if (status !== undefined) log.status = status;
        if (retries_count !== undefined) log.retries_count = retries_count;
        if (triggered_by !== undefined) log.triggered_by = triggered_by;

        await log.save();
        res.status(200).json(log);
    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete log (only if created by current user)
async function deleteLog(req, res) {
    try {
        const { id } = req.params;

        const log = await MessageLog.findOne({
            _id: id,
            createdBy: req.user._id
        });
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        await MessageLog.findByIdAndDelete(id);
        res.status(200).json({ message: 'Log deleted successfully' });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get logs by workflow ID (only workflows created by current user)
async function getLogsByWorkflow(req, res) {
    try {
        const { workflow_id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const logs = await MessageLog.find({
            workflow_id,
            createdBy: req.user._id
        })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MessageLog.countDocuments({
            workflow_id,
            createdBy: req.user._id
        });

        res.status(200).json({
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching workflow logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get logs by status (only logs created by current user)
async function getLogsByStatus(req, res) {
    try {
        const { status } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const logs = await MessageLog.find({
            status,
            createdBy: req.user._id
        })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MessageLog.countDocuments({
            status,
            createdBy: req.user._id
        });

        res.status(200).json({
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching status logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get logs statistics (only for current user)
async function getLogStats(req, res) {
    try {
        const statusBreakdown = await MessageLog.aggregate([
            { $match: { createdBy: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const totalLogs = await MessageLog.countDocuments({ createdBy: req.user._id });

        const recentLogs = await MessageLog.countDocuments({
            createdBy: req.user._id,
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        const topWorkflows = await MessageLog.aggregate([
            { $match: { createdBy: req.user._id } },
            { $group: { _id: '$workflow_id', count: { $sum: 1 }, workflow_name: { $first: '$workflow_name' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            statusBreakdown,
            totalLogs,
            recentLogs,
            topWorkflows
        });
    } catch (error) {
        console.error('Error fetching log stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Retry log (only if created by current user)
async function retryLog(req, res) {
    try {
        const { id } = req.params;

        const log = await MessageLog.findOne({
            _id: id,
            createdBy: req.user._id
        });
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        log.status = 'retrying';
        log.retries_count += 1;
        await log.save();

        res.status(200).json({ message: 'Log retry initiated', log });
    } catch (error) {
        console.error('Error retrying log:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllLogs,
    getLogById,
    createLog,
    updateLog,
    deleteLog,
    getLogsByWorkflow,
    getLogsByStatus,
    getLogStats,
    retryLog,
}; 