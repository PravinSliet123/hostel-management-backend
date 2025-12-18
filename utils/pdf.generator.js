import PDFDocument from "pdfkit";

export const generateHostelApplicationPDF = (studentData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Header
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Government Polytechnic Buxar", { align: "center" });
    doc
      .fontSize(14)
      .text("Hostel Registration Application Form", { align: "center" });
    doc
      .fontSize(12)
      .text(
        `Academic Session: ${new Date().getFullYear()}-${
          new Date().getFullYear() + 1
        }`,
        { align: "center" }
      );
    doc.moveDown(2);

    // Personal Information
    doc.fontSize(12).font("Helvetica-Bold").text("Personal Information");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Full Name: ${studentData.fullName}`);
    doc.text(`Father Name: ${studentData.fatherName}`);
    doc.text(`Gender: ${studentData.gender}`);
    doc.text(`Mobile No: ${studentData.mobileNo}`);
    doc.text(`Email: ${studentData.email}`);
    doc.moveDown(2);

    // Academic Information
    doc.fontSize(12).font("Helvetica-Bold").text("Academic Information");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Department: ${studentData.department}`);
    doc
      .font("Helvetica")
      .text(`Registration No: ${studentData.registrationNo}`);
    doc.text(`Roll No: ${studentData.rollNo}`);
    doc.text(`Year: ${studentData.year}`);
    doc.text(`Semester: ${studentData.semester}`);
    doc.text(`Rank: ${studentData.rank}`);
    doc.moveDown(2);

    // Address Information
    doc.fontSize(12).font("Helvetica-Bold").text("Address Information");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Address: ${studentData.address}`);
    doc.text(`Pin Code: ${studentData.pinCode}`);
    doc.text(`Distance from College: ${studentData.distanceFromCollege} KM`);
    doc.moveDown(2);

    // Hostel Information
    doc.fontSize(12).font("Helvetica-Bold").text("Hostel Information");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Hostel: ${studentData.hostelName}`);
    doc.text(`Room: ${studentData.roomNumber} (${studentData.roomType})`);
    doc.moveDown(2);

    // Declaration
    doc
      .fontSize(10)
      .text(
        "I hereby declare that the information provided above is true and correct to the best of my knowledge. I agree to follow all hostel rules and regulations.",
        { align: "left" }
      );
    doc.moveDown(4);

    // Signatures
    doc.text("_________________________");
    doc.text("Student Signature");

    doc.x = 350;
    doc.y -= 25;
    doc.text("_________________________");
    doc.text("Warden Signature", { align: "right" });

    doc.end();
  });
};

export const generateInvoicePDF = (invoiceData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    const { student, payment, room, hostel } = invoiceData;

    // Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Hostel Fee Invoice", { align: "center" });
    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Government Polytechnic Buxar", { align: "center" });
    doc.moveDown(2);

    // Invoice Details
    doc.fontSize(12).font("Helvetica-Bold").text("Invoice Details");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Invoice ID: ${payment.id}`);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Due Date: ${payment.dueDate.toLocaleDateString()}`);
    doc.text(`Semester: ${payment.semester}`);
    doc.text(`Year: ${payment.year}`);
    doc.moveDown(2);

    // Student Information
    doc.fontSize(12).font("Helvetica-Bold").text("Student Information");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Full Name: ${student.fullName}`);
    doc.text(`Registration No: ${student.registrationNo}`);
    doc.text(`Roll No: ${student.rollNo}`);
    doc.moveDown(2);

    // Allocation Details
    doc.fontSize(12).font("Helvetica-Bold").text("Allocation Details");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Hostel: ${hostel.name}`);
    doc.text(`Room Number: ${room.roomNumber}`);
    doc.text(`Room Type: ${room.roomType}`);
    doc.moveDown(2);

    // Payment Details
    doc.fontSize(12).font("Helvetica-Bold").text("Payment Details");
    doc.rect(50, doc.y, 500, 0.5).stroke();
    doc.moveDown();
    doc.font("Helvetica").text(`Description: ${payment.description}`);
    doc.font("Helvetica-Bold").text(`Amount: Rs. ${payment.amount.toFixed(2)}`);
    doc.moveDown(3);

    // Footer
    doc
      .fontSize(10)
      .text(
        `${
          payment.status === "PAID"
            ? "Payment received successfully."
            : "Please pay the amount before the due date to avoid any penalties."
        }`,
        { align: "center" }
      );

    doc.end();
  });
};
