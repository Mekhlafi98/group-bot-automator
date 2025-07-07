const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const { sendBulkMessage } = require('../controllers/bulkMessagesController');

router.use(requireUser);
router.post('/', sendBulkMessage);

module.exports = router; 