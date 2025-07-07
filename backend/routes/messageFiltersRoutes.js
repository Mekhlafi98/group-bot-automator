const express = require('express');
const { requireUser } = require('./middleware/auth.js');
const {
    getAllFilters,
    getFilterById,
    getFiltersByGroup,
    createFilter,
    updateFilter,
    deleteFilter
} = require('../controllers/messageFiltersController.js');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireUser);

// GET /api/message-filters - Get all filters
router.get('/', getAllFilters);

// GET /api/message-filters/:id - Get filter by ID
router.get('/:id', getFilterById);

// GET /api/message-filters/group/:groupId - Get filters by group
router.get('/group/:groupId', getFiltersByGroup);

// POST /api/message-filters - Create new filter
router.post('/', createFilter);

// PUT /api/message-filters/:id - Update filter
router.put('/:id', updateFilter);

// DELETE /api/message-filters/:id - Delete filter
router.delete('/:id', deleteFilter);

module.exports = router; 