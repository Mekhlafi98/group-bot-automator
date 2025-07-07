const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const { createAction, listActions, executeAction } = require('../controllers/actionsController');

router.use(requireUser);
router.post('/', createAction);
router.get('/', listActions);
router.post('/:id/execute', executeAction);

module.exports = router; 