const Workflow = require('../models/Workflow');

// Get all workflows for current user
const getAllWorkflows = async (req, res) => {
    try {
        const workflows = await Workflow.find({
            createdBy: req.user.id
        }).sort({ createdAt: -1 });
        res.status(200).json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get workflow by ID
const getWorkflowById = async (req, res) => {
    try {
        const workflow = await Workflow.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        res.status(200).json(workflow);
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new workflow
const createWorkflow = async (req, res) => {
    try {
        const { name, workflowId, description } = req.body;

        if (!name || !workflowId) {
            return res.status(400).json({ message: 'Name and Workflow ID are required' });
        }

        // Check if workflow with same ID already exists for this user
        const existingWorkflow = await Workflow.findOne({
            workflowId,
            createdBy: req.user.id
        });

        if (existingWorkflow) {
            return res.status(409).json({ message: 'Workflow with this ID already exists' });
        }

        const workflow = new Workflow({
            name,
            workflowId,
            description: description || "",
            createdBy: req.user.id
        });

        await workflow.save();
        res.status(201).json(workflow);
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update workflow
const updateWorkflow = async (req, res) => {
    try {
        const { name, workflowId, description, isActive } = req.body;

        const workflow = await Workflow.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        // If workflowId is being updated, check for duplicates
        if (workflowId && workflowId !== workflow.workflowId) {
            const existingWorkflow = await Workflow.findOne({
                workflowId,
                createdBy: req.user.id,
                _id: { $ne: req.params.id }
            });

            if (existingWorkflow) {
                return res.status(409).json({ message: 'Workflow with this ID already exists' });
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (workflowId !== undefined) updateData.workflowId = workflowId;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedWorkflow = await Workflow.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json(updatedWorkflow);
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete workflow
const deleteWorkflow = async (req, res) => {
    try {
        const workflow = await Workflow.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }

        await Workflow.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Workflow deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getAllWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
}; 