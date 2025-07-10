const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const authRoutes = require(path.join(__dirname, '../routes/authRoutes.js'));
const telegramGroupsRoutes = require(path.join(__dirname, '../routes/telegramGroupsRoutes.js'));
const workflowsRoutes = require(path.join(__dirname, '../routes/workflowsRoutes.js'));
const messageFiltersRoutes = require(path.join(__dirname, '../routes/messageFiltersRoutes.js'));
const messageLogsRoutes = require(path.join(__dirname, '../routes/messageLogsRoutes.js'));
const contactsRoutes = require(path.join(__dirname, '../routes/contacts.js'));
const webhookRoutes = require(path.join(__dirname, '../routes/webhookRoutes.js'));
const bulkMessagesRoutes = require(path.join(__dirname, '../routes/bulkMessagesRoutes.js'));
const notificationsRoutes = require(path.join(__dirname, '../routes/notificationsRoutes.js'));
const actionsRoutes = require(path.join(__dirname, '../routes/actionsRoutes.js'));
const systemStatusRoutes = require('../routes/systemStatusRoutes');
const externalApiRoutes = require(path.join(__dirname, '../routes/externalApiRoutes.js'));
const whatsAppChannelRoutes = require(path.join(__dirname, '../routes/whatsAppChannelRoutes.js'));

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

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
app.use('/api/bulk-messages', bulkMessagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/system-status', systemStatusRoutes);
app.use('/api/channels', whatsAppChannelRoutes);

// External API routes (secure)
app.use('/api/external', externalApiRoutes);

// API Documentation route - serve static HTML file
app.get('/api/docs', (req: any, res: any) => {
    const docsPath = path.join(__dirname, '../public/api-docs.html');
    if (fs.existsSync(docsPath)) {
        res.sendFile(docsPath);
    } else {
        res.status(404).json({ error: 'Documentation file not found' });
    }
});

// API Documentation JSON endpoint
app.get('/api/docs/json', (req: any, res: any) => {
    try {
        const docsPath = path.join(__dirname, '../EXTERNAL_API_DOCUMENTATION.md');
        if (fs.existsSync(docsPath)) {
            const markdown = fs.readFileSync(docsPath, 'utf8');
            res.json({
                success: true,
                data: {
                    markdown: markdown,
                    lastUpdated: fs.statSync(docsPath).mtime.toISOString()
                }
            });
        } else {
            res.status(404).json({ error: 'Documentation file not found' });
        }
    } catch (error) {
        console.error('Error serving API documentation JSON:', error);
        res.status(500).json({ error: 'Failed to load documentation' });
    }
});

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
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/group-bot';
mongoose.connect(mongoUri).then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
        const host = process.env.HOST || '0.0.0.0';
        console.log(`Backend listening at http://${host}:${port}`);
        console.log(`API Documentation available at http://${host}:${port}/api/docs`);
    });
}).catch((err: any) => {
    console.error('MongoDB connection error:', err);
}); 