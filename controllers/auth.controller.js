import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { generateUID } from "../utils/uid.generator.js";
import { forgotPasswordEmailHTML, sendEMail } from "../utils/email.service.js";
import { generateHostelApplicationPDF } from "../utils/pdf.generator.js";

// Generate a random password
const generatePassword = () => {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Register a new student
export const registerStudent = async (req, res) => {
  try {
    const {
      email,
      fullName,
      fatherName,
      gender,
      department,
      rank,
      registrationNo,
      rollNo,
      year,
      semester,
      aadharNo,
      mobileNo,
      address,
      pinCode,
      distanceFromCollege,
      hostelId, // Optional
      roomId, // Optional
      adharCard,
      registrationCard,
      photo,
      prevSemesterMarksheet,
    } = req.body;
    console.log("Body=>", req.body);
    // Generate a random password
    const generatedPassword = generatePassword();

    // Type conversion and validation
    try {
      const numericFields = {
        rank: parseInt(rank),
        year: parseInt(year),
        semester: parseInt(semester),
        distanceFromCollege: parseFloat(distanceFromCollege),
      };

      // Validate numeric fields
      if (isNaN(numericFields.rank)) {
        return res.status(400).json({
          message: "Invalid rank value",
          details: "Rank must be a valid number",
        });
      }
      if (isNaN(numericFields.year)) {
        return res.status(400).json({
          message: "Invalid year value",
          details: "Year must be a valid number",
        });
      }
      if (isNaN(numericFields.semester)) {
        return res.status(400).json({
          message: "Invalid semester value",
          details: "Semester must be a valid number",
        });
      }
      if (isNaN(numericFields.distanceFromCollege)) {
        return res.status(400).json({
          message: "Invalid distance value",
          details: "Distance from college must be a valid number",
        });
      }

      // Check if student exists in master data
      const masterStudent = await prisma.masterStudents.findFirst({
        where: {
          registrationNo,
          rollNo,
        },
      });

      if (!masterStudent) {
        return res.status(400).json({
          message: "Inavlid Registration Number or Roll Number.",
        });
      }

      // Check if user already exists with email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "A user with this email already exists",
          details: "A user with this email already exists",
        });
      }

      // Check if registration number already exists
      const existingRegistration = await prisma.student.findUnique({
        where: { registrationNo },
      });

      if (existingRegistration) {
        return res.status(400).json({
          message: "A student with this registration number already exists",
          details: "A student with this registration number already exists",
        });
      }

      // Check if roll number already exists
      const existingRollNo = await prisma.student.findUnique({
        where: { rollNo },
      });

      if (existingRollNo) {
        return res.status(400).json({
          message: "A student with this roll number already exists",
          details: "A student with this roll number already exists",
        });
      }

      // Validate hostel and room if provided
      let room = null;
      if (hostelId && roomId) {
        room = await prisma.room.findFirst({
          where: {
            id: Number.parseInt(roomId),
            hostelId: Number.parseInt(hostelId),
            vacantSeats: { gt: 0 },
          },
        });

        if (!room) {
          return res.status(400).json({
            message: "Invalid hostel or room",
            details:
              "The specified room is not available or does not exist in the given hostel",
          });
        }

        // Validate room type and seats
        const expectedSeats = {
          SINGLE: 1,
          DOUBLE: 2,
          TRIPLE: 3,
        };

        if (room.totalSeats !== expectedSeats[room.roomType]) {
          return res.status(400).json({
            message: "Invalid room configuration",
            details: `Room type ${room.roomType} should have ${
              expectedSeats[room.roomType]
            } seats`,
          });
        }

        // Check if room has enough vacant seats
        if (room.vacantSeats <= 0) {
          return res.status(400).json({
            message: "Room is full",
            details: `No vacant seats available in room ${room.roomNumber}`,
          });
        }
      }

      // Hash the generated password
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Create user and student in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: "STUDENT",
          },
        });
        console.log("user: ", user);

        // Create student profile with converted numeric values
        const student = await tx.student.create({
          data: {
            userId: user.id,
            fullName,
            fatherName,
            gender,
            department,
            rank: numericFields.rank,
            registrationNo,
            rollNo,
            year: numericFields.year,
            semester: numericFields.semester,
            aadharNo,
            mobileNo,
            address,
            pinCode,
            distanceFromCollege: numericFields.distanceFromCollege,
            adharCard,
            registrationCard,
            photo,
            prevSemesterMarksheet,
          },
        });

        // Create hostel application if hostel and room are provided
        if (hostelId && roomId) {
          await tx.hostelApplication.create({
            data: {
              studentId: student.id,
              hostelId: Number.parseInt(hostelId),
              roomId: Number.parseInt(roomId),

              // Add other relevant data if your schema requires it
            },
          });
        }

        return { user, student, room };
      });

      // Generate UID
      const uid = generateUID(result.student.id);

      await sendEMail({
        to: email,
        subject: "Your Account Credentials",
        html: `
      <p>Hello ${fullName},</p>
      <p>Your account has been created. </br> Now you can login to system </p>
      <p><strong>Login Id:</strong> ${email}</p>
      <p><strong>Password:</strong> ${generatedPassword}</p>
    `,
      });

      // If hostel application was created, generate and send PDF
      if (hostelId && roomId) {
        const hostel = await prisma.hostel.findUnique({
          where: { id: Number.parseInt(hostelId) },
          include: {
            wardens: { include: { warden: { include: { user: true } } } },
          },
        });

        const roomData = await prisma.room.findUnique({
          where: { id: Number.parseInt(roomId) },
        });

        const admins = await prisma.admin.findMany({ include: { user: true } });

        const wardenEmails = hostel.wardens.map((w) => w.warden.user.email);
        const adminEmails = admins.map((a) => a.user.email);
        const recipientEmails = [...new Set([...wardenEmails, ...adminEmails])];

        const pdfData = await generateHostelApplicationPDF({
          ...req.body,
          hostelName: hostel.name,
          roomNumber: roomData.roomNumber,
          roomType: roomData.roomType,
        });
        console.log("pdfData: ", pdfData);

        await sendEMail({
          to: recipientEmails,
          subject: `New Hostel Application from ${fullName}`,
          html: `<p>A new hostel application has been submitted by ${fullName}. Please find the application form attached.</p>`,
          attachments: [
            {
              filename: `hostel_application_${result.student.id}.pdf`,
              content: pdfData,
              contentType: "application/pdf",
            },
          ],
        });
      }

      res.status(201).json({
        message:
          "Student registered successfully. Hostel application submitted if applicable.",
        uid,
        password: generatedPassword, // Include password in response for immediate access
      });
    } catch (error) {
      console.error("Error registering student:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Register a new warden
export const registerWarden = async (req, res) => {
  try {
    const {
      email,
      fullName,
      fatherName,
      mobileNo,
      aadharNo,
      address,
      zipCode,
      hostelNames,
    } = req.body;

    // Generate a random password
    const generatedPassword = generatePassword();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists",
        details: "A user with this email already exists",
      });
    }

    // Find hostels by names if provided
    let hostels = [];
    if (hostelNames && Array.isArray(hostelNames) && hostelNames.length > 0) {
      hostels = await prisma.hostel.findMany({
        where: {
          name: {
            in: hostelNames,
          },
        },
      });

      // Check if all requested hostels were found
      if (hostels.length !== hostelNames.length) {
        const foundHostelNames = hostels.map((h) => h.name);
        const notFoundHostels = hostelNames.filter(
          (name) => !foundHostelNames.includes(name)
        );
        return res.status(400).json({
          message: `The following hostels were not found: ${notFoundHostels.join(
            ", "
          )}`,
          details: `The following hostels were not found: ${notFoundHostels.join(
            ", "
          )}`,
        });
      }
    }

    // Hash the generated password
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create user and warden in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "WARDEN",
        },
      });

      // Create warden profile
      const warden = await tx.warden.create({
        data: {
          userId: user.id,
          fullName,
          fatherName,
          mobileNo,
          aadharNo,
          address,
          zipCode,
          isApproved: false, // Explicitly set to false as it's the default
        },
      });

      // Create warden-hostel relationships if hostels were provided
      if (hostels.length > 0) {
        await tx.wardenHostel.createMany({
          data: hostels.map((hostel) => ({
            wardenId: warden.id,
            hostelId: hostel.id,
          })),
        });
      }

      return { user, warden, hostels };
    });

    // Generate UID
    const uid = generateUID(result.warden.id);

    // Send email with UID and generated password

    await sendEMail({
      to: email,
      subject: "Your Account Credentials",
      html: `
    <p>Hello ${fullName},</p>
    <p>Your account has been created. </br> Now you can login to system </p>
    <p><strong>Login Id:</strong> ${email}</p>
    <p><strong>Password:</strong> ${generatePassword}</p>
  `,
    });

    res.status(201).json({
      message: "Warden registered successfully. Pending admin approval.",
      uid,
      password: generatedPassword, // Include password in response for immediate access
      assignedHostels: result.hostels.map((h) => h.name),
    });
  } catch (error) {
    console.error("Error registering warden:", error);
    res.status(500).json({
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // Find user by email
    let user;
    let userDetails;

    // Check if it's a student
    const student = await prisma.student.findFirst({
      where: { user: { email } },
      include: { user: true },
    });

    if (student) {
      user = student.user;
      userDetails = student;
    } else {
      // Check if it's a warden
      const warden = await prisma.warden.findFirst({
        where: { user: { email } },
        include: { user: true },
      });

      if (warden) {
        user = warden.user;
        userDetails = warden;

        // Check if warden is approved
        if (!warden.isApproved) {
          return res.status(403).json({ message: "Account pending approval" });
        }
      } else {
        // Check if it's an admin
        const admin = await prisma.admin.findFirst({
          where: { user: { email } },
          include: { user: true },
        });

        if (admin) {
          user = admin.user;
          userDetails = admin;
        }
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...userDetails,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Generate new JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Password changed successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, frontend_url } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, admin: true, warden: true },
    });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If email exists, reset link sent" });
    }

    // Create short-lived reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `${frontend_url}/reset-password?token=${resetToken}`;
    const userName =
      user?.student?.fullName ||
      user?.admin?.fullName ||
      user?.warden?.fullName;
    await sendEMail({
      to: user.email,
      subject: "Reset Your Password",
      html: forgotPasswordEmailHTML({
        name: userName || "User",
        resetLink,
      }),
    });

    res.json({ message: "Password reset link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};
