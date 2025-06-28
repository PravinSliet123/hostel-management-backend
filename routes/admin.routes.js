import express from "express"
import {
  getAllHostels,
  createHostel,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllWardens,
  getPendingWardens,
  approveWarden,
  deleteWarden,
  createWarden,
  updateWarden,
  getWarden,
  getAllStudents,
  createAdmin,
  createPayment,
  deleteHostel,
  updateHostel,
  removeWardenFromHostel,
  removeStudentFromHostel,
  allocateHostelsBulk,
  deallocateStudentRoom,
  deleteStudent,
  allocateRoom,
  getStudent,
  getHostel,
} from "../controllers/admin.controller.js"
import { checkRole } from "../middleware/auth.middleware.js"
import { validateRegisterWarden, validateUpdateWarden } from "../middleware/validation.middleware.js"

const router = express.Router()

// Apply middleware to check if user is an admin
router.use(checkRole("ADMIN"))

// Admin routes
router.get("/hostels", getAllHostels)
router.get("/hostels/:hostelId", getHostel)
router.post("/hostels", createHostel)
router.put("/hostels/:hostelId", updateHostel)
router.delete("/hostels/:hostelId", deleteHostel)
router.delete("/hostels/:hostelId/wardens/:wardenId", removeWardenFromHostel)
router.delete("/students/:studentId/hostel", removeStudentFromHostel)
router.post("/rooms", createRoom)
router.put("/rooms/:roomId", updateRoom)
router.delete("/rooms/:roomId", deleteRoom)
router.get("/wardens", getAllWardens)
router.get("/wardens/:wardenId", getWarden)
router.post("/wardens", validateRegisterWarden, createWarden)
router.put("/wardens/:wardenId", validateUpdateWarden, updateWarden)
router.put("/wardens/:wardenId/approve", approveWarden)
router.delete("/wardens/:wardenId", deleteWarden)
router.get("/students", getAllStudents)
router.get("/students/:studentId", getStudent)
router.delete("/students/:studentId", deleteStudent)
router.post("/create-admin", createAdmin)
router.post("/payments", createPayment)
router.post("/hostels/allocate", allocateHostelsBulk)
router.delete("/students/:studentId/room", deallocateStudentRoom)
router.post("/students/allocate-room", allocateRoom)

export default router
