import prisma from "../config/db.js";
import { calculateAllotment } from "../utils/seat.allotment.js";

// Get student profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        roomAllocations: {
          include: {
            room: {},
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update student profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, mobileNo, address, pinCode } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { userId },
      data: {
        fullName,
        mobileNo,
        address,
        pinCode,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Apply for hostel
export const applyForHostel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId, hostelId } = req.body;
    console.log('userId: ', userId);
    console.log('hostelId: ', hostelId);
    console.log('roomId: ', roomId);

    // Check if student exists
    const student = await prisma.student.findFirst({
      where: { userId },
    });
    console.log("student: ", student);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if application already exists
    // Check if application already exists with pending status
    const existingApplication = await prisma.hostelApplication.findFirst({
      where: {
        student: {
          id: parseInt(student.id),
        },
        status: "PENDING",
      },
    });
    console.log("existingApplication: ", existingApplication);

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have a pending application already" });
    }

    // Create application
    // Create application
    const application = await prisma.hostelApplication.create({
      data: {
        studentId: student.id,
        hostelId,
        roomId,
      },
    });
    console.log('application: ', application);

    res.status(201).json({
      message: "Hostel application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Error applying for hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Make payment
export const makePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId } = req.params;
    const { transactionDetails } = req.body;

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: Number.parseInt(paymentId),
        userId,
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
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

export const getHostelApplication = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number.parseInt(userId),
      },
      include: {
        student: true,
      },
    });
    console.log("user: ", user);

    if (!user.student) {
      res.status(400).json({
        message: "Student record not found",
      });
    }
    const application = await prisma.hostelApplication.findMany({
      where: {
        student: {
          id: Number.parseInt(user.student.id),
        },
      },
    });

    res.status(200).json({
      message: "application fetched successful",
      application: application,
    });
  } catch (error) {
    console.error("Error making payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
