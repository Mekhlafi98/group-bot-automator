const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const {
    getAllLogs,
    getLogById,
    createLog,
    updateLog,
    deleteLog,
    getLogsByWorkflow,
    getLogsByStatus,
    getLogStats,
    retryLog,
} = require('../controllers/messageLogsController.js');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireUser);

// GET /api/message-logs - Get all logs with pagination and filtering
router.get('/', getAllLogs);

// GET /api/message-logs/stats - Get logs statistics
router.get('/stats', getLogStats);

// GET /api/message-logs/workflow/:workflow_id - Get logs by workflow ID
router.get('/workflow/:workflow_id', getLogsByWorkflow);

// GET /api/message-logs/status/:status - Get logs by status
router.get('/status/:status', getLogsByStatus);

// GET /api/message-logs/:id - Get log by ID
router.get('/:id', getLogById);

// POST /api/message-logs - Create new log
router.post('/', createLog);

// PUT /api/message-logs/:id - Update log
router.put('/:id', updateLog);

// DELETE /api/message-logs/:id - Delete log
router.delete('/:id', deleteLog);

// PATCH /api/message-logs/:id/retry - Retry failed log
router.patch('/:id/retry', retryLog);

module.exports = router; 