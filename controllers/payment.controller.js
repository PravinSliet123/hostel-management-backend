import prisma from "../config/db.js"

// Get all payments for a user
export const getUserPayments = async (req, res) => {
  try {
    const { studentId } = req.query

    const payments = await prisma.payment.findMany({
      where: {
        user: {
          student: {
            id: studentId
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            student: {}
          }
        }
      }
    })

    res.status(200).json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
export const getAllPayemntPayments = async (req, res) => {
  try {
    const { semester } = req.query
    console.log("semester", semester)
    let where = {}
    if (semester) {
      where.semester = semester
    }
    const payments = await prisma.payment.findMany({
      where: {
        ...(semester && { semester: Number(semester) })
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            student: {}
          }
        }
      }
    })

    res.status(200).json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Make a payment
export const makePayment = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentId } = req.params
  console.log(paymentId)

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: Number.parseInt(paymentId)
      },
    })

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    if (payment.status === "PAID") {
      return res.status(400).json({ message: "Payment already completed" })
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

// Get payment details for a specific student, semester, and year (admin/warden only)
export const getStudentPaymentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.payment.findMany({
      where: {
        user:{
          student:{
            id: Number(studentId)
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            student: {}
          }
        }
      },
      orderBy:{
        createdAt:'asc'
      }
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching student payment details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all payment history for a student, semester-wise (admin/warden only)
export const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await prisma.payment.findMany({
      where: { userId: Number(studentId) },
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching student payment history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
