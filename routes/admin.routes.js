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
  getAllAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  assignWardenToHostel,
  getWardenHostelAssignments,
  getWardenAssignments,
  getHostelAssignments,
  bulkAssignWardensToHostels,
} from "../controllers/admin.controller.js"
import { checkRole } from "../middleware/auth.middleware.js"
import { 
  validateRegisterWarden, 
  validateUpdateWarden, 
  validateCreateAdmin, 
  validateUpdateAdmin,
  validateWardenHostelAssignment,
  validateBulkWardenHostelAssignment
} from "../middleware/validation.middleware.js"

const router = express.Router()

// Room management routes - accessible by both ADMIN and WARDEN (must be before global admin middleware)
router.post("/rooms", (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "WARDEN") {
    next()
  } else {
    res.status(403).json({ message: "Access denied" })
  }
}, createRoom)

router.put("/rooms/:roomId", (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "WARDEN") {
    next()
  } else {
    res.status(403).json({ message: "Access denied" })
  }
}, updateRoom)

router.delete("/rooms/:roomId", (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "WARDEN") {
    next()
  } else {
    res.status(403).json({ message: "Access denied" })
  }
}, deleteRoom)

// Student management routes - accessible by both ADMIN and WARDEN
router.get("/students", (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "WARDEN") {
    next()
  } else {
    res.status(403).json({ message: "Access denied" })
  }
}, getAllStudents)

router.get("/students/:studentId", (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "WARDEN") {
    next()
  } else {
    res.status(403).json({ message: "Access denied" })
  }
}, getStudent)

router.delete("/students/:studentId", (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "WARDEN") {
    next()
  } else {
    res.status(403).json({ message: "Access denied" })
  }
}, deleteStudent)

// Apply middleware to check if user is an admin for remaining routes
router.use(checkRole("ADMIN"))

// Admin management routes
router.get("/admins", getAllAdmins)
router.get("/admins/:adminId", getAdmin)
router.put("/admins/:adminId", validateUpdateAdmin, updateAdmin)
router.delete("/admins/:adminId", deleteAdmin)

// Admin routes
router.get("/hostels", getAllHostels)
router.get("/hostels/:hostelId", getHostel)
router.post("/hostels", createHostel)
router.put("/hostels/:hostelId", updateHostel)
router.delete("/hostels/:hostelId", deleteHostel)
router.delete("/hostels/:hostelId/wardens/:wardenId", removeWardenFromHostel)
router.delete("/students/:studentId/hostel", removeStudentFromHostel)

router.get("/wardens", getAllWardens)
router.get("/wardens/:wardenId", getWarden)
router.post("/wardens", validateRegisterWarden, createWarden)
router.put("/wardens/:wardenId", validateUpdateWarden, updateWarden)
router.put("/wardens/:wardenId/approve", approveWarden)
router.delete("/wardens/:wardenId", deleteWarden)
router.post("/create-admin", validateCreateAdmin, createAdmin)
router.post("/payments", createPayment)
router.post("/hostels/allocate", allocateHostelsBulk)
router.delete("/students/:studentId/room", deallocateStudentRoom)
router.post("/students/allocate-room", allocateRoom)

// Warden-Hostel Assignment routes
router.post("/warden-hostel/assign", validateWardenHostelAssignment, assignWardenToHostel)
router.get("/warden-hostel/assignments", getWardenHostelAssignments)
router.get("/warden-hostel/warden/:wardenId", getWardenAssignments)
router.get("/warden-hostel/hostel/:hostelId", getHostelAssignments)
router.post("/warden-hostel/bulk-assign", validateBulkWardenHostelAssignment, bulkAssignWardensToHostels)

export default router
