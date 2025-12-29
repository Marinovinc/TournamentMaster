-- CreateTable
CREATE TABLE `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `domain` VARCHAR(255) NULL,
    `logo` VARCHAR(500) NULL,
    `primaryColor` VARCHAR(7) NULL DEFAULT '#0066CC',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenants_slug_key`(`slug`),
    UNIQUE INDEX `tenants_domain_key`(`domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `fipsasNumber` VARCHAR(50) NULL,
    `role` ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT') NOT NULL DEFAULT 'PARTICIPANT',
    `avatar` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('MASAF_LICENSE', 'MEDICAL_CERTIFICATE', 'NAUTICAL_LICENSE', 'IDENTITY_DOCUMENT') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `filePath` VARCHAR(500) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `expiryDate` DATETIME(3) NULL,
    `reviewNotes` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `documents_userId_idx`(`userId`),
    INDEX `documents_type_idx`(`type`),
    INDEX `documents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournaments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `discipline` ENUM('BIG_GAME', 'DRIFTING', 'TRAINA_COSTIERA', 'BOLENTINO', 'EGING', 'VERTICAL_JIGGING', 'SHORE', 'SOCIAL') NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `registrationOpens` DATETIME(3) NOT NULL,
    `registrationCloses` DATETIME(3) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `locationLat` DECIMAL(10, 8) NULL,
    `locationLng` DECIMAL(11, 8) NULL,
    `registrationFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `maxParticipants` INTEGER NULL,
    `minParticipants` INTEGER NULL DEFAULT 1,
    `minWeight` DECIMAL(8, 3) NULL,
    `maxCatchesPerDay` INTEGER NULL,
    `pointsPerKg` DECIMAL(6, 2) NOT NULL DEFAULT 1,
    `bonusPoints` INTEGER NOT NULL DEFAULT 0,
    `bannerImage` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `organizerId` VARCHAR(191) NOT NULL,

    INDEX `tournaments_tenantId_idx`(`tenantId`),
    INDEX `tournaments_status_idx`(`status`),
    INDEX `tournaments_discipline_idx`(`discipline`),
    INDEX `tournaments_startDate_idx`(`startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fishing_zones` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `geoJson` LONGTEXT NOT NULL,
    `minLat` DECIMAL(10, 8) NULL,
    `maxLat` DECIMAL(10, 8) NULL,
    `minLng` DECIMAL(11, 8) NULL,
    `maxLng` DECIMAL(11, 8) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,

    INDEX `fishing_zones_tournamentId_idx`(`tournamentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `species` (
    `id` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(255) NOT NULL,
    `commonNameIt` VARCHAR(255) NOT NULL,
    `commonNameEn` VARCHAR(255) NOT NULL,
    `minSizeCm` INTEGER NULL,
    `pointsMultiplier` DECIMAL(4, 2) NOT NULL DEFAULT 1.0,
    `isProtected` BOOLEAN NOT NULL DEFAULT false,
    `imageUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `species_scientificName_key`(`scientificName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournament_species` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `speciesId` VARCHAR(191) NOT NULL,
    `customPointsMultiplier` DECIMAL(4, 2) NULL,

    UNIQUE INDEX `tournament_species_tournamentId_speciesId_key`(`tournamentId`, `speciesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournament_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `teamName` VARCHAR(255) NULL,
    `boatName` VARCHAR(255) NULL,
    `boatLength` DECIMAL(5, 2) NULL,
    `amountPaid` DECIMAL(10, 2) NULL,
    `paymentId` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,

    INDEX `tournament_registrations_tournamentId_idx`(`tournamentId`),
    INDEX `tournament_registrations_status_idx`(`status`),
    UNIQUE INDEX `tournament_registrations_userId_tournamentId_key`(`userId`, `tournamentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catches` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `weight` DECIMAL(8, 3) NOT NULL,
    `length` DECIMAL(6, 2) NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `gpsAccuracy` DECIMAL(8, 2) NULL,
    `photoPath` VARCHAR(500) NOT NULL,
    `photoExifData` TEXT NULL,
    `caughtAt` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` TEXT NULL,
    `reviewerId` VARCHAR(36) NULL,
    `points` DECIMAL(10, 2) NULL,
    `isInsideZone` BOOLEAN NULL,
    `validationData` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `speciesId` VARCHAR(191) NULL,

    INDEX `catches_tournamentId_idx`(`tournamentId`),
    INDEX `catches_userId_idx`(`userId`),
    INDEX `catches_status_idx`(`status`),
    INDEX `catches_caughtAt_idx`(`caughtAt`),
    INDEX `catches_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaderboard_entries` (
    `id` VARCHAR(191) NOT NULL,
    `participantName` VARCHAR(255) NOT NULL,
    `teamName` VARCHAR(255) NULL,
    `rank` INTEGER NOT NULL,
    `totalPoints` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalWeight` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `catchCount` INTEGER NOT NULL DEFAULT 0,
    `biggestCatch` DECIMAL(8, 3) NULL,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,

    INDEX `leaderboard_entries_tournamentId_rank_idx`(`tournamentId`, `rank`),
    UNIQUE INDEX `leaderboard_entries_tournamentId_userId_key`(`tournamentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(36) NOT NULL,
    `oldData` LONGTEXT NULL,
    `newData` LONGTEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(36) NULL,

    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_organizerId_fkey` FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fishing_zones` ADD CONSTRAINT `fishing_zones_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournament_species` ADD CONSTRAINT `tournament_species_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournament_species` ADD CONSTRAINT `tournament_species_speciesId_fkey` FOREIGN KEY (`speciesId`) REFERENCES `species`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournament_registrations` ADD CONSTRAINT `tournament_registrations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournament_registrations` ADD CONSTRAINT `tournament_registrations_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `catches` ADD CONSTRAINT `catches_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `catches` ADD CONSTRAINT `catches_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `catches` ADD CONSTRAINT `catches_speciesId_fkey` FOREIGN KEY (`speciesId`) REFERENCES `species`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaderboard_entries` ADD CONSTRAINT `leaderboard_entries_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
