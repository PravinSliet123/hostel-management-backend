import 'dotenv/config'
import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import authRoutes from "./routes/auth.routes.js"
import studentRoutes from "./routes/student.routes.js"
import wardenRoutes from "./routes/warden.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import pricingRoutes from "./routes/pricing.routes.js"
import { errorHandler } from "./middleware/error.middleware.js"
import { authenticateToken } from "./middleware/auth.middleware.js"
import bcrypt from "bcrypt"
import AWS from 'aws-sdk';
import prisma from "./config/db.js"
import multer from "multer";
import twilio from "twilio"

import { sendEMail } from "./utils/email.service.js"
// Create Express app

const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(helmet())
app.use(morgan("dev"))
app.use(express.json())


// AWS.config.update({
//   secretAccessKey: process.env.AWS_SECRET_KEY,
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   region: 'ap-south-1'
// })

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1"
})
async function uploadFileToS3(bucketName, fileName, fileBuffer, fileType) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: fileType
  };

  return s3.upload(params).promise()
}

app.post('/api/send-otp-phone', async (req, res) => {
  const { phone } = req.body;
  console.log('phone: ', phone);

  try {
    const verification = await twilioClient.verify
      .v2.services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: `+91${phone}`, channel: 'sms' });

    res.json({ status: verification.status });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send OTP');
  }
});
app.post('/api/verify-otp-phone', async (req, res) => {
  const { phone, code } = req.body;

  try {
    const verificationCheck = await twilioClient.verify
      .v2.services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: `+91${phone}`, code });

    res.json({ status: verificationCheck.status });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to verify OTP');
  }
});


app.post('/api/send-otp-email', async (req, res) => {
  const { email } = req.body;

  try {
    const verification = await twilioClient.verify
      .v2.services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: email, channel: 'email' });

    res.json({ status: verification.status });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send OTP');
  }
});



// app.post('/api/verify-otp-email', async (req, res) => {
//   const { email, code } = req.body;

//   try {
//     const verificationCheck = await twilioClient.verify
//       .v2.services(process.env.TWILIO_VERIFY_SID)
//       .verificationChecks.create({ to: phone, code });

//     res.json({ status: verificationCheck.status });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Failed to verify OTP');
//   }
// });
app.post("/api/upload-files", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    console.log("Check=>", file);
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }


    const result = await uploadFileToS3(
      process.env.AWS_S3_BUCKET_NAME || "hostel-gpb",
      file.originalname,
      file.buffer,
      file.mimetype
    );

    // Save `result.Location` in DB if needed

    res.status(200).json({
      message: "File uploaded successfully",
      url: result.Location,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Provide more specific error messages
    if (error.code === 'CredentialsError') {
      return res.status(500).json({
        error: "AWS credentials not configured properly. Please check your environment variables."
      });
    }

    if (error.code === 'NoSuchBucket') {
      return res.status(500).json({
        error: "S3 bucket not found. Please check your bucket name configuration."
      });
    }

    res.status(500).json({ error: "Failed to upload file", details: error.message });
  }
});
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Routes

app.get("/api/get-hostel-public", async (req, res) => {

  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        rooms: {}
      }
    })

    res.status(200).json(hostels)
  } catch (error) {
    console.error("Error fetching hostels:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})


app.post("/api/create-admin", async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
      })

      // Create admin profile
      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          fullName,
        },
      })

      return { user, admin }
    })

    // Send welcome email
    try {
      await sendEMail({
        to: email,
        subject: "Your Account Credentials",
        html: `
      <p>Hello ${fullName},</p>
      <p>Your account has been created. </br> Now you can login to system </p>
      <p><strong>Login Id:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
    `,
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError)
      // Continue with the response even if email fails
    }

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: result.admin.id,
        fullName: result.admin.fullName,
        email: result.user.email,
        password: password
      }
    })
  } catch (error) {
    console.error("Error creating admin:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})
app.use("/api/auth", authRoutes)
app.use("/api/students", authenticateToken, studentRoutes)
app.use("/api/wardens", authenticateToken, wardenRoutes)
app.use("/api/admin", authenticateToken, adminRoutes)
app.use("/api/payments", authenticateToken, paymentRoutes)
app.use("/api/pricing", authenticateToken, pricingRoutes)

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
