const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const API_TOKEN = process.env.API_TOKEN || 'your-test-api-token-here';

const api = axios.create({
    baseURL: `${BASE_URL}/api/external`,
    headers: {
        'x-api-token': API_TOKEN,
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// Test utilities
const log = (message, data = null) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
    console.log('---');
};

const testEndpoint = async (name, method, url, data = null) => {
    try {
        log(`Testing ${name}...`);
        const response = await api.request({
            method,
            url,
            data
        });
        log(`✅ ${name} - Success`, {
            status: response.status,
            data: response.data
        });
        return true;
    } catch (error) {
        log(`❌ ${name} - Failed`, {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });
        return false;
    }
};

// Test without authentication
const testUnauthenticated = async () => {
    try {
        log('Testing unauthenticated request...');
        const response = await axios.get(`${BASE_URL}/api/external/health`);
        log('❌ Unauthenticated request should have failed but succeeded');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            log('✅ Unauthenticated request correctly rejected');
            return true;
        } else {
            log('❌ Unexpected error for unauthenticated request', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
            return false;
        }
    }
};

// Main test function
const runTests = async () => {
    log('🚀 Starting External API Tests');
    log(`Base URL: ${BASE_URL}`);
    log(`API Token: ${API_TOKEN.substring(0, 10)}...`);

    const results = [];

    // Test 1: Health check
    results.push(await testEndpoint('Health Check', 'GET', '/health'));

    // Test 2: Get contacts
    results.push(await testEndpoint('Get Contacts', 'GET', '/contacts'));

    // Test 3: Get workflows
    results.push(await testEndpoint('Get Workflows', 'GET', '/workflows'));

    // Test 4: Get groups
    results.push(await testEndpoint('Get Groups', 'GET', '/groups'));

    // Test 5: Get system status
    results.push(await testEndpoint('Get System Status', 'GET', '/system-status'));

    // Test 6: Get logs
    results.push(await testEndpoint('Get Logs', 'GET', '/logs'));

    // Test 7: Create contact
    const contactData = {
        name: 'Test Contact',
        phone: '+1234567890',
        email: 'test@example.com',
        group: 'Test Group'
    };
    results.push(await testEndpoint('Create Contact', 'POST', '/contacts', contactData));

    // Test 8: Unauthenticated request
    results.push(await testUnauthenticated());

    // Summary
    const passed = results.filter(Boolean).length;
    const total = results.length;
    
    log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        log('🎉 All tests passed! External API is working correctly.');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Please check the implementation.');
        process.exit(1);
    }
};

// Error handling
process.on('unhandledRejection', (error) => {
    log('❌ Unhandled promise rejection', error);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    runTests().catch((error) => {
        log('❌ Test runner failed', error);
        process.exit(1);
    });
}

module.exports = { runTests, testEndpoint }; 