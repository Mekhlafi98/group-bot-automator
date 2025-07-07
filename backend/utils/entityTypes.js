// Utility to get available entity types dynamically
const getAvailableEntityTypes = () => {
    return [
        {
            value: 'all',
            label: 'All Entities',
            description: 'Trigger for all entity types',
            icon: 'globe'
        },
        {
            value: 'telegram-group',
            label: 'Telegram Groups',
            description: 'Trigger for Telegram group operations',
            icon: 'users'
        },
        {
            value: 'contact',
            label: 'Contacts',
            description: 'Trigger for contact operations',
            icon: 'user'
        },
        {
            value: 'workflow',
            label: 'Workflows',
            description: 'Automation workflows'
        },
        {
            value: 'message-filter',
            label: 'Message Filters',
            description: 'Trigger for filter operations',
            icon: 'filter'
        },
        {
            value: 'message-log',
            label: 'Message Logs',
            description: 'Trigger for log operations',
            icon: 'history'
        },
        {
            value: 'webhook',
            label: 'Webhooks',
            description: 'Trigger for webhook operations',
            icon: 'webhook'
        }
    ];
};

// Get entity type info by value
const getEntityTypeInfo = (value) => {
    const entityTypes = getAvailableEntityTypes();
    return entityTypes.find(type => type.value === value) || {
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' '),
        description: `Trigger for ${value} operations`,
        icon: 'settings'
    };
};

// Get entity model name by entity type
const getEntityModelName = (entityType) => {
    const modelMap = {
        'telegram-group': 'TelegramGroup',
        'contact': 'Contact',
        'workflow': 'Workflow',
        'message-filter': 'MessageFilter',
        'message-log': 'MessageLog',
        'webhook': 'Webhook'
    };
    return modelMap[entityType] || null;
};

module.exports = {
    getAvailableEntityTypes,
    getEntityTypeInfo,
    getEntityModelName
}; 