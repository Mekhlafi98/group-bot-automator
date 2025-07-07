const Contact = require('../models/Contact');

// Get all contacts for current user
async function getAllContacts(req, res) {
    try {
        const { page = 1, limit = 20, search, isActive, isBlocked } = req.query;
        const skip = (page - 1) * limit;
        
        const filter = { createdBy: req.user._id };
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { number: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

        const contacts = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(filter);

        res.status(200).json({
            contacts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get contact by ID (only if created by current user)
async function getContactById(req, res) {
    try {
        const { id } = req.params;
        const contact = await Contact.findOne({ 
            _id: id, 
            createdBy: req.user._id 
        });

        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.status(200).json(contact);
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create new contact
async function createContact(req, res) {
    try {
        const { name, number, isActive, isBlocked, notes } = req.body;

        if (!name || !number) {
            return res.status(400).json({ message: 'Name and number are required' });
        }

        // Check if contact already exists for this user
        const existingContact = await Contact.findOne({ 
            number, 
            createdBy: req.user._id 
        });
        if (existingContact) {
            return res.status(409).json({ message: 'Contact with this number already exists' });
        }

        const contact = new Contact({
            name,
            number,
            isActive: isActive !== undefined ? isActive : true,
            isBlocked: isBlocked !== undefined ? isBlocked : false,
            notes,
            createdBy: req.user._id,
        });

        await contact.save();
        res.status(201).json(contact);
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update contact (only if created by current user)
async function updateContact(req, res) {
    try {
        const { id } = req.params;
        const { name, number, isActive, isBlocked, notes } = req.body;

        const contact = await Contact.findOne({ 
            _id: id, 
            createdBy: req.user._id 
        });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // If updating number, check if it already exists for this user
        if (number && number !== contact.number) {
            const existingContact = await Contact.findOne({ 
                number, 
                createdBy: req.user._id 
            });
            if (existingContact) {
                return res.status(409).json({ message: 'Contact with this number already exists' });
            }
        }

        if (name !== undefined) contact.name = name;
        if (number !== undefined) contact.number = number;
        if (isActive !== undefined) contact.isActive = isActive;
        if (isBlocked !== undefined) contact.isBlocked = isBlocked;
        if (notes !== undefined) contact.notes = notes;

        await contact.save();
        res.status(200).json(contact);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete contact (only if created by current user)
async function deleteContact(req, res) {
    try {
        const { id } = req.params;

        const contact = await Contact.findOne({ 
            _id: id, 
            createdBy: req.user._id 
        });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        await Contact.findByIdAndDelete(id);
        res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Toggle contact status (only if created by current user)
async function toggleContactStatus(req, res) {
    try {
        const { id } = req.params;
        const { field } = req.body; // 'isActive' or 'isBlocked'

        if (!['isActive', 'isBlocked'].includes(field)) {
            return res.status(400).json({ message: 'Invalid field. Must be isActive or isBlocked' });
        }

        const contact = await Contact.findOne({ 
            _id: id, 
            createdBy: req.user._id 
        });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        contact[field] = !contact[field];
        await contact.save();

        res.status(200).json(contact);
    } catch (error) {
        console.error('Error toggling contact status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Search contacts (only for current user)
async function searchContacts(req, res) {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const contacts = await Contact.find({
            createdBy: req.user._id,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { number: { $regex: q, $options: 'i' } }
            ]
        }).limit(10);

        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error searching contacts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    toggleContactStatus,
    searchContacts,
}; 