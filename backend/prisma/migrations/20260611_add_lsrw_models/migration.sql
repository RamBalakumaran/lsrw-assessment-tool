-- Create Group table
CREATE TABLE `Group` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT,
    `academicYear` VARCHAR(191),
    `departmentId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `Group_name_departmentId_key`(`name`, `departmentId`),
    INDEX `Group_ownerId_idx`(`ownerId`),
    INDEX `Group_departmentId_idx`(`departmentId`),
    INDEX `Group_organizationId_idx`(`organizationId`),
    CONSTRAINT `Group_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Group_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Group_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create GroupMembership table
CREATE TABLE `GroupMembership` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `GroupMembership_userId_groupId_key`(`userId`, `groupId`),
    INDEX `GroupMembership_groupId_idx`(`groupId`),
    CONSTRAINT `GroupMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `GroupMembership_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Modify Task table to add LSRW fields (only add columns that don't exist yet)
ALTER TABLE `Task` ADD COLUMN `subType` VARCHAR(191);
ALTER TABLE `Task` ADD COLUMN `visibilityScope` VARCHAR(191) DEFAULT 'ORGANIZATION';
ALTER TABLE `Task` ADD COLUMN `status` VARCHAR(191) DEFAULT 'DRAFT';
ALTER TABLE `Task` ADD COLUMN `passage` LONGTEXT;
ALTER TABLE `Task` ADD COLUMN `instructions` LONGTEXT;
ALTER TABLE `Task` ADD COLUMN `timeLimit` INTEGER;
ALTER TABLE `Task` ADD COLUMN `createdById` VARCHAR(191);

-- Create TaskDepartmentAssignment table
CREATE TABLE `TaskDepartmentAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `TaskDepartmentAssignment_taskId_departmentId_key`(`taskId`, `departmentId`),
    INDEX `TaskDepartmentAssignment_departmentId_idx`(`departmentId`),
    CONSTRAINT `TaskDepartmentAssignment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `TaskDepartmentAssignment_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create TaskGroupAssignment table
CREATE TABLE `TaskGroupAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `TaskGroupAssignment_taskId_groupId_key`(`taskId`, `groupId`),
    INDEX `TaskGroupAssignment_groupId_idx`(`groupId`),
    CONSTRAINT `TaskGroupAssignment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `TaskGroupAssignment_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create AuditLog table
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `changes` JSON,
    `ipAddress` VARCHAR(191),
    `userAgent` TEXT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_entityType_idx`(`entityType`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key for Task.createdById
ALTER TABLE `Task` ADD CONSTRAINT `Task_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
