import prisma from "../config/db.js"
import bcrypt from "bcrypt"
import { generateUID } from "../utils/uid.generator.js"
import { sendEMail } from "../utils/email.service.js"

// Get all hostels
export const getAllHostels = async (req, res) => {
  console.log("req=>", req)
  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        rooms: {}
      }
    })

    res.status(200).json(hostels)
  } catch (error) {
    console.error("Error fetching hostels:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
export const getHostel = async (req, res) => {
  try {
    const { hostelId } = req.params

    // Check if student exists and get their details
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        rooms: {

        }
      }
    })

    if (!hostel) {
      return res.status(404).json({ message: "Student not found" })
    }

    res.status(200).json({
      message: "Student date fetched successfully",
      data: hostel

    })
  } catch (error) {
    console.error("Error deleting student:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
// Create hostel
export const createHostel = async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" })
    }

    const { name, type } = req.body

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required fields",
        received: { name, type }
      })
    }

    // Check if hostel already exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { name },
    })

    if (existingHostel) {
      return res.status(400).json({ message: "Hostel already exists" })
    }

    // Create hostel
    const hostel = await prisma.hostel.create({
      data: {
        name,
        type,
      },
    })

    res.status(201).json({
      message: "Hostel created successfully",
      hostel,
    })
  } catch (error) {
    console.error("Error creating hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Create room
export const createRoom = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is required" })
    }

    const { hostelId, roomNumber, totalSeats, roomType } = req.body

    // Validate required fields
    if (!hostelId || !roomNumber || !totalSeats || !roomType) {
      return res.status(400).json({
        message: "hostelId, roomNumber, totalSeats, and roomType are required fields",
        received: { hostelId, roomNumber, totalSeats, roomType }
      })
    }

    // Convert roomNumber to string and validate other fields
    const roomNumberStr = String(roomNumber)
    const hostelIdNum = Number.parseInt(hostelId)
    const totalSeatsNum = Number.parseInt(totalSeats)

    if (isNaN(hostelIdNum) || isNaN(totalSeatsNum)) {
      return res.status(400).json({
        message: "hostelId and totalSeats must be valid numbers"
      })
    }

    // Validate roomType
    if (!['SINGLE', 'DOUBLE', 'TRIPLE'].includes(roomType)) {
      return res.status(400).json({
        message: "roomType must be one of: SINGLE, DOUBLE, TRIPLE"
      })
    }

    // Validate totalSeats based on roomType
    const expectedSeats = {
      'SINGLE': 1,
      'DOUBLE': 2,
      'TRIPLE': 3
    }

    if (totalSeatsNum !== expectedSeats[roomType]) {
      return res.status(400).json({
        message: `Total seats must be ${expectedSeats[roomType]} for ${roomType} room type`
      })
    }

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelIdNum },
    })

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }

    // Check if room already exists
    const existingRoom = await prisma.room.findFirst({
      where: {
        hostelId: hostelIdNum,
        roomNumber: roomNumberStr,
      },
    })

    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists in this hostel" })
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
    })

    // Update hostel room counts
    await prisma.hostel.update({
      where: { id: hostelIdNum },
      data: {
        totalRooms: {
          increment: 1
        },
        vacantRooms: {
          increment: 1
        }
      }
    })

    res.status(201).json({
      message: "Room created successfully",
      room,
    })
  } catch (error) {
    console.error("Error creating room:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all wardens with optional approval status filter
export const getAllWardens = async (req, res) => {
  try {
    const { isApproved } = req.query;

    // Build where clause based on query parameters
    const whereClause = {};
    if (isApproved !== undefined) {
      whereClause.isApproved = isApproved === 'true';
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
    const transformedWardens = wardens.map(warden => ({
      ...warden,
      hostels: warden.hostels.map(wh => wh.hostel),
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
      return res.status(400).json({ message: "Request body is required" })
    }

    const { wardenId } = req.params
    const { hostelId } = req.body

    // Check if warden exists
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
        hostels: {
          include: {
            hostel: true
          }
        }
      },
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
    })

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }

    // Check if warden is already assigned to this hostel
    const existingAssignment = warden.hostels.find(
      wh => wh.hostelId === Number.parseInt(hostelId)
    )

    if (existingAssignment) {
      return res.status(400).json({
        message: "Warden is already assigned to this hostel"
      })
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
          hostel: true
        }
      })
    ])


    res.status(200).json({
      message: "Warden approved and assigned to hostel successfully",
      warden: {
        ...updatedWarden,
        hostels: [...warden.hostels, wardenHostel]
      }
    })
  } catch (error) {
    console.error("Error approving warden:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Reject warden
export const rejectWarden = async (req, res) => {
  try {
    const { wardenId } = req.params

    // Check if warden exists
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
      },
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    // Delete warden and user
    await prisma.$transaction([
      prisma.warden.delete({
        where: { id: Number.parseInt(wardenId) },
      }),
      prisma.user.delete({
        where: { id: warden.userId },
      }),
    ])

    res.status(200).json({
      message: "Warden rejected successfully",
    })
  } catch (error) {
    console.error("Error rejecting warden:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        roomAllocations: {
          where: {
            isActive: true
          },
          include: {
            room: {
              include: {
                hostel: {
                  select: {
                    id: true,
                    name: true,
                    type: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the response to make it more frontend-friendly
    const transformedStudents = students.map(student => ({
      ...student,
      currentRoom: student.roomAllocations[0] || null,
      roomAllocations: undefined // Remove the array since we only need current room
    }))

    res.status(200).json(transformedStudents)
  } catch (error) {
    console.error("Error fetching students:", error)
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "No students found" })
    }
    res.status(500).json({ message: "Internal server error" })
  }
}


// Create admin
export const createAdmin = async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "ADMIN",
        },
      })

      // Create admin profile
      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          fullName,
        },
      })

      return { user, admin }
    })

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
      console.error("Error sending welcome email:", emailError)
      // Continue with the response even if email fails
    }

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: result.admin.id,
        fullName: result.admin.fullName,
        email: result.user.email
      }
    })
  } catch (error) {
    console.error("Error creating admin:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Create payment for student
export const createPayment = async (req, res) => {
  try {
    const { studentId, amount, description, dueDate } = req.body

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: student.userId,
        amount: Number.parseFloat(amount),
        description,
        dueDate: new Date(dueDate),
      },
    })

    res.status(201).json({
      message: "Payment created successfully",
      payment,
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete hostel
export const deleteHostel = async (req, res) => {
  try {
    const { hostelId } = req.params

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        rooms: {
          include: {
            allocations: {
              where: {
                isActive: true
              }
            }
          }
        },
        wardens: true
      }
    })

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }

    // Check if hostel has any active students
    const hasActiveStudents = hostel.rooms.some(room => room.allocations.length > 0)
    if (hasActiveStudents) {
      return res.status(400).json({
        message: "Cannot delete hostel with active students",
        details: "Please ensure all students are removed from the hostel before deletion"
      })
    }

    // Check if hostel has any wardens
    if (hostel.wardens.length > 0) {
      return res.status(400).json({
        message: "Cannot delete hostel with assigned wardens",
        details: "Please remove all wardens from the hostel before deletion"
      })
    }

    // Delete hostel and its rooms in a transaction
    await prisma.$transaction([
      // Delete all room allocations in the hostel's rooms
      prisma.roomAllocation.deleteMany({
        where: {
          roomId: {
            in: hostel.rooms.map(room => room.id)
          }
        }
      }),
      // Delete all rooms in the hostel
      prisma.room.deleteMany({
        where: { hostelId: Number.parseInt(hostelId) }
      }),
      // Delete the hostel
      prisma.hostel.delete({
        where: { id: Number.parseInt(hostelId) }
      })
    ])

    res.status(200).json({
      message: "Hostel deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update hostel details
export const updateHostel = async (req, res) => {
  try {
    const { hostelId } = req.params
    const { name, type } = req.body

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required fields",
        received: { name, type }
      })
    }

    // Check if hostel exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) }
    })

    if (!existingHostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }

    // Check if new name conflicts with another hostel
    if (name !== existingHostel.name) {
      const nameConflict = await prisma.hostel.findUnique({
        where: { name }
      })
      if (nameConflict) {
        return res.status(400).json({ message: "A hostel with this name already exists" })
      }
    }

    // Update hostel
    const updatedHostel = await prisma.hostel.update({
      where: { id: Number.parseInt(hostelId) },
      data: {
        name,
        type
      }
    })

    res.status(200).json({
      message: "Hostel updated successfully",
      hostel: updatedHostel
    })
  } catch (error) {
    console.error("Error updating hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Remove warden from hostel
export const removeWardenFromHostel = async (req, res) => {
  try {
    const { hostelId, wardenId } = req.params

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
      include: {
        wardens: {
          where: { wardenId: Number.parseInt(wardenId) }
        }
      }
    })

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }

    // Check if warden is assigned to this hostel
    if (hostel.wardens.length === 0) {
      return res.status(400).json({ message: "Warden is not assigned to this hostel" })
    }

    // Remove warden from hostel
    await prisma.wardenHostel.delete({
      where: {
        wardenId_hostelId: {
          wardenId: Number.parseInt(wardenId),
          hostelId: Number.parseInt(hostelId)
        }
      }
    })

    res.status(200).json({
      message: "Warden removed from hostel successfully"
    })
  } catch (error) {
    console.error("Error removing warden from hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Remove student from hostel
export const removeStudentFromHostel = async (req, res) => {
  try {
    const { studentId } = req.params

    // Check if student exists and has an active room allocation
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        roomAllocations: {
          where: { isActive: true },
          include: {
            room: true
          }
        }
      }
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    if (student.roomAllocations.length === 0) {
      return res.status(400).json({ message: "Student is not allocated to any hostel" })
    }

    // Update room allocation and room vacancy in a transaction
    await prisma.$transaction(async (tx) => {
      // Update room allocation
      await tx.roomAllocation.update({
        where: { id: student.roomAllocations[0].id },
        data: { isActive: false }
      })

      // Update room vacancy
      await tx.room.update({
        where: { id: student.roomAllocations[0].room.id },
        data: {
          vacantSeats: {
            increment: 1
          }
        }
      })
    })

    res.status(200).json({
      message: "Student removed from hostel successfully"
    })
  } catch (error) {
    console.error("Error removing student from hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Bulk allocate hostels to students based on distance
export const allocateHostelsBulk = async (req, res) => {
  try {
    // Get all students who don't have an active room allocation
    const unallocatedStudents = await prisma.student.findMany({
      where: {
        roomAllocations: {
          none: {
            isActive: true
          }
        }
      },
      orderBy: {
        distanceFromCollege: 'desc' // Sort by distance in descending order
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Get all rooms with their current allocations
    const availableRooms = await prisma.room.findMany({
      where: {
        vacantSeats: {
          gt: 0
        }
      },
      include: {
        hostel: true,
        allocations: {
          where: {
            isActive: true
          }
        }
      }
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
                  isActive: true
                }
              });

              // Update room's vacant seats
              await tx.room.update({
                where: { id: room.id },
                data: {
                  vacantSeats: actualVacantSeats - 1
                }
              });
            });

            allocationResults.push({
              studentId: student.id,
              studentName: student.fullName,
              roomId: room.id,
              roomNumber: room.roomNumber,
              hostelName: room.hostel.name
            });

            allocated = true;
            break;
          } catch (error) {
            errors.push({
              studentId: student.id,
              studentName: student.fullName,
              error: "Failed to allocate room"
            });
          }
        }
      }

      if (!allocated) {
        errors.push({
          studentId: student.id,
          studentName: student.fullName,
          error: "No rooms available"
        });
      }
    }

    res.status(200).json({
      message: "Bulk allocation completed",
      totalStudents: unallocatedStudents.length,
      allocated: allocationResults.length,
      failed: errors.length,
      allocations: allocationResults,
      errors: errors
    });

  } catch (error) {
    console.error("Error in bulk hostel allocation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Deallocate student's room
export const deallocateStudentRoom = async (req, res) => {
  try {
    const { studentId } = req.params

    // Check if student exists and has an active room allocation
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        roomAllocations: {
          where: { isActive: true },
          include: {
            room: true
          }
        }
      }
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    if (student.roomAllocations.length === 0) {
      return res.status(400).json({ message: "Student is not allocated to any room" })
    }

    // Update room allocation and room vacancy in a transaction
    await prisma.$transaction(async (tx) => {
      // Update room allocation with deallocation timestamp
      await tx.roomAllocation.update({
        where: { id: student.roomAllocations[0].id },
        data: {
          isActive: false,
          deallocatedAt: new Date()
        }
      })

      // Update room vacancy
      await tx.room.update({
        where: { id: student.roomAllocations[0].room.id },
        data: {
          vacantSeats: {
            increment: 1
          }
        }
      })
    })

    res.status(200).json({
      message: "Student's room deallocated successfully"
    })
  } catch (error) {
    console.error("Error deallocating student's room:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete warden
export const deleteWarden = async (req, res) => {
  try {
    const { wardenId } = req.params

    // Check if warden exists and get their details
    const warden = await prisma.warden.findUnique({
      where: { id: Number.parseInt(wardenId) },
      include: {
        user: true,
        hostels: {
          include: {
            hostel: true
          }
        }
      },
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    // Delete warden and all related data in a transaction
    await prisma.$transaction([
      // Delete all warden-hostel relationships
      prisma.wardenHostel.deleteMany({
        where: { wardenId: Number.parseInt(wardenId) }
      }),
      // Delete the warden
      prisma.warden.delete({
        where: { id: Number.parseInt(wardenId) }
      }),
      // Delete the associated user
      prisma.user.delete({
        where: { id: warden.userId }
      })
    ])

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
    })
  } catch (error) {
    console.error("Error deleting warden:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params

    // Check if student exists and get their details
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        user: true,
        roomAllocations: {
          where: { isActive: true },
          include: {
            room: true
          }
        }
      },
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Delete student and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // If student has active room allocation, update room vacancy
      if (student.roomAllocations.length > 0) {
        await tx.room.update({
          where: { id: student.roomAllocations[0].roomId },
          data: {
            vacantSeats: {
              increment: 1
            }
          }
        })
      }

      // Delete all room allocations
      await tx.roomAllocation.deleteMany({
        where: { studentId: Number.parseInt(studentId) }
      })

      // Delete the student
      await tx.student.delete({
        where: { id: Number.parseInt(studentId) }
      })

      // Delete the associated user
      await tx.user.delete({
        where: { id: student.userId }
      })
    })

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
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
export const getStudent = async (req, res) => {
  try {
    const { studentId } = req.params

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
              }
            },
          },

        },

      }
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Delete student and all related data in a transaction


    // Send email notification

    res.status(200).json({
      message: "Student date fetched successfully",
      data: student

    })
  } catch (error) {
    console.error("Error deleting student:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Allocate room for a student
export const allocateRoom = async (req, res) => {
  try {
    const { studentId, hostelId, roomId } = req.body

    // Validate required fields
    if (!studentId || !hostelId || !roomId) {
      return res.status(400).json({
        message: "studentId, hostelId, and roomId are required fields"
      })
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: Number.parseInt(studentId) },
      include: {
        roomAllocations: {
          where: { isActive: true }
        }
      }
    })

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if student already has an active room allocation
    if (student.roomAllocations.length > 0) {
      return res.status(400).json({
        message: "Student already has an active room allocation"
      })
    }

    // Check if room exists and belongs to the specified hostel
    const room = await prisma.room.findFirst({
      where: {
        id: Number.parseInt(roomId),
        hostelId: Number.parseInt(hostelId),
        vacantSeats: { gt: 0 }
      }
    })

    if (!room) {
      return res.status(404).json({
        message: "Room not found or no vacant seats available"
      })
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
          isActive: true
        }
      }),
      // Update room vacancy
      prisma.room.update({
        where: { id: Number.parseInt(roomId) },
        data: {
          vacantSeats: {
            decrement: 1
          }
        }
      })
    ])

    res.status(201).json({
      message: "Room allocated successfully",
      allocation
    })
  } catch (error) {
    console.error("Error allocating room:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
