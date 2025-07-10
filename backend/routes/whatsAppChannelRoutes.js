const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const controller = require('../controllers/whatsAppChannelController');

router.post('/', requireUser, controller.createChannel);
router.get('/', requireUser, controller.getChannels);
router.get('/:id', requireUser, controller.getChannel);
router.put('/:id', requireUser, controller.updateChannel);
router.delete('/:id', requireUser, controller.deleteChannel);

module.exports = router; 