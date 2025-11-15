import express from "express"
import { getUserPayments, getAllPayemntPayments,makePayment, getStudentPaymentDetails, getStudentPaymentHistory, createPaymentOrder, verifyPayment } from "../controllers/payment.controller.js"
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const router = express.Router()

// Payment routes
router.post("/createOrder",createPaymentOrder)
router.post("/verifyPayment",verifyPayment)

router.get("/all", authenticateToken,authorizeRoles("ADMIN", "WARDEN"),(getAllPayemntPayments))
// router.get("/", asyncHandler(getUserPayments))
router.post("/:paymentId", makePayment)
router.get("/student/:studentId", authenticateToken, authorizeRoles("ADMIN", "WARDEN"), asyncHandler(getStudentPaymentDetails))
router.get("/student/:studentId/history", authenticateToken, authorizeRoles("ADMIN", "WARDEN"), asyncHandler(getStudentPaymentHistory))



export default router
