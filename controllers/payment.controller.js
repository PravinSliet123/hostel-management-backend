import Razorpay from "razorpay";
import prisma from "../config/db.js";
import crypto from "crypto";
import { sendEMail } from "../utils/email.service.js";
import { generateInvoicePDF } from "../utils/pdf.generator.js";
// Get all payments for a user
export const getUserPayments = async (req, res) => {
  try {
    const { studentId } = req.query;

    const payments = await prisma.payment.findMany({
      where: {
        user: {
          student: {
            id: studentId,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            student: {},
          },
        },
      },
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllPayemntPayments = async (req, res) => {
  try {
    const { semester } = req.query;
    console.log("semester", semester);
    let where = {};
    if (semester) {
      where.semester = semester;
    }
    const payments = await prisma.payment.findMany({
      where: {
        ...(semester && { semester: Number(semester) }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            student: {},
          },
        },
      },
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Make a payment
export const makePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId } = req.params;
    console.log(paymentId);

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: Number.parseInt(paymentId),
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status === "PAID") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: Number.parseInt(paymentId) },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Payment successful",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error making payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get payment details for a specific student, semester, and year (admin/warden only)
export const getStudentPaymentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.payment.findMany({
      where: {
        user: {
          student: {
            id: Number(studentId),
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            student: {},
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching student payment details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all payment history for a student, semester-wise (admin/warden only)
export const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await prisma.payment.findMany({
      where: { userId: Number(studentId) },
      orderBy: [{ year: "desc" }, { semester: "desc" }, { createdAt: "desc" }],
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching student payment history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPaymentOrder = async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = req.body;
    const user = req.user;
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Error");
    }

    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    paymentId,
  } = req.body;

  const user = req.user;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  //order_id + "|" + razorpay_payment_id
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  // Find payment
  const payment = await prisma.payment.findFirst({
    where: {
      id: Number.parseInt(paymentId),
    },
    include: {
      user: {
        include: {
          student: {
            include: {
              roomAllocations: {
                where: {
                  isActive: true,
                },
                include: {
                  room: {
                    include: {
                      hostel: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  if (payment.status === "PAID") {
    return res.status(400).json({ message: "Payment already completed" });
  }

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: Number.parseInt(paymentId) },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // Generate invoice
  const student = payment.user.student;
  const roomAllocation = student.roomAllocations[0];
  const room = roomAllocation.room;
  const hostel = room.hostel;

  const invoiceData = {
    student,
    payment: updatedPayment,
    room,
    hostel,
  };

  const invoicePDF = await generateInvoicePDF(invoiceData);

  // Send email with invoice
  await sendEMail({
    to: payment.user.email,
    subject: "Payment Successful - Hostel Fee Invoice",
    html: `<p>Dear ${student.fullName},</p><p>Your payment has been successfully processed. Please find your invoice attached.</p>`,
    attachments: [
      {
        filename: `invoice-${payment.id}.pdf`,
        content: invoicePDF,
        contentType: "application/pdf",
      },
    ],
  });

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    payment: updatedPayment,
  });
};
