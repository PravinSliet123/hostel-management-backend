import prisma from "../config/db.js"
import { calculateAllotment } from "../utils/seat.allotment.js"

// Get student profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        roomAllocations: {
          include: {
            room: {}
          }
        }
      },
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    res.status(200).json(student)
  } catch (error) {
    console.error("Error fetching student profile:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update student profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { fullName, mobileNo, address, pinCode } = req.body

    const updatedStudent = await prisma.student.update({
      where: { userId },
      data: {
        fullName,
        mobileNo,
        address,
        pinCode,
      },
    })

    res.status(200).json({
      message: "Profile updated successfully",
      student: updatedStudent,
    })
  } catch (error) {
    console.error("Error updating student profile:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Apply for hostel
export const applyForHostel = async (req, res) => {
  try {
    const userId = req.user.id

    // Check if student exists
    const student = await prisma.student.findFirst({
      where: { userId },
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if application already exists
    const existingApplication = await prisma.hostelApplication.findUnique({
      where: { studentId: userId },
    })

    if (existingApplication) {
      return res.status(400).json({ message: "Application already exists" })
    }

    // Create application
    const application = await prisma.hostelApplication.create({
      data: {
        studentId: userId,
      },
    })

    // Run seat allotment algorithm
    const allotmentResult = await calculateAllotment(student)

    res.status(201).json({
      message: "Hostel application submitted successfully",
      application,
      allotmentResult,
    })
  } catch (error) {
    console.error("Error applying for hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json(payments)
  } catch (error) {
    console.error("Error fetching payment status:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Make payment
export const makePayment = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentId } = req.params
    const { transactionDetails } = req.body

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: Number.parseInt(paymentId),
        userId,
      },
    })

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: Number.parseInt(paymentId) },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    })

    res.status(200).json({
      message: "Payment successful",
      payment: updatedPayment,
    })
  } catch (error) {
    console.error("Error making payment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
