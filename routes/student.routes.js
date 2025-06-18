import express from "express"
import {
  getProfile,
  updateProfile,
  applyForHostel,
  getPaymentStatus,
  makePayment,
} from "../controllers/student.controller.js"
import { checkRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Apply middleware to check if user is a student
router.use(checkRole("STUDENT"))

// Student routes
router.get("/profile", getProfile)
router.put("/profile", updateProfile)
router.post("/apply-hostel", applyForHostel)
router.get("/payments", getPaymentStatus)
router.post("/payments/:paymentId", makePayment)

export default router
