const express = require('express');
const router = express.Router();
const MessageLog = require('../models/MessageLog');

// Get all Logs
router.get('/', async (req, res) => {
    try {
        const logs = await MessageLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Logs statistics
router.get('/stats', async (req, res) => {
    try {
        const totalMessages = await MessageLog.countDocuments();
        const processedMessages = await MessageLog.countDocuments({ isProcessed: true });
        const filteredMessages = await MessageLog.countDocuments({ processingResult: 'filtered' });

        res.json({
            totalMessages,
            processedMessages,
            filteredMessages,
            pendingMessages: totalMessages - processedMessages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get message log by ID
router.get('/:id', async (req, res) => {
    try {
        const log = await MessageLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ message: 'Message log not found' });
        }
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new message log
router.post('/', async (req, res) => {
    try {
        const log = new MessageLog(req.body);
        const newLog = await log.save();
        res.status(201).json(newLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update message log
router.put('/:id', async (req, res) => {
    try {
        const log = await MessageLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!log) {
            return res.status(404).json({ message: 'Message log not found' });
        }
        res.json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete message log
router.delete('/:id', async (req, res) => {
    try {
        const log = await MessageLog.findByIdAndDelete(req.params.id);
        if (!log) {
            return res.status(404).json({ message: 'Message log not found' });
        }
        res.json({ message: 'Message log deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 