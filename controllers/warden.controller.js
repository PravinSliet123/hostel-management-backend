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

    // Get warden with hostel
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: { hostel: true },
    })

    if (!warden || !warden.hostel) {
      return res.status(404).json({ message: "Hostel not assigned" })
    }

    // Get rooms in hostel
    const rooms = await prisma.room.findMany({
      where: { hostelId: warden.hostel.id },
      include: {
        students: true,
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

    // Get warden with hostel
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: { hostel: true },
    })

    if (!warden || !warden.hostel) {
      return res.status(404).json({ message: "Hostel not assigned" })
    }

    // Check if room belongs to warden's hostel
    const room = await prisma.room.findFirst({
      where: {
        id: Number.parseInt(roomId),
        hostelId: warden.hostel.id,
      },
    })

    if (!room) {
      return res.status(404).json({ message: "Room not found in your hostel" })
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

    // Get warden with hostel
    const warden = await prisma.warden.findFirst({
      where: { userId },
      include: { hostel: true },
    })

    if (!warden || !warden.hostel) {
      return res.status(404).json({ message: "Hostel not assigned" })
    }

    // Get students in hostel
    const students = await prisma.student.findMany({
      where: {
        roomAllocation: {
          hostelId: warden.hostel.id,
        },
      },
      include: {
        user: {
          include: {
            payments: true,
          },
        },
      },
    })

    // Format response
    const studentsWithPayments = students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      registrationNo: student.registrationNo,
      payments: student.user.payments,
    }))

    res.status(200).json(studentsWithPayments)
  } catch (error) {
    console.error("Error fetching student payments:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
