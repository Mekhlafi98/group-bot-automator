const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup
} = require('../controllers/telegramGroupsController.js');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireUser);

// GET /api/telegram-groups - Get all groups
router.get('/', getAllGroups);

// GET /api/telegram-groups/:id - Get group by ID
router.get('/:id', getGroupById);

// POST /api/telegram-groups - Create new group
router.post('/', createGroup);

// PUT /api/telegram-groups/:id - Update group
router.put('/:id', updateGroup);

// DELETE /api/telegram-groups/:id - Delete group
router.delete('/:id', deleteGroup);

module.exports = router; 