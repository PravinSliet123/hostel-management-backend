import express from "express"
import {
  getProfile,
  updateProfile,
  getRooms,
  updateRoom,
  getStudentPayments,
  getStudentPaymentsByHostel,
  getPaymentSummary,
  getHostels,
  getHostelRooms,
  getHostelDetails,
  getRoomDetails,
} from "../controllers/warden.controller.js"
import { checkRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Apply middleware to check if user is a warden
router.use(checkRole("WARDEN"))

// Warden routes
router.get("/profile", getProfile)
router.put("/profile", updateProfile)
router.get("/rooms", getRooms)
router.put("/rooms/:roomId", updateRoom)
router.get("/student-payments", getStudentPayments)
router.get("/hostels/:hostelId/student-payments", getStudentPaymentsByHostel)
router.get("/payment-summary", getPaymentSummary)

// Hostel management routes
router.get("/hostels", getHostels)
router.get("/hostels/:hostelId", getHostelDetails)
router.get("/hostels/:hostelId/rooms", getHostelRooms)
router.get("/rooms/:roomId", getRoomDetails)

export default router
