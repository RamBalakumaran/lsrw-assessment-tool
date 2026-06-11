ALTER TABLE `User`
    MODIFY `role` ENUM('ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT';

CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `organizationId` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `staffMemberIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Department_organizationId_name_key`(`organizationId`, `name`),
    INDEX `Department_organizationId_idx`(`organizationId`),
    INDEX `Department_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Department`
    ADD CONSTRAINT `Department_organizationId_fkey`
    FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Department`
    ADD CONSTRAINT `Department_adminId_fkey`
    FOREIGN KEY (`adminId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
