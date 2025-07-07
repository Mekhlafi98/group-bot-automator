const mongoose = require('mongoose');

async function fixContactsIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/group-bot');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('contacts');

        // Drop the old simple unique index on number
        try {
            await collection.dropIndex('number_1');
            console.log('Dropped old unique index on number field');
        } catch (error) {
            if (error.code === 26) {
                console.log('Index number_1 does not exist, skipping...');
            } else {
                console.error('Error dropping index:', error);
            }
        }

        // Check if compound index already exists
        const indexes = await collection.listIndexes().toArray();
        const compoundIndexExists = indexes.some(index =>
            index.key && index.key.number === 1 && index.key.createdBy === 1 && index.unique
        );

        if (!compoundIndexExists) {
            // Create the compound unique index
            await collection.createIndex(
                { number: 1, createdBy: 1 },
                { unique: true, name: 'number_createdBy_unique' }
            );
            console.log('Created compound unique index on number + createdBy');
        } else {
            console.log('Compound unique index on number + createdBy already exists');
        }

        // Create other indexes if they don't exist
        const indexNames = indexes.map(index => index.name);

        if (!indexNames.includes('isActive_1')) {
            await collection.createIndex({ isActive: 1 });
            console.log('Created index on isActive');
        }

        if (!indexNames.includes('isBlocked_1')) {
            await collection.createIndex({ isBlocked: 1 });
            console.log('Created index on isBlocked');
        }

        if (!indexNames.includes('name_text')) {
            await collection.createIndex({ name: 'text' });
            console.log('Created text index on name');
        }

        if (!indexNames.includes('createdBy_1')) {
            await collection.createIndex({ createdBy: 1 });
            console.log('Created index on createdBy');
        }

        console.log('All indexes verified successfully');

        // List all indexes to verify
        const finalIndexes = await collection.listIndexes().toArray();
        console.log('Current indexes:');
        finalIndexes.forEach(index => {
            console.log(`- ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
        });

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixContactsIndexes(); 