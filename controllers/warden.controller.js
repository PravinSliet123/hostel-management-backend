import prisma from "../config/db.js"

// Get warden profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id

    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: {
        hostel: true,
      },
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    res.status(200).json(warden)
  } catch (error) {
    console.error("Error fetching warden profile:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update warden profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { fullName, mobileNo, address, zipCode } = req.body

    const updatedWarden = await prisma.warden.update({
      where: { userId },
      data: {
        fullName,
        mobileNo,
        address,
        zipCode,
      },
    })

    res.status(200).json({
      message: "Profile updated successfully",
      warden: updatedWarden,
    })
  } catch (error) {
    console.error("Error updating warden profile:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get rooms in hostel
export const getRooms = async (req, res) => {
  try {
    const userId = req.user.id

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
    })

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" })
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map((wardenHostel) => wardenHostel.hostelId)

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
    })

    res.status(200).json(rooms)
  } catch (error) {
    console.error("Error fetching rooms:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update room details
export const updateRoom = async (req, res) => {
  try {
    const userId = req.user.id
    const { roomId } = req.params
    const { totalSeats, vacantSeats } = req.body

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
    })

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" })
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map((wardenHostel) => wardenHostel.hostelId)

    // Check if room belongs to any of warden's hostels
    const room = await prisma.room.findFirst({
      where: {
        id: Number.parseInt(roomId),
        hostelId: {
          in: hostelIds,
        },
      },
    })

    if (!room) {
      return res.status(404).json({ message: "Room not found in your assigned hostels" })
    }

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id: Number.parseInt(roomId) },
      data: {
        totalSeats,
        vacantSeats,
      },
    })

    res.status(200).json({
      message: "Room updated successfully",
      room: updatedRoom,
    })
  } catch (error) {
    console.error("Error updating room:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get student payment status
export const getStudentPayments = async (req, res) => {
  try {
    const userId = req.user.id

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
    })

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" })
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map((wardenHostel) => wardenHostel.hostelId)

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
                createdAt: 'desc',
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
    })

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
        hostel: activeAllocation?.room?.hostel?.name || 'Not allocated',
        roomNumber: activeAllocation?.room?.roomNumber || 'Not allocated',
        payments: student.user.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        })),
        totalPayments: student.user.payments.length,
        pendingPayments: student.user.payments.filter(p => p.status === 'PENDING').length,
        paidPayments: student.user.payments.filter(p => p.status === 'PAID').length,
        overduePayments: student.user.payments.filter(p => p.status === 'OVERDUE').length,
      }
    })

    res.status(200).json({
      message: "Student payment status retrieved successfully",
      totalStudents: studentsWithPayments.length,
      students: studentsWithPayments,
    })
  } catch (error) {
    console.error("Error fetching student payments:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all hostels assigned to warden
export const getHostels = async (req, res) => {
  try {
    const userId = req.user.id
    console.log("userId", userId)
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
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    // Extract hostels from the relationship
    const hostels = warden.hostels.map((wardenHostel) => wardenHostel.hostel)

    res.status(200).json(hostels)
  } catch (error) {
    console.error("Error fetching hostels:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get rooms of a specific hostel
export const getHostelRooms = async (req, res) => {
  try {
    const userId = req.user.id
    const { hostelId } = req.params

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
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    // Check if warden is assigned to this hostel
    const isAssigned = warden.hostels.some(
      (wardenHostel) => wardenHostel.hostelId === Number.parseInt(hostelId)
    )

    if (!isAssigned) {
      return res.status(403).json({ message: "Not authorized to access this hostel" })
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
    })

    res.status(200).json(rooms)
  } catch (error) {
    console.error("Error fetching hostel rooms:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get details of a single hostel
export const getHostelDetails = async (req, res) => {
  try {
    const userId = req.user.id
    const { hostelId } = req.params
    console.log("hossss",Number(hostelId))

    // Get warden with assigned hostels
    const hostelById = await prisma.hostel.findFirst({
      where: { id:Number(hostelId) },
      include: {
      rooms:{}
      },
    })


    // Get hostel details with room statistics



    const hostelWithStats = {
     data:hostelById
    }


    res.status(200).json(hostelWithStats)
  } catch (error) {
    console.error("Error fetching hostel details:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get details of a single room
export const getRoomDetails = async (req, res) => {
  try {
    const userId = req.user.id
    const { roomId } = req.params

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
    })

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
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
    })

    if (!room) {
      return res.status(404).json({ message: "Room not found" })
    }

    // Check if warden is assigned to this room's hostel
    const isAssigned = warden.hostels.some(
      (wardenHostel) => wardenHostel.hostelId === room.hostelId
    )

    if (!isAssigned) {
      return res.status(403).json({ message: "Not authorized to access this room" })
    }

    // Calculate room statistics
    const roomWithStats = {
      ...room,
      statistics: {
        occupancyRate: room.totalSeats > 0 ? (((room.totalSeats - room.vacantSeats) / room.totalSeats) * 100).toFixed(2) : 0,
        availableSeats: room.vacantSeats,
        occupiedSeats: room.totalSeats - room.vacantSeats,
      },
    }

    res.status(200).json(roomWithStats)
  } catch (error) {
    console.error("Error fetching room details:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get student payment status for a specific hostel
export const getStudentPaymentsByHostel = async (req, res) => {
  try {
    const userId = req.user.id
    const { hostelId } = req.params

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
    })
    console.log("warden=>",warden)

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" })
    }

    // Check if warden is assigned to this hostel
    const isAssigned = warden.hostels.some(
      (wardenHostel) => wardenHostel.hostelId === Number.parseInt(hostelId)
    )

    if (!isAssigned) {
      return res.status(403).json({ message: "Not authorized to access this hostel" })
    }

    // Get students in the specific hostel
    const students = await prisma.student.findMany({
      where: {
        roomAllocations: {
          some: {
            room: {
              hostelId: Number.parseInt(hostelId),
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
                createdAt: 'desc',
              },
            },
          },
        },
        roomAllocations: {
          where: {
            room: {
              hostelId: Number.parseInt(hostelId),
            },
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
    })

    // Format response with detailed information
    const studentsWithPayments = students.map((student) => {
      const activeAllocation = student.roomAllocations[0];
      
      return {
        id: student.id,
        fullName: student.fullName,
        registrationNo: student.registrationNo,
        rollNo: student.rollNo,
        department: student.department,
        year: student.year,
        semester: student.semester,
        roomNumber: activeAllocation?.room?.roomNumber || 'Not allocated',
        payments: student.user.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        })),
        totalPayments: student.user.payments.length,
        pendingPayments: student.user.payments.filter(p => p.status === 'PENDING').length,
        paidPayments: student.user.payments.filter(p => p.status === 'PAID').length,
        overduePayments: student.user.payments.filter(p => p.status === 'OVERDUE').length,
        totalAmount: student.user.payments.reduce((sum, p) => sum + p.amount, 0),
        paidAmount: student.user.payments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + p.amount, 0),
        pendingAmount: student.user.payments
          .filter(p => p.status === 'PENDING')
          .reduce((sum, p) => sum + p.amount, 0),
        overdueAmount: student.user.payments
          .filter(p => p.status === 'OVERDUE')
          .reduce((sum, p) => sum + p.amount, 0),
      }
    })

    // Get hostel details
    const hostel = await prisma.hostel.findUnique({
      where: { id: Number.parseInt(hostelId) },
    })

    res.status(200).json({
      message: "Student payment status retrieved successfully",
      hostel: {
        id: hostel.id,
        name: hostel.name,
        type: hostel.type,
      },
      totalStudents: studentsWithPayments.length,
      summary: {
        totalAmount: studentsWithPayments.reduce((sum, s) => sum + s.totalAmount, 0),
        paidAmount: studentsWithPayments.reduce((sum, s) => sum + s.paidAmount, 0),
        pendingAmount: studentsWithPayments.reduce((sum, s) => sum + s.pendingAmount, 0),
        overdueAmount: studentsWithPayments.reduce((sum, s) => sum + s.overdueAmount, 0),
        studentsWithPendingPayments: studentsWithPayments.filter(s => s.pendingPayments > 0).length,
        studentsWithOverduePayments: studentsWithPayments.filter(s => s.overduePayments > 0).length,
        fullyPaidStudents: studentsWithPayments.filter(s => s.pendingPayments === 0 && s.overduePayments === 0).length,
      },
      students: studentsWithPayments,
    })
  } catch (error) {
    console.error("Error fetching student payments by hostel:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get payment summary statistics for all assigned hostels
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.id

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
    })

    if (!warden || !warden.hostels.length) {
      return res.status(404).json({ message: "No hostels assigned to warden" })
    }

    // Get hostel IDs assigned to this warden
    const hostelIds = warden.hostels.map((wardenHostel) => wardenHostel.hostelId)

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
    })

    // Calculate summary statistics
    const totalStudents = students.length
    const allPayments = students.flatMap(student => student.user.payments)
    
    const summary = {
      totalStudents,
      totalPayments: allPayments.length,
      totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: allPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: allPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: allPayments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0),
      studentsWithPendingPayments: students.filter(s => s.user.payments.some(p => p.status === 'PENDING')).length,
      studentsWithOverduePayments: students.filter(s => s.user.payments.some(p => p.status === 'OVERDUE')).length,
      fullyPaidStudents: students.filter(s => !s.user.payments.some(p => p.status === 'PENDING' || p.status === 'OVERDUE')).length,
      paymentStatusBreakdown: {
        paid: allPayments.filter(p => p.status === 'PAID').length,
        pending: allPayments.filter(p => p.status === 'PENDING').length,
        overdue: allPayments.filter(p => p.status === 'OVERDUE').length,
      },
    }

    // Calculate statistics by hostel
    const hostelStats = await Promise.all(
      warden.hostels.map(async (wardenHostel) => {
        const hostelStudents = students.filter(student =>
          student.roomAllocations.some(allocation =>
            allocation.room.hostelId === wardenHostel.hostelId
          )
        )

        const hostelPayments = hostelStudents.flatMap(student => student.user.payments)

        return {
          hostelId: wardenHostel.hostel.id,
          hostelName: wardenHostel.hostel.name,
          hostelType: wardenHostel.hostel.type,
          totalStudents: hostelStudents.length,
          totalAmount: hostelPayments.reduce((sum, p) => sum + p.amount, 0),
          paidAmount: hostelPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
          pendingAmount: hostelPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
          overdueAmount: hostelPayments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0),
          studentsWithPendingPayments: hostelStudents.filter(s => s.user.payments.some(p => p.status === 'PENDING')).length,
          studentsWithOverduePayments: hostelStudents.filter(s => s.user.payments.some(p => p.status === 'OVERDUE')).length,
          fullyPaidStudents: hostelStudents.filter(s => !s.user.payments.some(p => p.status === 'PENDING' || p.status === 'OVERDUE')).length,
        }
      })
    )

    res.status(200).json({
      message: "Payment summary retrieved successfully",
      summary,
      hostelStats,
      assignedHostels: warden.hostels.map(wh => ({
        id: wh.hostel.id,
        name: wh.hostel.name,
        type: wh.hostel.type,
      })),
    })
  } catch (error) {
    console.error("Error fetching payment summary:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
