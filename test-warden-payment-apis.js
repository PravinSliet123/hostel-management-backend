// Test script for Warden Payment APIs
// This script demonstrates how to use the warden payment status endpoints

const BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}:`, response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---');
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.message);
    return { status: 'ERROR', data: null };
  }
}

// Test scenarios for warden payment APIs
async function testWardenPaymentAPIs() {
  console.log('🚀 Testing Warden Payment APIs\n');

  // Note: You'll need to replace these with actual tokens from your database
  const wardenToken = 'your-warden-jwt-token';
  const hostelId = 1; // Replace with actual hostel ID

  // 1. Get payment summary for all assigned hostels
  console.log('1. Getting payment summary for all assigned hostels...');
  await makeRequest('/warden/payment-summary', 'GET', null, wardenToken);

  // 2. Get all student payments from all assigned hostels
  console.log('2. Getting all student payments from assigned hostels...');
  await makeRequest('/warden/student-payments', 'GET', null, wardenToken);

  // 3. Get student payments for a specific hostel
  console.log('3. Getting student payments for specific hostel...');
  await makeRequest(`/warden/hostels/${hostelId}/student-payments`, 'GET', null, wardenToken);

  // 4. Get warden's assigned hostels
  console.log('4. Getting warden\'s assigned hostels...');
  await makeRequest('/warden/hostels', 'GET', null, wardenToken);

  // 5. Get rooms in assigned hostels
  console.log('5. Getting rooms in assigned hostels...');
  await makeRequest('/warden/rooms', 'GET', null, wardenToken);

  console.log('✅ All payment API tests completed!');
}

// Example usage with actual data
async function exampleWithRealData() {
  console.log('📋 Example: Complete warden payment workflow\n');

  const wardenToken = 'your-warden-jwt-token';

  // Step 1: Get warden's profile and assigned hostels
  console.log('Step 1: Getting warden profile...');
  const profileResponse = await makeRequest('/warden/profile', 'GET', null, wardenToken);

  // Step 2: Get payment summary
  console.log('Step 2: Getting payment summary...');
  const summaryResponse = await makeRequest('/warden/payment-summary', 'GET', null, wardenToken);

  // Step 3: Get assigned hostels
  console.log('Step 3: Getting assigned hostels...');
  const hostelsResponse = await makeRequest('/warden/hostels', 'GET', null, wardenToken);

  // Step 4: For each hostel, get detailed student payment information
  if (hostelsResponse.data && hostelsResponse.data.length > 0) {
    console.log('Step 4: Getting detailed payment info for each hostel...');
    
    for (const hostel of hostelsResponse.data) {
      console.log(`\n--- Hostel: ${hostel.name} ---`);
      await makeRequest(`/warden/hostels/${hostel.id}/student-payments`, 'GET', null, wardenToken);
    }
  }

  // Step 5: Get all student payments (combined view)
  console.log('Step 5: Getting all student payments...');
  await makeRequest('/warden/student-payments', 'GET', null, wardenToken);

  console.log('✅ Example workflow completed!');
}

// Test specific scenarios
async function testSpecificScenarios() {
  console.log('🔍 Testing Specific Scenarios\n');

  const wardenToken = 'your-warden-jwt-token';

  // Scenario 1: Warden with no assigned hostels
  console.log('Scenario 1: Warden with no assigned hostels...');
  // This would return a 404 error as expected

  // Scenario 2: Warden accessing unauthorized hostel
  console.log('Scenario 2: Warden accessing unauthorized hostel...');
  await makeRequest('/warden/hostels/999/student-payments', 'GET', null, wardenToken);
  // This should return a 403 error

  // Scenario 3: Invalid hostel ID
  console.log('Scenario 3: Invalid hostel ID...');
  await makeRequest('/warden/hostels/invalid/student-payments', 'GET', null, wardenToken);
  // This should return a 400 or 500 error

  console.log('✅ Specific scenarios completed!');
}

// Documentation of API endpoints
function showAPIDocumentation() {
  console.log('📚 Warden Payment API Documentation\n');

  console.log('Available Endpoints:');
  console.log('1. GET /warden/payment-summary');
  console.log('   - Returns payment summary statistics for all assigned hostels');
  console.log('   - Includes total amounts, student counts, and breakdown by hostel');
  console.log('   - Requires: Warden authentication');
  console.log('   - Response: Summary statistics and hostel-wise breakdown\n');

  console.log('2. GET /warden/student-payments');
  console.log('   - Returns all students with payment details from all assigned hostels');
  console.log('   - Includes student info, room allocation, and payment history');
  console.log('   - Requires: Warden authentication');
  console.log('   - Response: Array of students with payment information\n');

  console.log('3. GET /warden/hostels/:hostelId/student-payments');
  console.log('   - Returns students with payment details for a specific hostel');
  console.log('   - Includes hostel-specific summary and detailed student data');
  console.log('   - Requires: Warden authentication + hostel assignment');
  console.log('   - Response: Hostel info, summary, and student payment details\n');

  console.log('4. GET /warden/hostels');
  console.log('   - Returns all hostels assigned to the warden');
  console.log('   - Requires: Warden authentication');
  console.log('   - Response: Array of assigned hostels\n');

  console.log('5. GET /warden/rooms');
  console.log('   - Returns all rooms in assigned hostels with student allocations');
  console.log('   - Requires: Warden authentication');
  console.log('   - Response: Array of rooms with student information\n');

  console.log('Error Responses:');
  console.log('- 401: Unauthorized (invalid/missing token)');
  console.log('- 403: Forbidden (not assigned to hostel)');
  console.log('- 404: Not found (no hostels assigned)');
  console.log('- 500: Internal server error\n');

  console.log('Authentication:');
  console.log('- All endpoints require a valid JWT token in Authorization header');
  console.log('- Token must be for a user with WARDEN role');
  console.log('- Format: Authorization: Bearer <token>\n');
}

// Run tests
if (require.main === module) {
  // Show documentation first
  showAPIDocumentation();
  
  // Uncomment the function you want to run:
  // testWardenPaymentAPIs();
  // exampleWithRealData();
  // testSpecificScenarios();
  
  console.log('To run the tests:');
  console.log('1. Update the wardenToken with a valid JWT token for a warden user');
  console.log('2. Update hostelId with actual hostel ID from your database');
  console.log('3. Uncomment the function call you want to test');
  console.log('4. Run: node test-warden-payment-apis.js');
  console.log('5. Make sure your server is running on http://localhost:3000');
}

module.exports = {
  testWardenPaymentAPIs,
  exampleWithRealData,
  testSpecificScenarios,
  showAPIDocumentation,
  makeRequest
}; 