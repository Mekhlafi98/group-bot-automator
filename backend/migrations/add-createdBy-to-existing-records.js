const mongoose = require('mongoose');
const User = require('../models/User');
const TelegramGroup = require('../models/TelegramGroup');
const Workflow = require('../models/Workflow');
const MessageFilter = require('../models/MessageFilter');
const MessageLog = require('../models/MessageLog');
const Contact = require('../models/Contact');

async function migrateExistingRecords() {
    try {
        console.log('Starting migration to add createdBy field to existing records...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot-admin');

        // Get the first user (or create a default one if none exists)
        let defaultUser = await User.findOne();

        if (!defaultUser) {
            console.log('No users found. Creating a default user...');
            defaultUser = new User({
                email: 'admin@example.com',
                password: '$2b$10$defaultpassword', // This should be changed after migration
                isActive: true
            });
            await defaultUser.save();
            console.log('Default user created with ID:', defaultUser._id);
        }

        const userId = defaultUser._id;
        console.log('Using user ID for migration:', userId);

        // Update Telegram Groups
        const telegramGroupsResult = await TelegramGroup.updateMany(
            { createdBy: { $exists: false } },
            { $set: { createdBy: userId } }
        );
        console.log(`Updated ${telegramGroupsResult.modifiedCount} Telegram Groups`);

        // Update Workflows
        const workflowsResult = await Workflow.updateMany(
            { createdBy: { $exists: false } },
            { createdBy: userId }
        );
        console.log(`Updated ${workflowsResult.modifiedCount} Workflows`);

        // Update Message Filters
        const messageFiltersResult = await MessageFilter.updateMany(
            { createdBy: { $exists: false } },
            { $set: { createdBy: userId } }
        );
        console.log(`Updated ${messageFiltersResult.modifiedCount} Message Filters`);

        // Update Message Logs
        const messageLogsResult = await MessageLog.updateMany(
            { createdBy: { $exists: false } },
            { $set: { createdBy: userId } }
        );
        console.log(`Updated ${messageLogsResult.modifiedCount} Message Logs`);

        // Update Contacts
        const contactsResult = await Contact.updateMany(
            { createdBy: { $exists: false } },
            { $set: { createdBy: userId } }
        );
        console.log(`Updated ${contactsResult.modifiedCount} Contacts`);

        console.log('Migration completed successfully!');
        console.log('Summary:');
        console.log(`- Telegram Groups: ${telegramGroupsResult.modifiedCount}`);
        console.log(`- Workflows: ${workflowsResult.modifiedCount}`);
        console.log(`- Message Filters: ${messageFiltersResult.modifiedCount}`);
        console.log(`- Message Logs: ${messageLogsResult.modifiedCount}`);
        console.log(`- Contacts: ${contactsResult.modifiedCount}`);

        if (!defaultUser.email.includes('example.com')) {
            console.log('\n⚠️  IMPORTANT: Please change the default user password after migration!');
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateExistingRecords();
}

module.exports = migrateExistingRecords;