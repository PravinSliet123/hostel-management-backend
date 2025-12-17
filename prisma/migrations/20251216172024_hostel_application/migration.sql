/*
  Warnings:

  - Added the required column `hostelId` to the `HostelApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `HostelApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `HostelApplication` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `hostelapplication` DROP FOREIGN KEY `HostelApplication_studentId_fkey`;

-- AlterTable
ALTER TABLE `hostelapplication` ADD COLUMN `hostelId` INTEGER NOT NULL,
    ADD COLUMN `roomId` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `HostelApplication` ADD CONSTRAINT `HostelApplication_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HostelApplication` ADD CONSTRAINT `HostelApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HostelApplication` ADD CONSTRAINT `HostelApplication_hostelId_fkey` FOREIGN KEY (`hostelId`) REFERENCES `Hostel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HostelApplication` ADD CONSTRAINT `HostelApplication_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
