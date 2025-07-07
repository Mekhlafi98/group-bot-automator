const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');

const {
    getAllWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
} = require('../controllers/workflowsController.js');

// Apply authentication middleware to all routes
router.use(requireUser);

// GET /api/workflows - Get all workflows
router.get('/', getAllWorkflows);

// GET /api/workflows/:id - Get workflow by ID
router.get('/:id', getWorkflowById);

// POST /api/workflows - Create new workflow
router.post('/', createWorkflow);

// PUT /api/workflows/:id - Update workflow
router.put('/:id', updateWorkflow);

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', deleteWorkflow);

module.exports = router; 