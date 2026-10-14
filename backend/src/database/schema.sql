-- ========================================================
-- Travel Planner & Live Travel Journal - MySQL 8.x Schema
-- Database: travel_planner
-- ========================================================

CREATE DATABASE IF NOT EXISTS `travel_planner` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `travel_planner`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `reset_password_token` VARCHAR(255) DEFAULT NULL,
  `reset_password_expires` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS `trips` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `travelers_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `budget` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `cover_photo` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trips_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_trips_user_id` (`user_id`),
  INDEX `idx_trips_dates` (`start_date`, `end_date`),
  INDEX `idx_trips_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Trip Days Table
CREATE TABLE IF NOT EXISTS `trip_days` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT UNSIGNED NOT NULL,
  `day_number` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `title` VARCHAR(150) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trip_days_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_trip_day_number` (`trip_id`, `day_number`),
  INDEX `idx_trip_days_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Destinations Table
CREATE TABLE IF NOT EXISTS `destinations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `day_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `planned_time` TIME DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `estimated_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `actual_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_destinations_day` FOREIGN KEY (`day_id`) REFERENCES `trip_days` (`id`) ON DELETE CASCADE,
  INDEX `idx_destinations_day_id` (`day_id`),
  INDEX `idx_destinations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Exploration Checklist Items
CREATE TABLE IF NOT EXISTS `exploration_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `destination_id` INT UNSIGNED NOT NULL,
  `item_text` VARCHAR(255) NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_exploration_items_destination` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE,
  INDEX `idx_exploration_destination` (`destination_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT UNSIGNED NOT NULL,
  `day_id` INT UNSIGNED DEFAULT NULL,
  `destination_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `category` ENUM('Food', 'Transport', 'Entrance Fees', 'Shopping', 'Accommodation', 'Other') NOT NULL DEFAULT 'Other',
  `expense_date` DATE NOT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_expenses_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expenses_day` FOREIGN KEY (`day_id`) REFERENCES `trip_days` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expenses_destination` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE SET NULL,
  INDEX `idx_expenses_trip` (`trip_id`),
  INDEX `idx_expenses_category` (`category`),
  INDEX `idx_expenses_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Photos & Memories Table
CREATE TABLE IF NOT EXISTS `photos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT UNSIGNED NOT NULL,
  `day_id` INT UNSIGNED DEFAULT NULL,
  `destination_id` INT UNSIGNED DEFAULT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `caption` VARCHAR(255) DEFAULT NULL,
  `is_favorite` TINYINT(1) NOT NULL DEFAULT 0,
  `taken_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_photos_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_photos_day` FOREIGN KEY (`day_id`) REFERENCES `trip_days` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_photos_destination` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_photos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_photos_trip` (`trip_id`),
  INDEX `idx_photos_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Journal Entries Table
CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT UNSIGNED NOT NULL,
  `day_id` INT UNSIGNED DEFAULT NULL,
  `destination_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(150) NOT NULL,
  `content` TEXT NOT NULL,
  `entry_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_journal_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_journal_day` FOREIGN KEY (`day_id`) REFERENCES `trip_days` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_journal_destination` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE SET NULL,
  INDEX `idx_journal_trip` (`trip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Trip Sharing (Collaborator/Read-only access)
CREATE TABLE IF NOT EXISTS `trip_shares` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT UNSIGNED NOT NULL,
  `shared_with_user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('VIEWER') NOT NULL DEFAULT 'VIEWER',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trip_shares_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trip_shares_user` FOREIGN KEY (`shared_with_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_trip_user_share` (`trip_id`, `shared_with_user_id`),
  INDEX `idx_trip_shares_user` (`shared_with_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'system',
  `link` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_notifications_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Admin Messages Table
CREATE TABLE IF NOT EXISTS `admin_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `sender_admin_id` INT UNSIGNED NOT NULL,
  `recipient_user_id` INT UNSIGNED DEFAULT NULL, -- NULL means broadcast to all users
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `is_broadcast` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_admin_msg_sender` FOREIGN KEY (`sender_admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admin_msg_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_admin_msg_recipient` (`recipient_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
