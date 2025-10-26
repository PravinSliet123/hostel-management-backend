import prisma from "../config/db.js";
import { sendEMail } from "../utils/email.service.js";

// Get warden profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostel: true,
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    res.status(200).json(warden);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update warden profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, mobileNo, address, zipCode } = req.body;

    const updatedWarden = await prisma.warden.update({
      where: { userId },
      data: {
        fullName,
        mobileNo,
        address,
        zipCode,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      warden: updatedWarden,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get rooms in hostel
export const getRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" });
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map(
      (wardenHostel) => wardenHostel.hostelId
    );

    // Get rooms in all hostels assigned to warden
    const rooms = await prisma.room.findMany({
      where: {
        hostelId: {
          in: hostelIds,
        },
      },
      include: {
        hostel: true,
        allocations: {
          where: {
            isActive: true,
          },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                registrationNo: true,
                rollNo: true,
                department: true,
                year: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update room details
export const updateRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;
    const { totalSeats, vacantSeats } = req.body;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" });
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map(
      (wardenHostel) => wardenHostel.hostelId
    );

    // Check if room belongs to any of warden's hostels
    const room = await prisma.room.findFirst({
      where: {
        id: Number.parseInt(roomId),
        hostelId: {
          in: hostelIds,
        },
      },
    });

    if (!room) {
      return res
        .status(404)
        .json({ message: "Room not found in your assigned hostels" });
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id: Number.parseInt(roomId) },
      data: {
        totalSeats,
        vacantSeats,
      },
    });

    res.status(200).json({
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get student payment status
export const getStudentPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" });
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map(
      (wardenHostel) => wardenHostel.hostelId
    );

    // Get students in all hostels assigned to warden
    const students = await prisma.student.findMany({
      where: {
        roomAllocations: {
          some: {
            room: {
              hostelId: {
                in: hostelIds,
              },
            },
            isActive: true,
          },
        },
      },
      include: {
        user: {
          include: {
            payments: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
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
    });

    // Format response with more detailed information
    const studentsWithPayments = students.map((student) => {
      const activeAllocation = student.roomAllocations[0]; // Should only be one active allocation

      return {
        id: student.id,
        fullName: student.fullName,
        registrationNo: student.registrationNo,
        rollNo: student.rollNo,
        department: student.department,
        year: student.year,
        semester: student.semester,
        hostel: activeAllocation?.room?.hostel?.name || "Not allocated",
        roomNumber: activeAllocation?.room?.roomNumber || "Not allocated",
        payments: student.user.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        })),
        totalPayments: student.user.payments.length,
        pendingPayments: student.user.payments.filter(
          (p) => p.status === "PENDING"
        ).length,
        paidPayments: student.user.payments.filter((p) => p.status === "PAID")
          .length,
        overduePayments: student.user.payments.filter(
          (p) => p.status === "OVERDUE"
        ).length,
      };
    });

    res.status(200).json({
      message: "Student payment status retrieved successfully",
      totalStudents: studentsWithPayments.length,
      students: studentsWithPayments,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all hostels assigned to warden
export const getHostels = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const getHostel = await prisma.wardenHostel.findMany({
      where: {
        wardenId: Number(warden.id),
      },
      include: {
        hostel: {
          include: {
            rooms: {},
          },
        },
        warden: true,
      },
    });

    // Extract hostels from the relationship
    const hostels = warden.hostels.map((wardenHostel) => wardenHostel.hostel);

    res.status(200).json(getHostel);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if student exists and get their details
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        user: true,
        roomAllocations: {
          where: { isActive: true },
          include: {
            room: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete student and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // If student has active room allocation, update room vacancy
      if (student.roomAllocations.length > 0) {
        await tx.room.update({
          where: { id: student.roomAllocations[0].roomId },
          data: {
            vacantSeats: {
              increment: 1,
            },
          },
        });
      }

      // Delete all payments for this user
      await tx.payment.deleteMany({
        where: { userId: student.userId },
      });

      // Delete all room allocations
      await tx.roomAllocation.deleteMany({
        where: { studentId: Number.parseInt(studentId) },
      });

      // Delete the student
      await tx.student.delete({
        where: { id: Number.parseInt(studentId) },
      });

      // Delete the associated user
      await tx.user.delete({
        where: { id: student.userId },
      });
    });

    // Send email notification
    await sendEMail({
      to: student.user.email,
      subject: "Your Account Deleted",
      html: `
    <p>Hello ${student.fullName},</p>
    <p> Your warden account has been deleted from the system.</p>
  `,
    });

    res.status(200).json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get rooms of a specific hostel
export const getHostelRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hostelId } = req.params;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // Check if warden is assigned to this hostel
    const isAssigned = warden.hostels.some(
      (wardenHostel) => wardenHostel.hostelId === Number.parseInt(hostelId)
    );

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this hostel" });
    }

    // Get rooms in the hostel
    const rooms = await prisma.room.findMany({
      where: { hostelId: Number.parseInt(hostelId) },
      include: {
        allocations: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                registrationNo: true,
                rollNo: true,
                department: true,
                year: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get details of a single hostel
export const getHostelDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hostelId } = req.params;

    // Get warden with assigned hostels
    const hostelById = await prisma.hostel.findFirst({
      where: { id: Number(hostelId) },
      include: {
        rooms: {},
      },
    });

    // Get hostel details with room statistics

    const hostelWithStats = {
      data: hostelById,
    };

    res.status(200).json(hostelWithStats);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get details of a single room
export const getRoomDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // Get room details
    const room = await prisma.room.findUnique({
      where: { id: Number.parseInt(roomId) },
      include: {
        hostel: true,
        allocations: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                registrationNo: true,
                rollNo: true,
                department: true,
                year: true,
                semester: true,
                mobileNo: true,
                address: true,
                pinCode: true,
                distanceFromCollege: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if warden is assigned to this room's hostel
    const isAssigned = warden.hostels.some(
      (wardenHostel) => wardenHostel.hostelId === room.hostelId
    );

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this room" });
    }

    // Calculate room statistics
    const roomWithStats = {
      ...room,
      statistics: {
        occupancyRate:
          room.totalSeats > 0
            ? (
                ((room.totalSeats - room.vacantSeats) / room.totalSeats) *
                100
              ).toFixed(2)
            : 0,
        availableSeats: room.vacantSeats,
        occupiedSeats: room.totalSeats - room.vacantSeats,
      },
    };

    res.status(200).json(roomWithStats);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get student payment status for a specific hostel
export const getStudentPaymentsByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;

    if (!hostelId) {
      return res.status(403).json({ message: "Hostel Id id incorrect" });
    }

    const students = await prisma.student.findMany({
      where: {
        roomAllocations: {
          some: {
            isActive: true,
            room: {
              hostelId: Number(hostelId),
            },
          },
        },
      },
      include: {
        roomAllocations: {
          where: {
            isActive: true,
            room: {
              hostelId: Number(hostelId),
            },
          },
          include: {
            room: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get payment summary statistics for all assigned hostels
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get warden with assigned hostels
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
      },
    });

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" });
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map(
      (wardenHostel) => wardenHostel.hostelId
    );

    // Get all students in assigned hostels
    const students = await prisma.student.findMany({
      where: {
        roomAllocations: {
          some: {
            room: {
              hostelId: {
                in: hostelIds,
              },
            },
            isActive: true,
          },
        },
      },
      include: {
        user: {
          include: {
            payments: true,
          },
        },
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
    });

    // Calculate summary statistics
    const totalStudents = students.length;
    const allPayments = students.flatMap((student) => student.user.payments);

    const summary = {
      totalStudents,
      totalPayments: allPayments.length,
      totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: allPayments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: allPayments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: allPayments
        .filter((p) => p.status === "OVERDUE")
        .reduce((sum, p) => sum + p.amount, 0),
      studentsWithPendingPayments: students.filter((s) =>
        s.user.payments.some((p) => p.status === "PENDING")
      ).length,
      studentsWithOverduePayments: students.filter((s) =>
        s.user.payments.some((p) => p.status === "OVERDUE")
      ).length,
      fullyPaidStudents: students.filter(
        (s) =>
          !s.user.payments.some(
            (p) => p.status === "PENDING" || p.status === "OVERDUE"
          )
      ).length,
      paymentStatusBreakdown: {
        paid: allPayments.filter((p) => p.status === "PAID").length,
        pending: allPayments.filter((p) => p.status === "PENDING").length,
        overdue: allPayments.filter((p) => p.status === "OVERDUE").length,
      },
    };

    // Calculate statistics by hostel
    const hostelStats = await Promise.all(
      warden.hostels.map(async (wardenHostel) => {
        const hostelStudents = students.filter((student) =>
          student.roomAllocations.some(
            (allocation) => allocation.room.hostelId === wardenHostel.hostelId
          )
        );

        const hostelPayments = hostelStudents.flatMap(
          (student) => student.user.payments
        );

        return {
          hostelId: wardenHostel.hostel.id,
          hostelName: wardenHostel.hostel.name,
          hostelType: wardenHostel.hostel.type,
          totalStudents: hostelStudents.length,
          totalAmount: hostelPayments.reduce((sum, p) => sum + p.amount, 0),
          paidAmount: hostelPayments
            .filter((p) => p.status === "PAID")
            .reduce((sum, p) => sum + p.amount, 0),
          pendingAmount: hostelPayments
            .filter((p) => p.status === "PENDING")
            .reduce((sum, p) => sum + p.amount, 0),
          overdueAmount: hostelPayments
            .filter((p) => p.status === "OVERDUE")
            .reduce((sum, p) => sum + p.amount, 0),
          studentsWithPendingPayments: hostelStudents.filter((s) =>
            s.user.payments.some((p) => p.status === "PENDING")
          ).length,
          studentsWithOverduePayments: hostelStudents.filter((s) =>
            s.user.payments.some((p) => p.status === "OVERDUE")
          ).length,
          fullyPaidStudents: hostelStudents.filter(
            (s) =>
              !s.user.payments.some(
                (p) => p.status === "PENDING" || p.status === "OVERDUE"
              )
          ).length,
        };
      })
    );

    res.status(200).json({
      message: "Payment summary retrieved successfully",
      summary,
      hostelStats,
      assignedHostels: warden.hostels.map((wh) => ({
        id: wh.hostel.id,
        name: wh.hostel.name,
        type: wh.hostel.type,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deallocateStudentRoom = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if student exists and has an active room allocation
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        roomAllocations: {
          where: { isActive: true },
          include: {
            room: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.roomAllocations.length === 0) {
      return res
        .status(400)
        .json({ message: "Student is not allocated to any room" });
    }

    // Update room allocation and room vacancy in a transaction
    await prisma.$transaction(async (tx) => {
      // Update room allocation with deallocation timestamp
      await tx.roomAllocation.update({
        where: { id: student.roomAllocations[0].id },
        data: {
          isActive: false,
          deallocatedAt: new Date(),
        },
      });

      // Update room vacancy
      await tx.room.update({
        where: { id: student.roomAllocations[0].room.id },
        data: {
          vacantSeats: {
            increment: 1,
          },
        },
      });
    });

    res.status(200).json({
      message: "Student's room deallocated successfully",
    });
  } catch (error) {
    console.error("Error deallocating student's room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const allocateRoom = async (req, res) => {
  try {
    const { studentId, hostelId, roomId } = req.body;
    console.log('hostelId: ', hostelId);
    console.log('roomId: ', roomId);

    // Validate required fields
    if (!studentId || !hostelId || !roomId) {
      return res.status(400).json({
        message: "studentId, hostelId, and roomId are required fields",
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        roomAllocations: {
          where: { isActive: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student already has an active room allocation
    if (student.roomAllocations.length > 0) {
      return res.status(400).json({
        message: "Student already has an active room allocation",
      });
    }

    // Check if room exists and belongs to the specified hostel
    const room = await prisma.room.findFirst({
      where: {
        id: Number.parseInt(roomId),
        hostelId: Number.parseInt(hostelId),
        vacantSeats: { gt: 0 },
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found or no vacant seats available",
      });
    }

    // Create room allocation and update room vacancy in a transaction
    const [allocation] = await prisma.$transaction([
      // Create room allocation
      prisma.roomAllocation.create({
        data: {
          studentId: Number.parseInt(studentId),
          roomId: Number.parseInt(roomId),
          semester: student.semester,
          year: student.year,
          isActive: true,
        },
      }),
      // Update room vacancy
      prisma.room.update({
        where: { id: Number.parseInt(roomId) },
        data: {
          vacantSeats: {
            decrement: 1,
          },
        },
      }),
    ]);

    // Only create payment if allocation was successful
    if (allocation) {
      const payment = await prisma.payment.create({
        data: {
          userId: student.userId,
          amount: 1500,
          description: `Hostel fee for semester ${student.semester}, year ${student.year}`,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          semester: student.semester,
          year: student.year,
        },
      });

      // Fetch student user email
      const user = await prisma.user.findUnique({
        where: { id: student.userId },
      });

      console.log("user", user);
      // Send email to student
      try {
        await sendEMail({
          to: user.email,
          subject: "Hostel Payment Created",
          html: `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #333;'>Hostel Payment Created</h2>
            <p>Hello ${user.fullName || "Student"},</p>
            <p>Your hostel payment has been created for semester ${
              student.semester
            }, year ${student.year}.</p>
            <ul>
              <li><strong>Amount:</strong> ₹1500</li>
              <li><strong>Due Date:</strong> ${payment.dueDate.toLocaleDateString()}</li>
              <li><strong>Status:</strong> ${payment.status}</li>
            </ul>
            <p>Please pay before the due date to avoid any penalties.</p>
            <p>Best regards,<br>Hostel Management Team</p>
          </div>`,
        });
      } catch (emailError) {
        console.error("Error sending payment email to student:", emailError);
        // Continue even if email fails
      }

      return res.status(201).json({
        message: "Room allocated successfully and payment created",
        allocation,
        payment,
      });
    } else {
      return res
        .status(500)
        .json({ message: "Room allocation failed, payment not created" });
    }
  } catch (error) {
    console.error("Error allocating room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};