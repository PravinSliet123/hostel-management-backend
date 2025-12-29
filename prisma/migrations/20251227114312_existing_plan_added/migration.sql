-- AlterTable
ALTER TABLE `masterstudents` ADD COLUMN `isExistingStudent` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `pricingplan` ADD COLUMN `isExistingStudent` BOOLEAN NOT NULL DEFAULT false;
