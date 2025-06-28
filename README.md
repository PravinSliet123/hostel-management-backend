# Hostel Management System Backend

A Node.js backend for a Hostel Management System designed for colleges to streamline the process of hostel registration, room allocation, and administration.

## Features

- Student Panel: Registration, login, hostel application, profile management, fee payment
- Warden Panel: Registration, room management, student payment tracking
- Admin Panel: Hostel management, warden approval, student records management
- Automated seat allotment based on distance from college and rank

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- MySQL Database
- JWT Authentication
- Express Validator
- Nodemailer

## Project Structure

\`\`\`
hostel-management-system/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Business logic
│   ├── middleware/         # Middleware functions
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── index.js            # Entry point
├── .env.example            # Example environment variables
├── package.json            # Project dependencies
└── README.md               # Project documentation
\`\`\`

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Copy `.env.example` to `.env` and update the variables
4. Generate Prisma client:
   \`\`\`
   npm run prisma:generate
   \`\`\`
5. Run database migrations:
   \`\`\`
   npm run prisma:migrate
   \`\`\`
6. Start the server:
   \`\`\`
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register/student` - Register a new student
- `POST /api/auth/register/warden` - Register a new warden
- `POST /api/auth/login` - Login user

### Student Routes
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile
- `POST /api/students/apply-hostel` - Apply for hostel
- `GET /api/students/payments` - Get payment status
- `POST /api/students/payments/:paymentId` - Make payment

### Warden Routes
- `GET /api/wardens/profile` - Get warden profile
- `PUT /api/wardens/profile` - Update warden profile
- `GET /api/wardens/rooms` - Get rooms in hostel
- `PUT /api/wardens/rooms/:roomId` - Update room details
- `GET /api/wardens/student-payments` - Get student payment status

### Admin Routes
- `GET /api/admin/hostels` - Get all hostels
- `POST /api/admin/hostels` - Create hostel
- `POST /api/admin/rooms` - Create room
- `GET /api/admin/wardens` - Get all wardens
- `GET /api/admin/wardens/:wardenId` - Get single warden details
- `POST /api/admin/wardens` - Create warden (with auto-generated password)
- `PUT /api/admin/wardens/:wardenId` - Update warden details
- `GET /api/admin/wardens/pending` - Get pending warden registrations
- `PUT /api/admin/wardens/:wardenId/approve` - Approve warden
- `DELETE /api/admin/wardens/:wardenId/reject` - Reject warden
- `GET /api/admin/students` - Get all students
- `POST /api/admin/admin` - Create admin
- `POST /api/admin/payments` - Create payment for student

### Payment Routes
- `GET /api/payments` - Get all payments for a user
- `POST /api/payments/:paymentId` - Make a payment

## API Documentation

### Create Warden (Admin Only)

**Endpoint:** `POST /api/admin/wardens`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "warden@example.com",
  "fullName": "John Doe",
  "fatherName": "Robert Doe",
  "mobileNo": "9876543210",
  "aadharNo": "123456789012",
  "address": "123 Main Street, City, State",
  "zipCode": "123456"
}
```

**Response:**
```json
{
  "message": "Warden created successfully",
  "warden": {
    "id": 1,
    "fullName": "John Doe",
    "email": "warden@example.com",
    "isApproved": true
  }
}
```

**Features:**
- Automatically generates a secure random password
- Sends welcome email with login credentials
- Auto-approves the warden account
- Validates all required fields
- Checks for duplicate email addresses
- Uses database transactions for data integrity

### Get Warden Details (Admin Only)

**Endpoint:** `GET /api/admin/wardens/:wardenId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Warden details fetched successfully",
  "warden": {
    "id": 1,
    "fullName": "John Doe",
    "fatherName": "Robert Doe",
    "mobileNo": "9876543210",
    "aadharNo": "123456789012",
    "address": "123 Main Street, City, State",
    "zipCode": "123456",
    "isApproved": true,
    "email": "warden@example.com",
    "hostels": [
      {
        "id": 1,
        "name": "Boys Hostel A",
        "type": "BOYS"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Warden (Admin Only)

**Endpoint:** `PUT /api/admin/wardens/:wardenId`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "fatherName": "Robert Doe",
  "mobileNo": "9876543210",
  "aadharNo": "123456789012",
  "address": "456 New Street, City, State",
  "zipCode": "654321",
  "isApproved": true
}
```

**Response:**
```json
{
  "message": "Warden updated successfully",
  "warden": {
    "id": 1,
    "fullName": "John Doe Updated",
    "fatherName": "Robert Doe",
    "mobileNo": "9876543210",
    "aadharNo": "123456789012",
    "address": "456 New Street, City, State",
    "zipCode": "654321",
    "isApproved": true,
    "email": "warden@example.com"
  }
}
```

**Features:**
- Updates all warden profile fields
- Optionally updates approval status
- Validates all required fields
- Returns updated warden information
- Includes email in response for reference
