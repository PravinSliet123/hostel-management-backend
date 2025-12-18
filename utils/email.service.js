import nodemailer from "nodemailer";

//Send email
// Send email
export const sendEMail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
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
    attachments: attachments || [],     // ⬅ IMPORTANT
  });
};

export const forgotPasswordEmailHTML = ({ name, resetLink }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px;">
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="500" style="background: #ffffff; padding: 25px; border-radius: 8px;">
          <tr>
            <td>
              <h2 style="color: #333;">Reset Your Password</h2>
              <p style="color: #555;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="color: #555;">
                We received a request to reset your password. Click the button below to continue.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}"
                  style="
                    background: #2563eb;
                    color: #ffffff;
                    padding: 12px 22px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                  ">
                  Reset Password
                </a>
              </div>

              <p style="color: #777; font-size: 14px;">
                This link will expire in <strong>15 minutes</strong>.
              </p>

              <p style="color: #777; font-size: 14px;">
                If you did not request this, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #eee;" />

              <p style="color: #999; font-size: 12px;">
                Hostel Management System Buxar Support
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

