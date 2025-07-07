const express = require('express');
const { requireUser } = require('./middleware/auth');
const { listTokens, createToken, revokeToken } = require('../controllers/tokenController');

const router = express.Router();

router.use(requireUser);

router.get('/', listTokens);
router.post('/', createToken);
router.delete('/:id', revokeToken);

module.exports = router; 