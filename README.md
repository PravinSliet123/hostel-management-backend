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
- `GET /api/admin/wardens/pending` - Get pending warden registrations
- `PUT /api/admin/wardens/:wardenId/approve` - Approve warden
- `DELETE /api/admin/wardens/:wardenId/reject` - Reject warden
- `GET /api/admin/students` - Get all students
- `POST /api/admin/admin` - Create admin
- `POST /api/admin/payments` - Create payment for student

### Payment Routes
- `GET /api/payments` - Get all payments for a user
- `POST /api/payments/:paymentId` - Make a payment
