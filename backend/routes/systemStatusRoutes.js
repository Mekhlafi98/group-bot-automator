const express = require('express');
const router = express.Router();
const controller = require('../controllers/systemStatusController');

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/:id/check', controller.check);

module.exports = router; 