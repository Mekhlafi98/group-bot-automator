const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

async function testEndpoints() {
    try {
        console.log('Testing backend endpoints...\n');

        // Test 1: Check if server is running
        console.log('1. Testing server connectivity...');
        try {
            const response = await axios.get(`${BASE_URL}/webhooks/entity-types`);
            console.log('✅ Server is running');
        } catch (error) {
            console.log('❌ Server is not running or has issues');
            console.log('Error:', error.message);
            return;
        }

        // Test 2: Check telegram groups endpoint
        console.log('\n2. Testing telegram groups endpoint...');
        try {
            const response = await axios.get(`${BASE_URL}/telegram-groups`);
            console.log(`✅ Telegram groups endpoint working - Found ${response.data.length} groups`);
            if (response.data.length > 0) {
                console.log('Sample group:', response.data[0]);
            }
        } catch (error) {
            console.log('❌ Telegram groups endpoint failed');
            console.log('Error:', error.response?.data || error.message);
        }

        // Test 3: Check workflows endpoint
        console.log('\n3. Testing workflows endpoint...');
        try {
            const response = await axios.get(`${BASE_URL}/workflows`);
            console.log(`✅ Workflows endpoint working - Found ${response.data.length} workflows`);
        } catch (error) {
            console.log('❌ Workflows endpoint failed');
        }

        // Test 4: Check contacts endpoint
        console.log('\n4. Testing contacts endpoint...');
        try {
            const response = await axios.get(`${BASE_URL}/contacts`);
            console.log(`✅ Contacts endpoint working - Found ${response.data.length} contacts`);
        } catch (error) {
            console.log('❌ Contacts endpoint failed');
            console.log('Error:', error.response?.data || error.message);
        }

        console.log('\n✅ All tests completed!');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testEndpoints(); 