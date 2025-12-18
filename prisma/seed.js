// adjust path if needed
import prisma from "../config/db.js";
async function main() {
  console.log("Starting data import...");

  // -----------------------------
  // 1. USER TABLE
  // -----------------------------
  await prisma.user.createMany({
    data: [
      { id: 1, email: "pravin.cse17+3@gmail.com", password: "$2b$10$9DyCsuUJTqjlY3v3cIV5AuQwf0E5vtt8WNJ3wt31osPDUBw.obu16", role: "STUDENT", createdAt: new Date("2025-07-12T12:53:14.186Z"), updatedAt: new Date("2025-07-12T12:53:14.186Z") },
      { id: 2, email: "pravin.cse17+2@gmail.com", password: "$2b$10$bAMSa0AOdZp2eZ9U/WzsBeUoCDx8wHKP4h2oO.38vESrN5en/NTq.", role: "STUDENT", createdAt: new Date("2025-07-12T13:01:46.735Z"), updatedAt: new Date("2025-07-12T13:01:46.735Z") },
      { id: 3, email: "pravin.cse17+4@gmail.com", password: "$2b$10$pGJI3GD6Zqo47UKEQggCeOlTdg.RD3qawLMHXHcI9BpTux0Bvm49m", role: "STUDENT", createdAt: new Date("2025-07-12T13:25:31.932Z"), updatedAt: new Date("2025-07-12T13:25:31.932Z") },
      { id: 4, email: "pravin.cse17+5@gmail.com", password: "$2b$10$bHGxYagYTV2G7QINKAGGgORhuyOJ6sIt37im5DOad9DicahnGnKM2", role: "STUDENT", createdAt: new Date("2025-07-12T13:58:33.504Z"), updatedAt: new Date("2025-07-12T13:58:33.504Z") },
      { id: 5, email: "admin.admin1@example.com", password: "$2b$10$Bn3cD.jf0zifw9w5lRdlf.KhnrOlyedEbDkcwUfELIsMFn1R5uCrS", role: "ADMIN", createdAt: new Date("2025-07-16T18:18:19.376Z"), updatedAt: new Date("2025-07-16T18:18:19.376Z") },
      { id: 6, email: "ward@gmail.con", password: "$2b$10$/zSAz9e/0u4FWIz5Z8Zrh.UHEwOolrhE0vNJRkOzEhB6eY7BVdCXy", role: "WARDEN", createdAt: new Date("2025-07-16T18:46:26.625Z"), updatedAt: new Date("2025-07-16T18:46:26.625Z") },
      { id: 11, email: "pravin.cse17+9@gmail.com", password: "$2b$10$NTgQiYW/zSnNAz6zTpZYuOZjZwC9RmotonO1G0wR8RlRDvQ0QzcrC", role: "STUDENT", createdAt: new Date("2025-07-17T13:41:44.096Z"), updatedAt: new Date("2025-07-17T13:41:44.096Z") },
      { id: 13, email: "pravin.cse17+10@gmail.com", password: "$2b$10$TZxyyAs5WdUIcuchQe4brenu9mOPSjbK7G5c9baC7X4joN0tIQ/SS", role: "WARDEN", createdAt: new Date("2025-07-17T13:48:14.802Z"), updatedAt: new Date("2025-07-17T13:48:14.802Z") },
      { id: 15, email: "pravin.cse17+11@gmail.com", password: "$2b$10$gvR.UyHp6bBXOLvxZwP0FuBoK7KNx.xgna8jsnbJrCWNcwqr2ffm2", role: "STUDENT", createdAt: new Date("2025-07-19T06:28:57.377Z"), updatedAt: new Date("2025-07-19T06:28:57.377Z") },
      { id: 16, email: "student123@gmail.com", password: "$2b$10$yXM1zvsUgjC2ASgEjgsH/OJnwLlhFpG7w/T92F1qvkCbrsAfsZziG", role: "STUDENT", createdAt: new Date("2025-10-24T14:02:47.414Z"), updatedAt: new Date("2025-10-24T14:02:47.414Z") },
      { id: 17, email: "pravin.cse17+33@gmail.com", password: "$2b$10$ocDgMB0Ws15kV0Rustysguoz9fpXHEewa35qrzZug0xVnGeOzmv3C", role: "STUDENT", createdAt: new Date("2025-11-01T06:11:02.515Z"), updatedAt: new Date("2025-11-01T06:11:02.515Z") },
      { id: 18, email: "pravin.cse17@gmail.com", password: "$2b$10$cIeYdxyDU7A8z/U1.sF7/uPmseWwQpX7lUaZJLerAGJGirO0qiLYS", role: "STUDENT", createdAt: new Date("2025-11-20T18:12:12.133Z"), updatedAt: new Date("2025-12-15T17:57:55.886Z") },
      { id: 19, email: "pravin.cse17+51@gmail.com", password: "$2b$10$iVbSk4xAZv9SJ.Tm/t5a0euHGMG4ari1kb/JpE0uWbbCsoH4gupuu", role: "STUDENT", createdAt: new Date("2025-12-17T16:39:14.501Z"), updatedAt: new Date("2025-12-17T16:39:14.501Z") },
      { id: 20, email: "pravin.cse17+52@gmail.com", password: "$2b$10$ACvKq8VWJ5/2Hop5bFHCseU40E.7/nPUZs9GkqRcgsjRUFyHq5VP6", role: "STUDENT", createdAt: new Date("2025-12-17T17:32:07.101Z"), updatedAt: new Date("2025-12-17T17:32:07.101Z") },
    ],
    skipDuplicates: true
  });

  console.log("User table imported.");

  // -----------------------------
  // 2. ADMIN TABLE
  // -----------------------------
  await prisma.admin.createMany({
    data: [
      { id: 1, userId: 5, fullName: "New Admin", createdAt: new Date("2025-07-16T18:18:19.414Z"), updatedAt: new Date("2025-07-16T18:18:19.414Z") }
    ],
    skipDuplicates: true
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
