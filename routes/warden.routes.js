import express from "express"
import {
  getProfile,
  updateProfile,
  getRooms,
  updateRoom,
  getStudentPayments,
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

export default router
