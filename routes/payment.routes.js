import express from "express"
import { getUserPayments, makePayment } from "../controllers/payment.controller.js"

const router = express.Router()

// Payment routes
router.get("/", getUserPayments)
router.post("/:paymentId", makePayment)

export default router
