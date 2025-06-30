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

// Validation rules for updating warden (excludes email)
export const validateUpdateWarden = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("fatherName").notEmpty().withMessage("Father name is required"),
  body("mobileNo").notEmpty().withMessage("Mobile number is required"),
  body("aadharNo").notEmpty().withMessage("Aadhar number is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("zipCode").notEmpty().withMessage("Zip code is required"),
  body("isApproved").optional().isBoolean().withMessage("isApproved must be a boolean"),
  validate,
]

// Validation rules for login
export const validateLogin = [
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
]

// Validation rules for change password
export const validateChangePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one lowercase letter, one uppercase letter, and one number"),
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  validate,
]

// Validation rules for admin creation
export const validateCreateAdmin = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  validate,
]

// Validation rules for updating admin
export const validateUpdateAdmin = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  validate,
]

// Validation rules for warden-hostel assignment
export const validateWardenHostelAssignment = [
  body("wardenId").isInt().withMessage("Warden ID must be a valid integer"),
  body("hostelId").isInt().withMessage("Hostel ID must be a valid integer"),
  validate,
]

// Validation rules for bulk warden-hostel assignment
export const validateBulkWardenHostelAssignment = [
  body("assignments").isArray().withMessage("Assignments must be an array"),
  body("assignments.*.wardenId").isInt().withMessage("Each warden ID must be a valid integer"),
  body("assignments.*.hostelId").isInt().withMessage("Each hostel ID must be a valid integer"),
  validate,
]
