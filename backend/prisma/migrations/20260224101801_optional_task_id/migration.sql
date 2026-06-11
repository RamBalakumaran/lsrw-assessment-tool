-- DropForeignKey
ALTER TABLE `attempt` DROP FOREIGN KEY `Attempt_taskId_fkey`;

-- AlterTable
ALTER TABLE `attempt` MODIFY `taskId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
