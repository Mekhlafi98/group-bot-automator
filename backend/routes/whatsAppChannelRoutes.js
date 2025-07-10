const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const controller = require('../controllers/whatsAppChannelController');

router.post('/channels', requireUser, controller.createChannel);
router.get('/channels', requireUser, controller.getChannels);
router.get('/channels/:id', requireUser, controller.getChannel);
router.put('/channels/:id', requireUser, controller.updateChannel);
router.delete('/channels/:id', requireUser, controller.deleteChannel);

module.exports = router; 