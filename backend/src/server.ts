const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require(path.join(__dirname, '../routes/authRoutes.js'));
const telegramGroupsRoutes = require(path.join(__dirname, '../routes/telegramGroupsRoutes.js'));
const workflowsRoutes = require(path.join(__dirname, '../routes/workflowsRoutes.js'));
const messageFiltersRoutes = require(path.join(__dirname, '../routes/messageFiltersRoutes.js'));
const messageLogsRoutes = require(path.join(__dirname, '../routes/messageLogsRoutes.js'));
const contactsRoutes = require(path.join(__dirname, '../routes/contacts.js'));
const webhookRoutes = require(path.join(__dirname, '../routes/webhookRoutes.js'));

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// API routes
app.use('/api/telegram-groups', telegramGroupsRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/message-filters', messageFiltersRoutes);
app.use('/api/message-logs', messageLogsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/tokens', require('../routes/tokenRoutes'));

// In-memory store for webhook info
let webhookInfo: any = null;

// GET /api/webhook - fetch webhook info
app.get('/api/webhook', (req: any, res: any) => {
    if (!webhookInfo) {
        return res.status(404).json({ message: 'Webhook not configured' });
    }
    res.json(webhookInfo);
});

// POST /api/webhook - set webhook
app.post('/api/webhook', (req: any, res: any) => {
    const { url, has_custom_certificate, max_connections, allowed_updates } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'Missing webhook URL' });
    }
    webhookInfo = {
        url,
        has_custom_certificate: !!has_custom_certificate,
        pending_update_count: 0,
        max_connections: max_connections || 40,
        allowed_updates: allowed_updates || ['message', 'edited_message'],
    };
    res.json({ success: true });
});

// DELETE /api/webhook - delete webhook
app.delete('/api/webhook', (req: any, res: any) => {
    webhookInfo = null;
    res.json({ success: true });
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/group-bot').then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
        console.log(`Backend listening at http://localhost:${port}`);
    });
}).catch((err: any) => {
    console.error('MongoDB connection error:', err);
}); 