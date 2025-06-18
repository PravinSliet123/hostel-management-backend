import prisma from "../config/db.js"

// Calculate seat allotment based on distance and rank
export const calculateAllotment = async (student) => {
  try {
    // Get student gender to determine hostel type
    const hostelType = student.gender === "Male" ? "Boys" : "Girls"

    // Find hostels of the appropriate type
    const hostels = await prisma.hostel.findMany({
      where: { type: hostelType },
      include: {
        rooms: {
          where: { vacantSeats: { gt: 0 } },
        },
      },
    })

    if (hostels.length === 0 || !hostels.some((hostel) => hostel.rooms.length > 0)) {
      return {
        success: false,
        message: "No vacant rooms available",
      }
    }

    // Find a room based on priority
    // Priority 1: Distance from college
    // Priority 2: Rank

    // Sort hostels by distance (assuming closer hostels have lower IDs for simplicity)
    const sortedHostels = [...hostels].sort((a, b) => a.id - b.id)

    // Find the first hostel with vacant rooms
    const selectedHostel = sortedHostels.find((hostel) => hostel.rooms.length > 0)

    if (!selectedHostel) {
      return {
        success: false,
        message: "No vacant rooms available",
      }
    }

    // Sort rooms by room number
    const sortedRooms = [...selectedHostel.rooms].sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
    )

    // Select the first room with vacant seats
    const selectedRoom = sortedRooms[0]

    // Update student with room allocation
    await prisma.student.update({
      where: { id: student.id },
      data: {
        roomId: selectedRoom.id,
      },
    })

    // Update room vacant seats
    await prisma.room.update({
      where: { id: selectedRoom.id },
      data: {
        vacantSeats: selectedRoom.vacantSeats - 1,
      },
    })

    return {
      success: true,
      message: "Room allocated successfully",
      hostel: selectedHostel.name,
      room: selectedRoom.roomNumber,
    }
  } catch (error) {
    console.error("Error in seat allotment:", error)
    return {
      success: false,
      message: "Error in seat allotment",
    }
  }
}
