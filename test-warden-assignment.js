// Test script for Warden-Hostel Assignment APIs
// This script demonstrates how to use the new warden-hostel assignment endpoints

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

// Test scenarios
async function testWardenHostelAssignments() {
  console.log('🚀 Testing Warden-Hostel Assignment APIs\n');

  // Note: You'll need to replace these with actual IDs from your database
  const adminToken = 'your-admin-jwt-token';
  const wardenId = 1;
  const hostelId = 2;

  // 1. Get all warden-hostel assignments
  console.log('1. Getting all warden-hostel assignments...');
  await makeRequest('/admin/warden-hostel/assignments', 'GET', null, adminToken);

  // 2. Assign a warden to a hostel
  console.log('2. Assigning warden to hostel...');
  await makeRequest('/admin/warden-hostel/assign', 'POST', {
    wardenId: wardenId,
    hostelId: hostelId
  }, adminToken);

  // 3. Get assignments for a specific warden
  console.log('3. Getting assignments for specific warden...');
  await makeRequest(`/admin/warden-hostel/warden/${wardenId}`, 'GET', null, adminToken);

  // 4. Get assignments for a specific hostel
  console.log('4. Getting assignments for specific hostel...');
  await makeRequest(`/admin/warden-hostel/hostel/${hostelId}`, 'GET', null, adminToken);

  // 5. Bulk assign wardens to hostels
  console.log('5. Bulk assigning wardens to hostels...');
  await makeRequest('/admin/warden-hostel/bulk-assign', 'POST', {
    assignments: [
      { wardenId: 1, hostelId: 2 },
      { wardenId: 2, hostelId: 1 },
      { wardenId: 1, hostelId: 3 }
    ]
  }, adminToken);

  // 6. Remove warden from hostel
  console.log('6. Removing warden from hostel...');
  await makeRequest(`/admin/hostels/${hostelId}/wardens/${wardenId}`, 'DELETE', null, adminToken);

  console.log('✅ All tests completed!');
}

// Example usage with actual data
async function exampleWithRealData() {
  console.log('📋 Example: Complete warden-hostel assignment workflow\n');

  const adminToken = 'your-admin-jwt-token';

  // Step 1: Create a warden (if not exists)
  console.log('Step 1: Creating a warden...');
  const wardenResponse = await makeRequest('/admin/wardens', 'POST', {
    email: 'warden@example.com',
    password: 'Warden123!',
    fullName: 'John Doe',
    fatherName: 'Mike Doe',
    mobileNo: '9876543210',
    aadharNo: '123456789012',
    address: '123 Warden Street',
    zipCode: '123456'
  }, adminToken);

  // Step 2: Create a hostel (if not exists)
  console.log('Step 2: Creating a hostel...');
  const hostelResponse = await makeRequest('/admin/hostels', 'POST', {
    name: 'New Hostel Block A',
    type: 'BOYS',
    totalRooms: 50,
    vacantRooms: 50
  }, adminToken);

  // Step 3: Approve the warden
  console.log('Step 3: Approving the warden...');
  if (wardenResponse.data?.id) {
    await makeRequest(`/admin/wardens/${wardenResponse.data.id}/approve`, 'PUT', null, adminToken);
  }

  // Step 4: Assign warden to hostel
  console.log('Step 4: Assigning warden to hostel...');
  if (wardenResponse.data?.id && hostelResponse.data?.id) {
    await makeRequest('/admin/warden-hostel/assign', 'POST', {
      wardenId: wardenResponse.data.id,
      hostelId: hostelResponse.data.id
    }, adminToken);
  }

  // Step 5: Verify assignment
  console.log('Step 5: Verifying assignment...');
  if (wardenResponse.data?.id) {
    await makeRequest(`/admin/warden-hostel/warden/${wardenResponse.data.id}`, 'GET', null, adminToken);
  }

  console.log('✅ Example workflow completed!');
}

// Run tests
if (require.main === module) {
  // Uncomment the function you want to run:
  // testWardenHostelAssignments();
  // exampleWithRealData();
  
  console.log('To run the tests:');
  console.log('1. Update the adminToken with a valid JWT token');
  console.log('2. Update wardenId and hostelId with actual IDs from your database');
  console.log('3. Uncomment the function call you want to test');
  console.log('4. Run: node test-warden-assignment.js');
}

module.exports = {
  testWardenHostelAssignments,
  exampleWithRealData,
  makeRequest
}; 