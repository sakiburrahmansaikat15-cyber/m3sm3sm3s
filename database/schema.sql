-- M3S Studio — MySQL / MariaDB schema
-- Import this file in cPanel → phpMyAdmin → (your database) → Import.
-- Demo products + default content are inserted automatically the first time
-- you open /admin and create the first admin account.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL DEFAULT '',
  `password_hash` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(64) NOT NULL,
  `value` JSON NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(120) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `combo` VARCHAR(160) NOT NULL DEFAULT '',
  `tagline` VARCHAR(255) NOT NULL DEFAULT '',
  `description` TEXT NOT NULL,
  `price` INT NOT NULL DEFAULT 0,
  `compare_at` INT NULL,
  `category` VARCHAR(60) NOT NULL DEFAULT 'Graphic',
  `fit` VARCHAR(120) NOT NULL DEFAULT '',
  `gsm` INT NOT NULL DEFAULT 220,
  `sizes` JSON NOT NULL,
  `sold_out` JSON NOT NULL,
  `badge` VARCHAR(60) NOT NULL DEFAULT '',
  `bg` VARCHAR(20) NOT NULL DEFAULT '#ff5a8a',
  `tee` VARCHAR(20) NOT NULL DEFAULT '#111111',
  `ink` VARCHAR(20) NOT NULL DEFAULT '#ffffff',
  `ink2` VARCHAR(20) NOT NULL DEFAULT '#cccccc',
  `fg` VARCHAR(20) NOT NULL DEFAULT '#000000',
  `print_title` VARCHAR(60) NOT NULL DEFAULT '',
  `print_sub` VARCHAR(60) NOT NULL DEFAULT '',
  `print_motif` VARCHAR(20) NOT NULL DEFAULT 'none',
  `print_url` VARCHAR(500) NOT NULL DEFAULT '',
  `back_print_url` VARCHAR(500) NOT NULL DEFAULT '',
  `model_url` VARCHAR(500) NOT NULL DEFAULT '',
  `model_scale_pct` INT NOT NULL DEFAULT 100,
  `model_rot_y` INT NOT NULL DEFAULT 0,
  `bg_image_url` VARCHAR(500) NOT NULL DEFAULT '',
  `gallery` JSON NOT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_sort_idx` (`published`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `url` VARCHAR(500) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `kind` VARCHAR(20) NOT NULL,
  `mime` VARCHAR(100) NOT NULL,
  `size` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(191) NOT NULL DEFAULT '',
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL DEFAULT '',
  `zone` VARCHAR(20) NOT NULL DEFAULT 'inside',
  `note` TEXT NULL,
  `payment` VARCHAR(20) NOT NULL DEFAULT 'cod',
  `subtotal` INT NOT NULL,
  `shipping` INT NOT NULL,
  `total` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_code_unique` (`code`),
  KEY `orders_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `product_id` INT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `size` VARCHAR(8) NOT NULL,
  `qty` INT NOT NULL,
  `unit_price` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_idx` (`order_id`),
  CONSTRAINT `order_items_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscribers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscribers_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
