import express from "express"
import { registerStudent, registerWarden, login, changePassword } from "../controllers/auth.controller.js"
import { validateRegisterStudent, validateRegisterWarden, validateLogin, validateChangePassword } from "../middleware/validation.middleware.js"
import { authenticateToken } from "../middleware/auth.middleware.js"

const router = express.Router()

// Register routes
router.post("/register/student", validateRegisterStudent, registerStudent)
router.post("/register/warden", validateRegisterWarden, registerWarden)

// Login route
router.post("/login", validateLogin, login)

// Change password route (requires authentication)
router.post("/change-password", authenticateToken, changePassword)

export default router
