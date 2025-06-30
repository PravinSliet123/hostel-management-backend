# Warden Payment APIs Documentation

This document describes the APIs available for wardens to view student payment status in their assigned hostels.

## Overview

Wardens can access payment information for students in their assigned hostels through several API endpoints. The system supports:
- Viewing payment summary statistics
- Getting detailed student payment information
- Filtering by specific hostels
- Accessing room allocation details

## Authentication

All warden payment APIs require:
- Valid JWT token in the Authorization header
- User must have `WARDEN` role
- Format: `Authorization: Bearer <token>`

## API Endpoints

### 1. Get Payment Summary
**GET** `/api/warden/payment-summary`

Returns comprehensive payment statistics for all hostels assigned to the warden.

**Response:**
```json
{
  "message": "Payment summary retrieved successfully",
  "summary": {
    "totalStudents": 150,
    "totalPayments": 450,
    "totalAmount": 1500000,
    "paidAmount": 1200000,
    "pendingAmount": 250000,
    "overdueAmount": 50000,
    "studentsWithPendingPayments": 45,
    "studentsWithOverduePayments": 12,
    "fullyPaidStudents": 93,
    "paymentStatusBreakdown": {
      "paid": 300,
      "pending": 120,
      "overdue": 30
    }
  },
  "hostelStats": [
    {
      "hostelId": 1,
      "hostelName": "Boys Hostel A",
      "hostelType": "BOYS",
      "totalStudents": 75,
      "totalAmount": 750000,
      "paidAmount": 600000,
      "pendingAmount": 125000,
      "overdueAmount": 25000,
      "studentsWithPendingPayments": 22,
      "studentsWithOverduePayments": 6,
      "fullyPaidStudents": 47
    }
  ],
  "assignedHostels": [
    {
      "id": 1,
      "name": "Boys Hostel A",
      "type": "BOYS"
    }
  ]
}
```

### 2. Get All Student Payments
**GET** `/api/warden/student-payments`

Returns detailed payment information for all students in assigned hostels.

**Response:**
```json
{
  "message": "Student payment status retrieved successfully",
  "totalStudents": 150,
  "students": [
    {
      "id": 1,
      "fullName": "John Doe",
      "registrationNo": "2023001",
      "rollNo": "CS2023001",
      "department": "Computer Science",
      "year": 2,
      "semester": 3,
      "hostel": "Boys Hostel A",
      "roomNumber": "A-101",
      "payments": [
        {
          "id": 1,
          "amount": 50000,
          "description": "Hostel Fee - Semester 1",
          "status": "PAID",
          "dueDate": "2023-08-15T00:00:00.000Z",
          "paidAt": "2023-08-10T10:30:00.000Z",
          "createdAt": "2023-08-01T00:00:00.000Z"
        }
      ],
      "totalPayments": 3,
      "pendingPayments": 0,
      "paidPayments": 3,
      "overduePayments": 0
    }
  ]
}
```

### 3. Get Student Payments by Hostel
**GET** `/api/warden/hostels/:hostelId/student-payments`

Returns payment information for students in a specific hostel.

**Parameters:**
- `hostelId` (path parameter): ID of the hostel

**Response:**
```json
{
  "message": "Student payment status retrieved successfully",
  "hostel": {
    "id": 1,
    "name": "Boys Hostel A",
    "type": "BOYS"
  },
  "totalStudents": 75,
  "summary": {
    "totalAmount": 750000,
    "paidAmount": 600000,
    "pendingAmount": 125000,
    "overdueAmount": 25000,
    "studentsWithPendingPayments": 22,
    "studentsWithOverduePayments": 6,
    "fullyPaidStudents": 47
  },
  "students": [
    {
      "id": 1,
      "fullName": "John Doe",
      "registrationNo": "2023001",
      "rollNo": "CS2023001",
      "department": "Computer Science",
      "year": 2,
      "semester": 3,
      "roomNumber": "A-101",
      "payments": [...],
      "totalPayments": 3,
      "pendingPayments": 0,
      "paidPayments": 3,
      "overduePayments": 0,
      "totalAmount": 150000,
      "paidAmount": 150000,
      "pendingAmount": 0,
      "overdueAmount": 0
    }
  ]
}
```

### 4. Get Assigned Hostels
**GET** `/api/warden/hostels`

Returns all hostels assigned to the warden.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Boys Hostel A",
    "type": "BOYS",
    "totalRooms": 50,
    "vacantRooms": 5
  },
  {
    "id": 2,
    "name": "Girls Hostel B",
    "type": "GIRLS",
    "totalRooms": 40,
    "vacantRooms": 3
  }
]
```

### 5. Get Rooms in Assigned Hostels
**GET** `/api/warden/rooms`

Returns all rooms in assigned hostels with student allocation details.

**Response:**
```json
[
  {
    "id": 1,
    "roomNumber": "A-101",
    "roomType": "DOUBLE",
    "totalSeats": 2,
    "vacantSeats": 0,
    "hostelId": 1,
    "hostel": {
      "id": 1,
      "name": "Boys Hostel A",
      "type": "BOYS"
    },
    "allocations": [
      {
        "student": {
          "id": 1,
          "fullName": "John Doe",
          "registrationNo": "2023001",
          "rollNo": "CS2023001",
          "department": "Computer Science",
          "year": 2,
          "semester": 3
        }
      }
    ]
  }
]
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Access denied. Invalid token."
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to access this hostel"
}
```

### 404 Not Found
```json
{
  "message": "No hostels assigned to warden"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Get payment summary for dashboard
const getPaymentSummary = async (token) => {
  const response = await fetch('/api/warden/payment-summary', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get student payments for a specific hostel
const getStudentPaymentsByHostel = async (token, hostelId) => {
  const response = await fetch(`/api/warden/hostels/${hostelId}/student-payments`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get all student payments
const getAllStudentPayments = async (token) => {
  const response = await fetch('/api/warden/student-payments', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### Testing

Use the provided test file `test-warden-payment-apis.js` to test the APIs:

```bash
# Update the token in the test file
# Run the test
node test-warden-payment-apis.js
```

## Data Models

### Payment Status Enum
- `PENDING`: Payment is due but not paid
- `PAID`: Payment has been completed
- `OVERDUE`: Payment is past due date

### Hostel Types
- `BOYS`: Boys hostel
- `GIRLS`: Girls hostel

### Room Types
- `SINGLE`: Single occupancy room
- `DOUBLE`: Double occupancy room
- `TRIPLE`: Triple occupancy room

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Wardens can only access data for their assigned hostels
3. **Data Privacy**: Student personal information is protected
4. **Input Validation**: All parameters are validated before processing

## Performance Notes

1. **Pagination**: For large datasets, consider implementing pagination
2. **Caching**: Payment summary data can be cached for better performance
3. **Indexing**: Database indexes are in place for efficient queries
4. **Filtering**: APIs support filtering by hostel for better performance

## Recent Updates

- Fixed warden-hostel relationship handling (many-to-many)
- Added comprehensive payment summary statistics
- Enhanced student payment details with room allocation info
- Added hostel-specific payment views
- Improved error handling and validation 