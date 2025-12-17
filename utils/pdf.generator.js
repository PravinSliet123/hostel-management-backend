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
      .text(`Academic Session: ${new Date().getFullYear()}-${
        new Date().getFullYear() + 1
      }`, { align: "center" });
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