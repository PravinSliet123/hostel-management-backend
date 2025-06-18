import { body, validationResult } from "express-validator"

// Middleware to validate request
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// Validation rules for student registration
export const validateRegisterStudent = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("fatherName").notEmpty().withMessage("Father name is required"),
  body("gender").notEmpty().withMessage("Gender is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("rank").isInt().withMessage("Rank must be a number"),
  body("registrationNo").notEmpty().withMessage("Registration number is required"),
  body("rollNo").notEmpty().withMessage("Roll number is required"),
  body("year").isInt().withMessage("Year must be a number"),
  body("semester").isInt().withMessage("Semester must be a number"),
  body("aadharNo").notEmpty().withMessage("Aadhar number is required"),
  body("mobileNo").notEmpty().withMessage("Mobile number is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("pinCode").notEmpty().withMessage("Pin code is required"),
  body("distanceFromCollege").isFloat().withMessage("Distance must be a number"),
  validate,
]

// Validation rules for warden registration
export const validateRegisterWarden = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("fatherName").notEmpty().withMessage("Father name is required"),
  body("mobileNo").notEmpty().withMessage("Mobile number is required"),
  body("aadharNo").notEmpty().withMessage("Aadhar number is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("zipCode").notEmpty().withMessage("Zip code is required"),
  validate,
]

// Validation rules for login
export const validateLogin = [
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
]
