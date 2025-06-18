import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { PrismaClient } from "@prisma/client"
import authRoutes from "./routes/auth.routes.js"
import studentRoutes from "./routes/student.routes.js"
import wardenRoutes from "./routes/warden.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import { errorHandler } from "./middleware/error.middleware.js"
import { authenticateToken } from "./middleware/auth.middleware.js"
import 'dotenv/config'
// Create Express app
const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(helmet())
app.use(morgan("dev"))
app.use(express.json())

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/students", authenticateToken, studentRoutes)
app.use("/api/wardens", authenticateToken, wardenRoutes)
app.use("/api/admin", authenticateToken, adminRoutes)
app.use("/api/payments", authenticateToken, paymentRoutes)

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
