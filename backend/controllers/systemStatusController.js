const SystemStatus = require('../models/SystemStatus');
const fetch = require('node-fetch');

// Helper to check a URL and update status
async function checkStatus(item) {
    const start = Date.now();
    let status = 'down';
    let responseTime = null;
    try {
        const res = await fetch(item.url, { timeout: 5000 });
        responseTime = Date.now() - start;
        if (res.status >= 200 && res.status < 300) {
            status = 'operational';
        } else if (res.status >= 400 && res.status < 600) {
            status = 'down';
        }
    } catch (e) {
        status = 'degraded';
    }
    item.status = status;
    item.lastChecked = new Date();
    item.lastResponseTime = responseTime;
    await item.save();
    return item;
}

exports.list = async (req, res) => {
    const items = await SystemStatus.find();
    // Optionally check all URLs on list
    await Promise.all(items.map(checkStatus));
    res.json(await SystemStatus.find());
};

exports.create = async (req, res) => {
    const item = new SystemStatus(req.body);
    await item.save();
    await checkStatus(item);
    res.json(item);
};

exports.update = async (req, res) => {
    const item = await SystemStatus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    await checkStatus(item);
    res.json(item);
};

exports.delete = async (req, res) => {
    await SystemStatus.findByIdAndDelete(req.params.id);
    res.json({ success: true });
};

exports.check = async (req, res) => {
    const item = await SystemStatus.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await checkStatus(item);
    res.json(item);
}; 