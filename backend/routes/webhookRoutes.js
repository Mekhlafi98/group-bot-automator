const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth.js');
const {
    getEntityTypes,
    getAllWebhooks,
    getWebhookById,
    createWebhook,
    updateWebhook,
    deleteWebhook,
} = require('../controllers/webhookController');

router.use(requireUser);

router.get('/entity-types', getEntityTypes);
router.get('/', getAllWebhooks);
router.post('/', createWebhook);
router.get('/:id', getWebhookById);
router.put('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);

module.exports = router; 