ALTER TABLE `User`
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `groupMemberships` JSON NULL;
