-- DropForeignKey
ALTER TABLE `roomallocation` DROP FOREIGN KEY `RoomAllocation_studentId_fkey`;

-- DropIndex
DROP INDEX `RoomAllocation_studentId_semester_year_isActive_key` ON `roomallocation`;
