/*
  Warnings:

  - Added the required column `semester` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment` ADD COLUMN `semester` INTEGER NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL;
