/**
 * Process webhook payload template with event data
 * @param {string} template - The payload template string
 * @param {Object} data - The event data to inject
 * @returns {Object} - Processed payload object
 */
function processPayloadTemplate(template, data) {
    try {
        // Replace {{data}} placeholder with the actual data
        let processedTemplate = template.replace(/\{\{data\}\}/g, JSON.stringify(data));

        // Try to parse as JSON
        return JSON.parse(processedTemplate);
    } catch (error) {
        console.error('Error processing payload template:', error);
        // Fallback to simple data object
        return { data };
    }
}

/**
 * Convert Mongoose Map to plain object
 * @param {Map} map - Mongoose Map object
 * @returns {Object} - Plain object
 */
function mapToObject(map) {
    if (!map || typeof map !== 'object') {
        return {};
    }

    // If it's already a plain object, return it
    if (!(map instanceof Map)) {
        return map;
    }

    // Convert Map to plain object
    const obj = {};
    for (const [key, value] of map.entries()) {
        obj[key] = value;
    }
    return obj;
}

/**
 * Send webhook request with proper method and payload
 * @param {Object} webhook - Webhook configuration
 * @param {Object} eventData - Event data to send
 */
async function sendWebhook(webhook, eventData) {
    try {
        const payload = processPayloadTemplate(webhook.payload || '{{data}}', eventData);

        // Convert headers Map to plain object
        const headers = mapToObject(webhook.headers);

        const requestOptions = {
            method: webhook.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        // Only add body for methods that support it
        if (['POST', 'PUT', 'PATCH'].includes(webhook.method)) {
            requestOptions.body = JSON.stringify(payload);
        }

        const response = await fetch(webhook.url, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
            success: true,
            status: response.status,
            data: await response.text()
        };
    } catch (error) {
        console.error('Webhook delivery failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    processPayloadTemplate,
    sendWebhook,
    mapToObject
}; 