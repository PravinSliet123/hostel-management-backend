import prisma from "../config/db.js"

// Get all payments for a user
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
    const { transactionId } = req.body

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
