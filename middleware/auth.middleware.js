import jwt from "jsonwebtoken"
import prisma from "../config/db.js"

// Middleware to authenticate JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" })
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      })

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      }
      next()
    })
  } catch (error) {
    console.error("Error authenticating token:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Middleware to check user role
export const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" })
    }
    next()
  }
}
