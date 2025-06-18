import express from "express"
import { registerStudent, registerWarden, login } from "../controllers/auth.controller.js"
import { validateRegisterStudent, validateRegisterWarden, validateLogin } from "../middleware/validation.middleware.js"

const router = express.Router()

// Register routes
router.post("/register/student", validateRegisterStudent, registerStudent)
router.post("/register/warden", validateRegisterWarden, registerWarden)

// Login route
router.post("/login", validateLogin, login)

export default router
