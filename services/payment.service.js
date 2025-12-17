import { PrismaClient } from "@prisma/client";
import { sendEMail } from "../utils/email.service.js";

const prisma = new PrismaClient();

const penaltyRate = 100; // Rs. 100 penalty per day

const reminderEmailTemplate = ({ name, dueDate, amount, penalty }) => `
  <p>Dear ${name},</p>
  <p>This is a reminder that your payment of Rs. ${amount} is due on ${dueDate}.</p>
  <p>Please note that a penalty of Rs. ${penaltyRate} per day will be charged for overdue payments.</p>
  <p>Thank you,</p>
  <p>Hostel Management</p>
`;

const penaltyEmailTemplate = ({ name, dueDate, amount, penalty, daysOverdue }) => `
  <p>Dear ${name},</p>
  <p>Your payment of Rs. ${amount} was due on ${dueDate} and is now overdue by ${daysOverdue} day(s).</p>
  <p>A penalty of Rs. ${penalty} has been added to your account.</p>
  <p>Please make the payment as soon as possible to avoid further penalties.</p>
  <p>Thank you,</p>
  <p>Hostel Management</p>
`;

export const processDailyPayments = async () => {
  console.log("Processing daily payments...");
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: {
          not: "PAID",
        },
      },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const payment of payments) {
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const timeDiff = dueDate.getTime() - today.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const student = payment.user.student;
      if (!student) continue;

      // Send reminder email one day before due date
      if (dayDiff === 1) {
        await sendEMail({
          to: payment.user.email,
          subject: "Payment Reminder",
          html: reminderEmailTemplate({
            name: student.fullName,
            dueDate: dueDate.toLocaleDateString(),
            amount: payment.amount,
            penalty: payment.penalty,
          }),
        });
      }

      // Apply penalty if overdue
      if (dayDiff < -1) {
        const daysOverdue = Math.abs(dayDiff) - 1;
        const newPenalty = daysOverdue * penaltyRate;

        if (newPenalty > payment.penalty) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              penalty: newPenalty,
              status: "OVERDUE",
            },
          });

          await sendEMail({
            to: payment.user.email,
            subject: "Payment Overdue",
            html: penaltyEmailTemplate({
              name: student.fullName,
              dueDate: dueDate.toLocaleDateString(),
              amount: payment.amount,
              penalty: newPenalty,
              daysOverdue: daysOverdue,
            }),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error processing daily payments:", error);
  }
};