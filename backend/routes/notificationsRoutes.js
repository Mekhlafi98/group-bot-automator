const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const { sendNotification } = require('../controllers/notificationsController');

router.use(requireUser);
router.post('/', sendNotification);

module.exports = router; 