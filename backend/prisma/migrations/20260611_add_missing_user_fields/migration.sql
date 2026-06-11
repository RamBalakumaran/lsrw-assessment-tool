-- Add missing columns to User table
ALTER TABLE `User` ADD COLUMN `forcePasswordReset` BOOLEAN NOT NULL DEFAULT false;
