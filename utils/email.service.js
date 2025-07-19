import nodemailer from "nodemailer";

//Send email
export const sendEMail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or SMTP details
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: {
      name: "Hostel Management System Buxar Support",
      address: process.env.EMAIL_FROM,
    },
    to,
    subject,
    html,
  });
};
