const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testIdentifyEndpoint() {
  console.log('🧪 Testing Bitespeed Identity Reconciliation Service\n');

  try {
    // Test 1: Create first contact (lorraine@hillvalley.edu & 123456)
    console.log('📝 Test 1: Creating first contact...');
    const response1 = await axios.post(`${BASE_URL}/identify`, {
      email: 'lorraine@hillvalley.edu',
      phoneNumber: '123456'
    });
    console.log('✅ Response:', JSON.stringify(response1.data, null, 2));
    console.log('');

    // Test 2: Create second contact with same phone (mcfly@hillvalley.edu & 123456)
    console.log('📝 Test 2: Creating second contact with same phone...');
    const response2 = await axios.post(`${BASE_URL}/identify`, {
      email: 'mcfly@hillvalley.edu',
      phoneNumber: '123456'
    });
    console.log('✅ Response:', JSON.stringify(response2.data, null, 2));
    console.log('');

    // Test 3: Query with email only
    console.log('📝 Test 3: Querying with email only...');
    const response3 = await axios.post(`${BASE_URL}/identify`, {
      email: 'lorraine@hillvalley.edu',
      phoneNumber: null
    });
    console.log('✅ Response:', JSON.stringify(response3.data, null, 2));
    console.log('');

    // Test 4: Query with phone only
    console.log('📝 Test 4: Querying with phone only...');
    const response4 = await axios.post(`${BASE_URL}/identify`, {
      email: null,
      phoneNumber: '123456'
    });
    console.log('✅ Response:', JSON.stringify(response4.data, null, 2));
    console.log('');

    // Test 5: Create separate contact groups and then merge them
    console.log('📝 Test 5: Creating separate contact groups...');
    const response5a = await axios.post(`${BASE_URL}/identify`, {
      email: 'george@hillvalley.edu',
      phoneNumber: '919191'
    });
    console.log('✅ Group A created:', JSON.stringify(response5a.data, null, 2));

    const response5b = await axios.post(`${BASE_URL}/identify`, {
      email: 'biffsucks@hillvalley.edu',
      phoneNumber: '717171'
    });
    console.log('✅ Group B created:', JSON.stringify(response5b.data, null, 2));

    // Test 6: Merge the groups
    console.log('📝 Test 6: Merging contact groups...');
    const response6 = await axios.post(`${BASE_URL}/identify`, {
      email: 'george@hillvalley.edu',
      phoneNumber: '717171'
    });
    console.log('✅ Groups merged:', JSON.stringify(response6.data, null, 2));
    console.log('');

    // Test 7: Health check
    console.log('📝 Test 7: Health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', JSON.stringify(healthResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testIdentifyEndpoint();
}

module.exports = { testIdentifyEndpoint }; 