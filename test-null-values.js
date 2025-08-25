const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testNullValues() {
  console.log('🧪 Testing null value handling...\n');

  try {
    // Test 1: email null, phoneNumber provided
    console.log('📝 Test 1: email=null, phoneNumber="123456"');
    const response1 = await axios.post(`${BASE_URL}/identify`, {
      email: null,
      phoneNumber: "123456"
    });
    console.log('✅ Response:', JSON.stringify(response1.data, null, 2));
    console.log('');

    // Test 2: email provided, phoneNumber null
    console.log('📝 Test 2: email="test@example.com", phoneNumber=null');
    const response2 = await axios.post(`${BASE_URL}/identify`, {
      email: "test@example.com",
      phoneNumber: null
    });
    console.log('✅ Response:', JSON.stringify(response2.data, null, 2));
    console.log('');

    // Test 3: both null (should fail validation)
    console.log('📝 Test 3: email=null, phoneNumber=null (should fail)');
    try {
      const response3 = await axios.post(`${BASE_URL}/identify`, {
        email: null,
        phoneNumber: null
      });
      console.log('❌ Unexpected success:', JSON.stringify(response3.data, null, 2));
    } catch (error) {
      console.log('✅ Expected error:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: both undefined (should fail validation)
    console.log('📝 Test 4: email=undefined, phoneNumber=undefined (should fail)');
    try {
      const response4 = await axios.post(`${BASE_URL}/identify`, {});
      console.log('❌ Unexpected success:', JSON.stringify(response4.data, null, 2));
    } catch (error) {
      console.log('✅ Expected error:', error.response?.data?.error || error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testNullValues();
}

module.exports = { testNullValues }; 