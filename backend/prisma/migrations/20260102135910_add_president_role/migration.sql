-- AlterTable
ALTER TABLE `tournament_registrations` ADD COLUMN `boatNumber` INTEGER NULL,
    ADD COLUMN `clubCode` VARCHAR(50) NULL,
    ADD COLUMN `clubName` VARCHAR(255) NULL,
    ADD COLUMN `inspectorClub` VARCHAR(255) NULL,
    ADD COLUMN `inspectorId` VARCHAR(36) NULL,
    ADD COLUMN `inspectorName` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `tournaments` ADD COLUMN `level` ENUM('CLUB', 'PROVINCIAL', 'REGIONAL', 'NATIONAL', 'INTERNATIONAL') NOT NULL DEFAULT 'CLUB';

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'PRESIDENT', 'ORGANIZER', 'JUDGE', 'PARTICIPANT') NOT NULL DEFAULT 'PARTICIPANT';

-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `boatName` VARCHAR(255) NOT NULL,
    `boatNumber` INTEGER NULL,
    `captainId` VARCHAR(191) NOT NULL,
    `clubName` VARCHAR(255) NULL,
    `clubCode` VARCHAR(50) NULL,
    `inspectorId` VARCHAR(36) NULL,
    `inspectorName` VARCHAR(255) NULL,
    `inspectorClub` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,

    INDEX `teams_tournamentId_idx`(`tournamentId`),
    INDEX `teams_captainId_idx`(`captainId`),
    UNIQUE INDEX `teams_tournamentId_boatNumber_key`(`tournamentId`, `boatNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_members` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'CREW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `team_members_teamId_idx`(`teamId`),
    INDEX `team_members_userId_idx`(`userId`),
    UNIQUE INDEX `team_members_teamId_userId_key`(`teamId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `strikes` (
    `id` VARCHAR(191) NOT NULL,
    `strikeAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rodCount` INTEGER NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `result` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NULL,
    `reportedById` VARCHAR(36) NOT NULL,

    INDEX `strikes_tournamentId_idx`(`tournamentId`),
    INDEX `strikes_teamId_idx`(`teamId`),
    INDEX `strikes_strikeAt_idx`(`strikeAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_captainId_fkey` FOREIGN KEY (`captainId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `strikes` ADD CONSTRAINT `strikes_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `strikes` ADD CONSTRAINT `strikes_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
