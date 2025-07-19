import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import { sendEMail } from "../utils/email.service.js";
import { generateRandomPassword } from "../utils/password.generator.js";

// Get all hostels
export const getAllHostels = async (req, res) => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        rooms: {},
      },
    });

    res.status(200).json(hostels);
  } catch (error) {
    console.error("Error fetching hostels:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Check if student exists and get their details
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        rooms: {},
      },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student date fetched successfully",
      data: hostel,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Create hostel
export const createHostel = async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }

    const { name, type } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required fields",
        received: { name, type },
      });
    }

    // Check if hostel already exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { name },
    });

    if (existingHostel) {
      return res.status(400).json({ message: "Hostel already exists" });
    }

    // Create hostel
    const hostel = await prisma.hostel.create({
      data: {
        name,
        type,
      },
    });

    res.status(201).json({
      message: "Hostel created successfully",
      hostel,
    });
  } catch (error) {
    console.error("Error creating hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create room
export const createRoom = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }

    const { hostelId, roomNumber, totalSeats, roomType } = req.body;

    // Validate required fields
    if (!hostelId || !roomNumber || !totalSeats || !roomType) {
      return res.status(400).json({
        message:
          "hostelId, roomNumber, totalSeats, and roomType are required fields",
        received: { hostelId, roomNumber, totalSeats, roomType },
      });
    }

    // Convert roomNumber to string and validate other fields
    const roomNumberStr = String(roomNumber);
    const hostelIdNum = Number.parseInt(hostelId);
    const totalSeatsNum = Number.parseInt(totalSeats);

    if (isNaN(hostelIdNum) || isNaN(totalSeatsNum)) {
      return res.status(400).json({
        message: "hostelId and totalSeats must be valid numbers",
      });
    }

    // Validate roomType
    if (!["SINGLE", "DOUBLE", "TRIPLE"].includes(roomType)) {
      return res.status(400).json({
        message: "roomType must be one of: SINGLE, DOUBLE, TRIPLE",
      });
    }

    // Validate totalSeats based on roomType
    const expectedSeats = {
      SINGLE: 1,
      DOUBLE: 2,
      TRIPLE: 3,
    };

    if (totalSeatsNum !== expectedSeats[roomType]) {
      return res.status(400).json({
        message: `Total seats must be ${expectedSeats[roomType]} for ${roomType} room type`,
      });
    }

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelIdNum },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // If user is a warden, check if they are assigned to this hostel
    if (req.user.role === "WARDEN") {
      const warden = await prisma.warden.findFirst({
        where: {
          userId: req.user.id,
          hostels: {
            some: {
              hostelId: hostelIdNum,
            },
          },
        },
      });

      if (!warden) {
        return res.status(403).json({
          message:
            "Access denied. You can only create rooms in hostels you are assigned to.",
        });
      }
    }

    // Check if room already exists
    const existingRoom = await prisma.room.findFirst({
      where: {
        hostelId: hostelIdNum,
        roomNumber: roomNumberStr,
      },
    });

    if (existingRoom) {
      return res
        .status(400)
        .json({ message: "Room already exists in this hostel" });
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        hostelId: hostelIdNum,
        roomNumber: roomNumberStr,
        totalSeats: totalSeatsNum,
        vacantSeats: totalSeatsNum,
        roomType: roomType,
      },
    });

    // Update hostel room counts
    await prisma.hostel.update({
      where: { id: hostelIdNum },
      data: {
        totalRooms: {
          increment: 1,
        },
        vacantRooms: {
          increment: 1,
        },
      },
    });

    res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update room
export const updateRoom = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }

    const { roomId } = req.params;
    const { roomNumber, totalSeats, roomType, vacantSeats } = req.body;

    // Validate required fields
    if (!roomNumber && !totalSeats && !roomType && vacantSeats === undefined) {
      return res.status(400).json({
        message:
          "At least one field (roomNumber, totalSeats, roomType, or vacantSeats) is required",
      });
    }

    // Convert roomId to number
    const roomIdNum = Number.parseInt(roomId);
    if (isNaN(roomIdNum)) {
      return res.status(400).json({
        message: "roomId must be a valid number",
      });
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomIdNum },
      include: {
        hostel: true,
        allocations: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // If user is a warden, check if they are assigned to this room's hostel
    if (req.user.role === "WARDEN") {
      const warden = await prisma.warden.findFirst({
        where: {
          userId: req.user.id,
          hostels: {
            some: {
              hostelId: existingRoom.hostelId,
            },
          },
        },
      });

      if (!warden) {
        return res.status(403).json({
          message:
            "Access denied. You can only update rooms in hostels you are assigned to.",
        });
      }
    }

    // Prepare update data
    const updateData = {};

    if (roomNumber !== undefined) {
      updateData.roomNumber = String(roomNumber);
    }

    if (totalSeats !== undefined) {
      const totalSeatsNum = Number.parseInt(totalSeats);
      if (isNaN(totalSeatsNum) || totalSeatsNum <= 0) {
        return res.status(400).json({
          message: "totalSeats must be a valid positive number",
        });
      }
      updateData.totalSeats = totalSeatsNum;
    }

    if (roomType !== undefined) {
      if (!["SINGLE", "DOUBLE", "TRIPLE"].includes(roomType)) {
        return res.status(400).json({
          message: "roomType must be one of: SINGLE, DOUBLE, TRIPLE",
        });
      }
      updateData.roomType = roomType;
    }

    // Handle vacantSeats logic
    if (vacantSeats !== undefined) {
      const vacantSeatsNum = Number.parseInt(vacantSeats);
      if (isNaN(vacantSeatsNum) || vacantSeatsNum < 0) {
        return res.status(400).json({
          message: "vacantSeats must be a valid non-negative number",
        });
      }
      updateData.vacantSeats = vacantSeatsNum;
    }

    // Validate totalSeats and roomType consistency if both are being updated
    if (updateData.totalSeats && updateData.roomType) {
      const expectedSeats = {
        SINGLE: 1,
        DOUBLE: 2,
        TRIPLE: 3,
      };

      if (updateData.totalSeats !== expectedSeats[updateData.roomType]) {
        return res.status(400).json({
          message: `Total seats must be ${
            expectedSeats[updateData.roomType]
          } for ${updateData.roomType} room type`,
        });
      }
    }

    // Auto-adjust vacantSeats when totalSeats is changed
    if (updateData.totalSeats !== undefined) {
      const currentOccupiedSeats =
        existingRoom.totalSeats - existingRoom.vacantSeats;
      const newTotalSeats = updateData.totalSeats;

      // Calculate new vacant seats
      const newVacantSeats = Math.max(0, newTotalSeats - currentOccupiedSeats);

      // Check if the new total seats can accommodate current students
      if (currentOccupiedSeats > newTotalSeats) {
        return res.status(400).json({
          message: `Cannot reduce total seats to ${newTotalSeats}. There are currently ${currentOccupiedSeats} students allocated to this room.`,
          currentOccupiedSeats,
          requestedTotalSeats: newTotalSeats,
        });
      }

      updateData.vacantSeats = newVacantSeats;

      // If user also provided vacantSeats, validate it
      if (vacantSeats !== undefined) {
        const userVacantSeats = Number.parseInt(vacantSeats);
        if (userVacantSeats !== newVacantSeats) {
          return res.status(400).json({
            message: `Vacant seats will be automatically adjusted to ${newVacantSeats} based on current occupancy and new total seats. Cannot manually set to ${userVacantSeats}.`,
            calculatedVacantSeats: newVacantSeats,
            requestedVacantSeats: userVacantSeats,
            currentOccupiedSeats,
          });
        }
      }
    }

    // Check if room number already exists in the same hostel (if roomNumber is being updated)
    if (updateData.roomNumber) {
      const duplicateRoom = await prisma.room.findFirst({
        where: {
          hostelId: existingRoom.hostelId,
          roomNumber: updateData.roomNumber,
          id: { not: roomIdNum },
        },
      });

      if (duplicateRoom) {
        return res
          .status(400)
          .json({ message: "Room number already exists in this hostel" });
      }
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id: roomIdNum },
      data: updateData,
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Room updated successfully",
      room: updatedRoom,
      changes: {
        totalSeatsChanged: updateData.totalSeats !== undefined,
        vacantSeatsAutoAdjusted:
          updateData.totalSeats !== undefined && vacantSeats === undefined,
      },
    });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Convert roomId to number
    const roomIdNum = Number.parseInt(roomId);
    if (isNaN(roomIdNum)) {
      return res.status(400).json({
        message: "roomId must be a valid number",
      });
    }

    // Check if room exists and get its details
    const room = await prisma.room.findUnique({
      where: { id: roomIdNum },
      include: {
        hostel: true,
        allocations: {
          where: {
            isActive: true,
          },
          include: {
            student: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // If user is a warden, check if they are assigned to this room's hostel
    if (req.user.role === "WARDEN") {
      const warden = await prisma.warden.findFirst({
        where: {
          userId: req.user.id,
          hostels: {
            some: {
              hostelId: room.hostelId,
            },
          },
        },
      });

      if (!warden) {
        return res.status(403).json({
          message:
            "Access denied. You can only delete rooms in hostels you are assigned to.",
        });
      }
    }

    // Check if there are active student allocations to this room
    if (room.allocations && room.allocations.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete room. There are students currently allocated to this room. Please deallocate all students first.",
        allocatedStudents: room.allocations.length,
        students: room.allocations.map((allocation) => ({
          id: allocation.student.id,
          fullName: allocation.student.fullName,
          registrationNo: allocation.student.registrationNo,
        })),
      });
    }

    // Delete room and update hostel room counts in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the room
      await tx.room.delete({
        where: { id: roomIdNum },
      });

      // Update hostel room counts
      await tx.hostel.update({
        where: { id: room.hostelId },
        data: {
          totalRooms: {
            decrement: 1,
          },
          vacantRooms: {
            decrement: 1,
          },
        },
      });
    });

    res.status(200).json({
      message: "Room deleted successfully",
      deletedRoom: {
        id: room.id,
        roomNumber: room.roomNumber,
        hostelName: room.hostel.name,
      },
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all wardens with optional approval status filter
export const getAllWardens = async (req, res) => {
  try {
    const { isApproved } = req.query;

    // Build where clause based on query parameters
    const whereClause = {};
    if (isApproved !== undefined) {
      whereClause.isApproved = isApproved === "true";
    }

    const wardens = await prisma.warden.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
        hostels: {
          include: {
            hostel: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Transform the response to make it more frontend-friendly
    const transformedWardens = wardens.map((warden) => ({
      ...warden,
      hostels: warden.hostels.map((wh) => wh.hostel),
    }));

    res.status(200).json(transformedWardens);
  } catch (error) {
    console.error("Error fetching wardens:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get pending warden registrations (kept for backward compatibility)
export const getPendingWardens = async (req, res) => {
  try {
    const pendingWardens = await prisma.warden.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(200).json(pendingWardens);
  } catch (error) {
    console.error("Error fetching pending wardens:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve warden
export const approveWarden = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" });
    }

    const { wardenId } = req.params;
    const { hostelId } = req.body;

    // Check if warden exists
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
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

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if warden is already assigned to this hostel
    const existingAssignment = warden.hostels.find(
      (wh) => wh.hostelId === Number.parseInt(hostelId)
    );

    if (existingAssignment) {
      return res.status(400).json({
        message: "Warden is already assigned to this hostel",
      });
    }

    // Update warden approval status and create hostel assignment in a transaction
    const [updatedWarden, wardenHostel] = await prisma.$transaction([
      // Update warden approval status
      prisma.warden.update({
        where: { id: Number.parseInt(wardenId) },
        data: {
          isApproved: true,
        },
      }),
      // Create hostel assignment
      prisma.wardenHostel.create({
        data: {
          wardenId: Number.parseInt(wardenId),
          hostelId: Number.parseInt(hostelId),
        },
        include: {
          hostel: true,
        },
      }),
    ]);

    res.status(200).json({
      message: "Warden approved and assigned to hostel successfully",
      warden: {
        ...updatedWarden,
        hostels: [...warden.hostels, wardenHostel],
      },
    });
  } catch (error) {
    console.error("Error approving warden:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reject warden
export const rejectWarden = async (req, res) => {
  try {
    const { wardenId } = req.params;

    // Check if warden exists
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // Delete warden and user
    await prisma.$transaction([
      prisma.warden.delete({
        where: { id: Number.parseInt(wardenId) },
      }),
      prisma.user.delete({
        where: { id: warden.userId },
      }),
    ]);

    res.status(200).json({
      message: "Warden rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting warden:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const { hostelId } = req.query;
    console.log("hostelId", hostelId);
    const students = await prisma.student.findMany({
      where: hostelId
        ? {
            roomAllocations: {
              some: {
                isActive: true,
                room: {
                  hostelId: Number(hostelId),
                },
              },
            },
          }
        : undefined,
      include: {
        roomAllocations: {
          where: {
            isActive: true,
            ...(hostelId && {
              room: {
                hostelId: Number(hostelId),
              },
            }),
          },
          include: {
            room: {
              include: {
                hostel: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response to make it more frontend-friendly
    const transformedStudents = students.map((student) => ({
      ...student,
      currentRoom: student.roomAllocations[0] || null,
      roomAllocations: undefined, // Remove the array since we only need current room
    }));

    res.status(200).json(transformedStudents);
    
  } catch (error) {
    console.error("Error fetching students:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "No students found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create admin
export const createAdmin = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      // Create admin profile
      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          fullName,
        },
      });

      return { user, admin };
    });

    // Send welcome email
    try {
      await sendEMail({
        to: email,
        subject: "Your Account Credentials",
        html: `
      <p>Hello ${fullName},</p>
      <p>Your account has been created. </br> Now you can login to system </p>
      <p><strong>Login Id:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
    `,
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: result.admin.id,
        fullName: result.admin.fullName,
        email: result.user.email,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create payment for student
export const createPayment = async (req, res) => {
  try {
    const { studentId, amount, description, dueDate } = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: student.userId,
        amount: Number.parseFloat(amount),
        description,
        dueDate: new Date(dueDate),
      },
    });

    res.status(201).json({
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete hostel
export const deleteHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        rooms: {
          include: {
            allocations: {
              where: {
                isActive: true,
              },
            },
          },
        },
        wardens: true,
      },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if hostel has any active students
    const hasActiveStudents = hostel.rooms.some(
      (room) => room.allocations.length > 0
    );
    if (hasActiveStudents) {
      return res.status(400).json({
        message: "Cannot delete hostel with active students",
        details:
          "Please ensure all students are removed from the hostel before deletion",
      });
    }

    // Check if hostel has any wardens
    if (hostel.wardens.length > 0) {
      return res.status(400).json({
        message: "Cannot delete hostel with assigned wardens",
        details: "Please remove all wardens from the hostel before deletion",
      });
    }

    // Delete hostel and its rooms in a transaction
    await prisma.$transaction([
      // Delete all room allocations in the hostel's rooms
      prisma.roomAllocation.deleteMany({
        where: {
          roomId: {
            in: hostel.rooms.map((room) => room.id),
          },
        },
      }),
      // Delete all rooms in the hostel
      prisma.room.deleteMany({
        where: { hostelId: Number.parseInt(hostelId) },
      }),
      // Delete the hostel
      prisma.hostel.delete({
        where: { id: Number.parseInt(hostelId) },
      }),
    ]);

    res.status(200).json({
      message: "Hostel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update hostel details
export const updateHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { name, type } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required fields",
        received: { name, type },
      });
    }

    // Check if hostel exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
    });

    if (!existingHostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if new name conflicts with another hostel
    if (name !== existingHostel.name) {
      const nameConflict = await prisma.hostel.findUnique({
        where: { name },
      });
      if (nameConflict) {
        return res
          .status(400)
          .json({ message: "A hostel with this name already exists" });
      }
    }

    // Update hostel
    const updatedHostel = await prisma.hostel.update({
      where: { id: Number.parseInt(hostelId) },
      data: {
        name,
        type,
      },
    });

    res.status(200).json({
      message: "Hostel updated successfully",
      hostel: updatedHostel,
    });
  } catch (error) {
    console.error("Error updating hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove warden from hostel
export const removeWardenFromHostel = async (req, res) => {
  try {
    const { hostelId, wardenId } = req.params;

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        wardens: {
          where: { wardenId: Number.parseInt(wardenId) },
        },
      },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if warden is assigned to this hostel
    if (hostel.wardens.length === 0) {
      return res
        .status(400)
        .json({ message: "Warden is not assigned to this hostel" });
    }

    // Remove warden from hostel
    await prisma.wardenHostel.delete({
      where: {
        wardenId_hostelId: {
          wardenId: Number.parseInt(wardenId),
          hostelId: Number.parseInt(hostelId),
        },
      },
    });

    res.status(200).json({
      message: "Warden removed from hostel successfully",
    });
  } catch (error) {
    console.error("Error removing warden from hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove student from hostel
export const removeStudentFromHostel = async (req, res) => {
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
        .json({ message: "Student is not allocated to any hostel" });
    }

    // Update room allocation and room vacancy in a transaction
    await prisma.$transaction(async (tx) => {
      // Update room allocation
      await tx.roomAllocation.update({
        where: { id: student.roomAllocations[0].id },
        data: { isActive: false },
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
      message: "Student removed from hostel successfully",
    });
  } catch (error) {
    console.error("Error removing student from hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Bulk allocate hostels to students based on distance
export const allocateHostelsBulk = async (req, res) => {
  try {
    // Get all students who don't have an active room allocation
    const unallocatedStudents = await prisma.student.findMany({
      where: {
        roomAllocations: {
          none: {
            isActive: true,
          },
        },
      },
      orderBy: {
        distanceFromCollege: "desc", // Sort by distance in descending order
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Get all rooms with their current allocations
    const availableRooms = await prisma.room.findMany({
      where: {
        vacantSeats: {
          gt: 0,
        },
      },
      include: {
        hostel: true,
        allocations: {
          where: {
            isActive: true,
          },
        },
      },
    });

    const allocationResults = [];
    const errors = [];

    // Allocate rooms to students
    for (const student of unallocatedStudents) {
      let allocated = false;

      // Try to find a suitable room
      for (const room of availableRooms) {
        // Double check if room still has vacant seats
        const currentOccupancy = room.allocations.length;
        const actualVacantSeats = room.totalSeats - currentOccupancy;

        if (actualVacantSeats > 0) {
          try {
            // Use transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
              // Create room allocation
              const allocation = await tx.roomAllocation.create({
                data: {
                  studentId: student.id,
                  roomId: room.id,
                  semester: student.semester,
                  year: student.year,
                  isActive: true,
                },
              });

              // Update room's vacant seats
              await tx.room.update({
                where: { id: room.id },
                data: {
                  vacantSeats: actualVacantSeats - 1,
                },
              });
            });

            allocationResults.push({
              studentId: student.id,
              studentName: student.fullName,
              roomId: room.id,
              roomNumber: room.roomNumber,
              hostelName: room.hostel.name,
            });

            allocated = true;
            break;
          } catch (error) {
            errors.push({
              studentId: student.id,
              studentName: student.fullName,
              error: "Failed to allocate room",
            });
          }
        }
      }

      if (!allocated) {
        errors.push({
          studentId: student.id,
          studentName: student.fullName,
          error: "No rooms available",
        });
      }
    }

    res.status(200).json({
      message: "Bulk allocation completed",
      totalStudents: unallocatedStudents.length,
      allocated: allocationResults.length,
      failed: errors.length,
      allocations: allocationResults,
      errors: errors,
    });
  } catch (error) {
    console.error("Error in bulk hostel allocation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Deallocate student's room
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

// Delete warden
export const deleteWarden = async (req, res) => {
  try {
    const { wardenId } = req.params;

    // Check if warden exists and get their details
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
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

    // Delete warden and all related data in a transaction
    await prisma.$transaction([
      // Delete all warden-hostel relationships
      prisma.wardenHostel.deleteMany({
        where: { wardenId: Number.parseInt(wardenId) },
      }),
      // Delete the warden
      prisma.warden.delete({
        where: { id: Number.parseInt(wardenId) },
      }),
      // Delete the associated user
      prisma.user.delete({
        where: { id: warden.userId },
      }),
    ]);

    // Send email notification
    await sendEMail({
      to: warden.user.email,
      subject: "Your Account Deleted",
      html: `
    <p>Hello ${warden.fullName},</p>
    <p> Your warden account has been deleted from the system.</p>
  `,
    });

    res.status(200).json({
      message: "Warden deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting warden:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete student
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
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if student exists and get their details
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        user: true,
        roomAllocations: {
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

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete student and all related data in a transaction

    // Send email notification

    res.status(200).json({
      message: "Student date fetched successfully",
      data: student,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStudent = async (req, res) => {
  const {studentId} = req.params;
  console.log('studentId: ', studentId);
  const {
    fullName,
    fatherName,
    gender,
    department,
    rank,
    registrationNo,
    rollNo,
    year,
    semester,
    aadharNo,
    mobileNo,
    address,
    pinCode,
    distanceFromCollege,
  } = req.body;

  // ✅ Validate required fields
  if (
    !fullName ||
    !fatherName ||
    !gender ||
    !department ||
    rank === undefined ||
    !registrationNo ||
    !rollNo ||
    year === undefined ||
    semester === undefined ||
    !aadharNo ||
    !mobileNo ||
    !address ||
    !pinCode ||
    distanceFromCollege === undefined
  ) {
    return res.status(400).json({
      message: "All required fields must be provided",
    });
  }

  try {
    const student = await prisma.student.update({
      where: { id: Number.parseInt(studentId) },
      data: {
        fullName,
        fatherName,
        gender,
        department,
        rank,
        registrationNo,
        rollNo,
        year,
        semester,
        aadharNo,
        mobileNo,
        address,
        pinCode,
        distanceFromCollege
      },
    });

    return res
      .status(200)
      .json({ message: "Student updated successfully", student });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: `Unique constraint failed on field: ${error.meta?.target}`,
      });
    }
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};
// Allocate room for a student
export const allocateRoom = async (req, res) => {
  try {
    const { studentId, hostelId, roomId } = req.body;

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

// Create warden
export const createWarden = async (req, res) => {
  try {
    const {
      email,
      fullName,
      fatherName,
      mobileNo,
      aadharNo,
      address,
      zipCode,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !fullName ||
      !fatherName ||
      !mobileNo ||
      !aadharNo ||
      !address ||
      !zipCode
    ) {
      return res.status(400).json({
        message:
          "All fields are required: email, fullName, fatherName, mobileNo, aadharNo, address, zipCode",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate random password
    const randomPassword = generateRandomPassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create user and warden in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "WARDEN",
        },
      });

      // Create warden profile
      const warden = await tx.warden.create({
        data: {
          userId: user.id,
          fullName,
          fatherName,
          mobileNo,
          aadharNo,
          address,
          zipCode,
          isApproved: true, // Auto-approve when created by admin
        },
      });

      return { user, warden };
    });

    // Send welcome email with credentials
    try {
      await sendEMail({
        to: email,
        subject: "Your Warden Account Credentials",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Hostel Management System</h2>
            <p>Hello ${fullName},</p>
            <p>Your warden account has been created successfully. You can now login to the system.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #555;">Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${randomPassword}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>Important:</strong> Please change your password after your first login for security purposes.
            </p>
            <p>Best regards,<br>Hostel Management Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      message: "Warden created successfully",
      warden: {
        id: result.warden.id,
        fullName: result.warden.fullName,
        email: result.user.email,
        isApproved: result.warden.isApproved,
        password: randomPassword,
      },
    });
  } catch (error) {
    console.error("Error creating warden:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update warden
export const updateWarden = async (req, res) => {
  try {
    const { wardenId } = req.params;
    const {
      fullName,
      fatherName,
      mobileNo,
      aadharNo,
      address,
      zipCode,
      isApproved,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !fatherName ||
      !mobileNo ||
      !aadharNo ||
      !address ||
      !zipCode
    ) {
      return res.status(400).json({
        message:
          "All fields are required: fullName, fatherName, mobileNo, aadharNo, address, zipCode",
      });
    }

    // Check if warden exists
    const existingWarden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
      },
    });

    if (!existingWarden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // Update warden profile
    const updatedWarden = await prisma.warden.update({
      where: { id: Number.parseInt(wardenId) },
      data: {
        fullName,
        fatherName,
        mobileNo,
        aadharNo,
        address,
        zipCode,
        isApproved:
          isApproved !== undefined ? isApproved : existingWarden.isApproved,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Warden updated successfully",
      warden: {
        id: updatedWarden.id,
        fullName: updatedWarden.fullName,
        fatherName: updatedWarden.fatherName,
        mobileNo: updatedWarden.mobileNo,
        aadharNo: updatedWarden.aadharNo,
        address: updatedWarden.address,
        zipCode: updatedWarden.zipCode,
        isApproved: updatedWarden.isApproved,
        email: updatedWarden.user.email,
      },
    });
  } catch (error) {
    console.error("Error updating warden:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single warden by ID
export const getWarden = async (req, res) => {
  try {
    const { wardenId } = req.params;

    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        hostels: {
          include: {
            hostel: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    res.status(200).json({
      message: "Warden details fetched successfully",
      warden: {
        id: warden.id,
        fullName: warden.fullName,
        fatherName: warden.fatherName,
        mobileNo: warden.mobileNo,
        aadharNo: warden.aadharNo,
        address: warden.address,
        zipCode: warden.zipCode,
        isApproved: warden.isApproved,
        email: warden.user.email,
        hostels: warden.hostels.map((wh) => wh.hostel),
        createdAt: warden.createdAt,
        updatedAt: warden.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching warden:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      where: {
        userId: {
          not: req.user.id, // Filter out current logged-in admin
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get specific admin by ID
export const getAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: Number.parseInt(adminId) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update admin details
export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { fullName, email } = req.body;

    // Validate required fields
    if (!fullName || !email) {
      return res.status(400).json({
        message: "fullName and email are required fields",
        received: { fullName, email },
      });
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: Number.parseInt(adminId) },
      include: {
        user: true,
      },
    });

    if (!existingAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if email is being changed and if it conflicts with another user
    if (email !== existingAdmin.user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update admin and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user email
      const updatedUser = await tx.user.update({
        where: { id: existingAdmin.userId },
        data: { email },
      });

      // Update admin details
      const updatedAdmin = await tx.admin.update({
        where: { id: Number.parseInt(adminId) },
        data: { fullName },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      return updatedAdmin;
    });

    res.status(200).json({
      message: "Admin updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: Number.parseInt(adminId) },
      include: {
        user: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent deletion of the current admin (optional security measure)
    if (req.user && req.user.id === admin.userId) {
      return res.status(400).json({
        message: "Cannot delete your own account",
        details: "Please contact another admin to delete your account",
      });
    }

    // Delete admin and associated user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete admin profile
      await tx.admin.delete({
        where: { id: Number.parseInt(adminId) },
      });

      // Delete user account
      await tx.user.delete({
        where: { id: admin.userId },
      });
    });

    res.status(200).json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign warden to hostel
export const assignWardenToHostel = async (req, res) => {
  try {
    const { wardenId, hostelId } = req.body;

    // Check if warden exists and is approved
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
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

    if (!warden.isApproved) {
      return res
        .status(400)
        .json({ message: "Warden must be approved before assignment" });
    }

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Check if warden is already assigned to this hostel
    const existingAssignment = warden.hostels.find(
      (wh) => wh.hostelId === Number.parseInt(hostelId)
    );

    if (existingAssignment) {
      return res.status(400).json({
        message: "Warden is already assigned to this hostel",
      });
    }

    // Create hostel assignment
    const wardenHostel = await prisma.wardenHostel.create({
      data: {
        wardenId: Number.parseInt(wardenId),
        hostelId: Number.parseInt(hostelId),
      },
      include: {
        hostel: true,
        warden: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: "Warden assigned to hostel successfully",
      assignment: wardenHostel,
    });
  } catch (error) {
    console.error("Error assigning warden to hostel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// remove warden from hostel

// Get all warden-hostel assignments
export const getWardenHostelAssignments = async (req, res) => {
  try {
    const assignments = await prisma.wardenHostel.findMany({
      include: {
        warden: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        hostel: true,
      },
      orderBy: [{ warden: { fullName: "asc" } }, { hostel: { name: "asc" } }],
    });

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching warden-hostel assignments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get assignments by warden ID
export const getWardenAssignments = async (req, res) => {
  try {
    const { wardenId } = req.params;

    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        hostels: {
          include: {
            hostel: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    res.status(200).json({
      warden: {
        id: warden.id,
        fullName: warden.fullName,
        email: warden.user.email,
        isApproved: warden.isApproved,
      },
      assignedHostels: warden.hostels.map((wh) => wh.hostel),
    });
  } catch (error) {
    console.error("Error fetching warden assignments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get assignments by hostel ID
export const getHostelAssignments = async (req, res) => {
  try {
    const { hostelId } = req.params;

    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        wardens: {
          include: {
            warden: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    res.status(200).json({
      hostel: {
        id: hostel.id,
        name: hostel.name,
        type: hostel.type,
      },
      assignedWardens: hostel.wardens.map((wh) => ({
        id: wh.warden.id,
        fullName: wh.warden.fullName,
        email: wh.warden.user.email,
        isApproved: wh.warden.isApproved,
      })),
    });
  } catch (error) {
    console.error("Error fetching hostel assignments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Bulk assign wardens to hostels
export const bulkAssignWardensToHostels = async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { wardenId, hostelId }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res
        .status(400)
        .json({ message: "Assignments array is required and cannot be empty" });
    }

    const results = [];
    const errors = [];

    for (const assignment of assignments) {
      try {
        const { wardenId, hostelId } = assignment;

        // Check if warden exists and is approved
        const warden = await prisma.warden.findUnique({
          where: { id: Number.parseInt(wardenId) },
        });

        if (!warden) {
          errors.push({
            wardenId,
            hostelId,
            error: "Warden not found",
          });
          continue;
        }

        if (!warden.isApproved) {
          errors.push({
            wardenId,
            hostelId,
            error: "Warden must be approved before assignment",
          });
          continue;
        }

        // Check if hostel exists
        const hostel = await prisma.hostel.findUnique({
          where: { id: Number.parseInt(hostelId) },
        });

        if (!hostel) {
          errors.push({
            wardenId,
            hostelId,
            error: "Hostel not found",
          });
          continue;
        }

        // Check if assignment already exists
        const existingAssignment = await prisma.wardenHostel.findUnique({
          where: {
            wardenId_hostelId: {
              wardenId: Number.parseInt(wardenId),
              hostelId: Number.parseInt(hostelId),
            },
          },
        });

        if (existingAssignment) {
          errors.push({
            wardenId,
            hostelId,
            error: "Assignment already exists",
          });
          continue;
        }

        // Create assignment
        const wardenHostel = await prisma.wardenHostel.create({
          data: {
            wardenId: Number.parseInt(wardenId),
            hostelId: Number.parseInt(hostelId),
          },
          include: {
            hostel: true,
            warden: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        });

        results.push(wardenHostel);
      } catch (error) {
        errors.push({
          wardenId: assignment.wardenId,
          hostelId: assignment.hostelId,
          error: "Failed to create assignment",
        });
      }
    }

    res.status(200).json({
      message: `Bulk assignment completed. ${results.length} successful, ${errors.length} failed.`,
      successful: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Error in bulk assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
