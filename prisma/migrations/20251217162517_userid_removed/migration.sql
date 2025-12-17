/*
  Warnings:

  - You are about to drop the column `userId` on the `hostelapplication` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `hostelapplication` DROP FOREIGN KEY `HostelApplication_userId_fkey`;

-- DropIndex
DROP INDEX `HostelApplication_userId_fkey` ON `hostelapplication`;

-- AlterTable
ALTER TABLE `hostelapplication` DROP COLUMN `userId`;
