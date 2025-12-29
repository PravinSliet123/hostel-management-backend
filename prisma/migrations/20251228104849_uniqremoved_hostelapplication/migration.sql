-- Drop foreign key on studentId
ALTER TABLE `hostelapplication`
DROP FOREIGN KEY `HostelApplication_studentId_fkey`;

-- Drop unique constraint on studentId
DROP INDEX `HostelApplication_studentId_key`
ON `hostelapplication`;

-- Re-add foreign key WITHOUT unique
ALTER TABLE `hostelapplication`
ADD CONSTRAINT `HostelApplication_studentId_fkey`
FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE;
