const mongoose = require('mongoose');

async function updateUniqueIndexes() {
    try {
        console.log('Starting migration to update unique indexes...');

        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot-admin';
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;

        // Drop old unique indexes and create new compound ones
        console.log('Updating Telegram Groups indexes...');
        try {
            await db.collection('telegramgroups').dropIndex('chatId_1');
        } catch (error) {
            console.log('chatId_1 index not found or already dropped');
        }

        console.log('Updating Workflows indexes...');
        try {
            await db.collection('workflows').dropIndex('workflowId_1');
        } catch (error) {
            console.log('workflowId_1 index not found or already dropped');
        }

        console.log('Updating Contacts indexes...');
        try {
            await db.collection('contacts').dropIndex('number_1');
        } catch (error) {
            console.log('number_1 index not found or already dropped');
        }

        // Create new compound unique indexes
        console.log('Creating new compound unique indexes...');

        // Telegram Groups: compound unique on chatId + createdBy
        await db.collection('telegramgroups').createIndex(
            { chatId: 1, createdBy: 1 },
            { unique: true, name: 'chatId_createdBy_unique' }
        );

        // Workflows: compound unique on workflowId + createdBy
        await db.collection('workflows').createIndex(
            { workflowId: 1, createdBy: 1 },
            { unique: true, name: 'workflowId_createdBy_unique' }
        );

        // Contacts: compound unique on number + createdBy
        await db.collection('contacts').createIndex(
            { number: 1, createdBy: 1 },
            { unique: true, name: 'number_createdBy_unique' }
        );

        console.log('Migration completed successfully!');
        console.log('New compound unique indexes created:');
        console.log('- telegramgroups: chatId + createdBy');
        console.log('- workflows: workflowId + createdBy');
        console.log('- contacts: number + createdBy');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    updateUniqueIndexes();
}

module.exports = updateUniqueIndexes; 