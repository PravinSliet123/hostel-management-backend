// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Check if headers already sent
  if (res.headersSent) {
    return next(err)
  }

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message })
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Unauthorized" })
  }

  // Default error response
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
}
