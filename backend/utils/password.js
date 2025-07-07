const bcrypt = require('bcryptjs');

async function generatePasswordHash(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function validatePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function isPasswordHash(hash) {
    // Simple check: bcrypt hashes start with $2
    return typeof hash === 'string' && hash.startsWith('$2');
}

module.exports = {
    generatePasswordHash,
    validatePassword,
    isPasswordHash,
}; 