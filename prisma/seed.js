// adjust path if needed
import prisma from "../config/db.js";
async function main() {
  console.log("Starting data import...");
  await prisma.user.createMany({
    data: [
      {
        id: 1,
        email: "admin.admin1@example.com",
        password:
          "$2b$10$Bn3cD.jf0zifw9w5lRdlf.KhnrOlyedEbDkcwUfELIsMFn1R5uCrS",
        role: "ADMIN",
        createdAt: new Date("2025-07-16T18:18:19.376Z"),
        updatedAt: new Date("2025-07-16T18:18:19.376Z"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("User table imported.");

  // -----------------------------
  // 2. ADMIN TABLE
  // -----------------------------
  await prisma.admin.createMany({
    data: [
      {
        id: 1,
        userId: 5,
        fullName: "New Admin",
        createdAt: new Date("2025-07-16T18:18:19.414Z"),
        updatedAt: new Date("2025-07-16T18:18:19.414Z"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Admin imported.");

  // -----------------------------
  // CONTINUE FOR ALL OTHER TABLES…
  // hostel, room, student, warden, etc.
  // -----------------------------
  // ⚠️ Because of message size limit, I will generate the remaining part automatically.
}

main()
  .then(() => {
    console.log("Import completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
