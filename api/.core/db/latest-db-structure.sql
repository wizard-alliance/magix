
SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_settings_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `rp_channels`;
CREATE TABLE `rp_channels` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `version` bigint NOT NULL DEFAULT '1' COMMENT 'User can have several version instances on-going, this dictates which version this item belongs to.',
  `guild_id` bigint NOT NULL COMMENT 'Guild this channel belongs to',
  `parent_id` bigint DEFAULT NULL COMMENT 'Optional parent channel ID',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'text',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Descriptive text of what the channel is about',
  `order` int DEFAULT '0' COMMENT 'Order position',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `guild_id_description` (`guild_id`,`description`),
  KEY `idx_channel_parent` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `rp_characters`;
CREATE TABLE `rp_characters` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `version` bigint NOT NULL DEFAULT '1' COMMENT 'User can have several version instances on-going, this dictates which version this item belongs to.',
  `guild_id` bigint DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `banned_at` datetime DEFAULT NULL,
  `age` tinyint DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `short_bio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `is_enabled` tinyint NOT NULL DEFAULT '0',
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Relative link to avatar',
  `personality` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `backstory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `traits` longtext,
  `model` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `lat` float DEFAULT NULL COMMENT 'Coordinates, used for timezone, weather, etc.',
  `lon` float DEFAULT NULL COMMENT 'Coordinates, used for timezone, weather, etc.',
  `language` varchar(255) DEFAULT NULL,
  `secondaryLanguage` varchar(255) DEFAULT NULL COMMENT 'Optional',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_users_username_version` (`username`,`version`),
  KEY `fk_users_guild` (`guild_id`),
  CONSTRAINT `fk_users_guild` FOREIGN KEY (`guild_id`) REFERENCES `rp_guilds` (`ID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `rp_guilds`;
CREATE TABLE `rp_guilds` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `version` bigint NOT NULL DEFAULT '1' COMMENT 'User can have several version instances on-going, this dictates which version this item belongs to.',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `order` int NOT NULL DEFAULT '0' COMMENT 'Order position',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `rp_messages`;
CREATE TABLE `rp_messages` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `version` bigint NOT NULL DEFAULT '1' COMMENT 'User can have several version instances on-going, this dictates which version this item belongs to.',
  `guild_id` bigint NOT NULL,
  `channel_id` bigint NOT NULL,
  `author_id` bigint DEFAULT NULL,
  `reply_id` bigint DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`ID`),
  KEY `idx_messages_version` (`version`),
  KEY `idx_messages_guild` (`guild_id`),
  KEY `idx_messages_channel` (`channel_id`),
  KEY `fk_messages_author` (`author_id`),
  FULLTEXT KEY `ft_messages_content` (`content`),
  CONSTRAINT `fk_messages_author` FOREIGN KEY (`author_id`) REFERENCES `rp_characters` (`ID`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_guild` FOREIGN KEY (`guild_id`) REFERENCES `rp_guilds` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `version` bigint DEFAULT NULL,
  `autoload` tinyint NOT NULL DEFAULT '0' COMMENT 'If this item should autoload with app init',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_settings_key` (`key`),
  KEY `idx_settings_autoload` (`autoload`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `user_devices`;
CREATE TABLE `user_devices` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_refresh_tokens table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'System given name',
  `custom_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'User provided name',
  `fingerprint` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of last login',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the item was created',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the item was updated',
  PRIMARY KEY (`id`),
  KEY `user_agent` (`user_agent`),
  KEY `fingerprint` (`fingerprint`),
  KEY `ip` (`ip`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores device information for users';


DROP TABLE IF EXISTS `user_notifications`;
CREATE TABLE `user_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_notifications table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `type` varchar(100) NOT NULL COMMENT 'Category or type of notification',
  `message` text NOT NULL COMMENT 'Main content of the notification',
  `read` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=unread, 1=read by the user',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the notification was created',
  PRIMARY KEY (`id`),
  KEY `idx_user_notifications_user` (`user_id`),
  CONSTRAINT `fk_user_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Manages notifications sent to users.';


DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_permissions table',
  `user_id` bigint NOT NULL COMMENT 'FK',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Permission name/key',
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'Value/content of the Permission ',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the record was last updated',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_site_setting` (`user_id`,`name`),
  KEY `idx_site_settings_site` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores permissions for users.';


DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for site_settings table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing sites(id)',
  `key` varchar(255) NOT NULL COMMENT 'Setting name/key',
  `value` text COMMENT 'Value/content of the setting',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the setting record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the setting record was last updated',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_site_setting` (`user_id`,`key`),
  KEY `idx_site_settings_site` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores site-specific settings and preferences.';


DROP TABLE IF EXISTS `user_tokens_access`;
CREATE TABLE `user_tokens_access` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_refresh_tokens table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `refresh_token_id` bigint NOT NULL COMMENT 'FK referencing user_refresh_tokens(id)',
  `token` varchar(255) NOT NULL COMMENT 'Refresh token string',
  `expires` timestamp NOT NULL COMMENT 'Timestamp when the token expires',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the token was created',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `refresh_token_id` (`refresh_token_id`),
  CONSTRAINT `user_tokens_access_ibfk_5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_tokens_access_ibfk_6` FOREIGN KEY (`refresh_token_id`) REFERENCES `user_tokens_refresh` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=250 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores short-lived access tokens for user authentication.';


DROP TABLE IF EXISTS `user_tokens_blacklist`;
CREATE TABLE `user_tokens_blacklist` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_refresh_tokens table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `token` varchar(255) NOT NULL COMMENT 'Refresh token string',
  `token_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'access | refresh | activation',
  `reason` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Optional reason',
  `expires` timestamp NOT NULL COMMENT 'Timestamp when the token expires',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the token was created',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the token was updated',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_tokens_blacklist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores blacklisted tokens for user authentication.';


DROP TABLE IF EXISTS `user_tokens_refresh`;
CREATE TABLE `user_tokens_refresh` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_refresh_tokens table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `device_id` bigint DEFAULT NULL COMMENT 'FK referencing user_devices(id)',
  `token` varchar(255) NOT NULL COMMENT 'Refresh token string',
  `valid` tinyint unsigned NOT NULL DEFAULT '1' COMMENT 'Indicates if the token is still valid',
  `expires` timestamp NOT NULL COMMENT 'Timestamp when the token expires',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the item was created',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the item was updated',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  KEY `device_id` (`device_id`),
  CONSTRAINT `user_tokens_refresh_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_tokens_refresh_ibfk_3` FOREIGN KEY (`device_id`) REFERENCES `user_devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores long-term refresh tokens for user authentication.';


DROP TABLE IF EXISTS `user_tokens_single`;
CREATE TABLE `user_tokens_single` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for user_refresh_tokens table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `refresh_token_id` bigint NOT NULL COMMENT 'FK referencing user_refresh_tokens(id)',
  `token` varchar(255) NOT NULL COMMENT 'Refresh token string',
  `expires` timestamp NOT NULL COMMENT 'Timestamp when the token expires',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the token was created',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `refresh_token_id` (`refresh_token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores single use tokens for user';


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for users table',
  `username` varchar(50) NOT NULL COMMENT 'Unique username chosen by the user',
  `email` varchar(100) NOT NULL COMMENT 'User email address; must be unique',
  `first_name` varchar(100) DEFAULT NULL COMMENT 'User first/given name',
  `last_name` varchar(100) DEFAULT NULL COMMENT 'User last/family name',
  `phone` varchar(20) DEFAULT NULL COMMENT 'Optional phone number',
  `company` varchar(255) DEFAULT NULL COMMENT 'Optional company name or affiliation',
  `address` text COMMENT 'User address in plain text',
  `activation_token` varchar(255) DEFAULT NULL COMMENT 'Token used to verify/activate account',
  `activated` tinyint NOT NULL DEFAULT '0' COMMENT 'Indicates if the account is activated',
  `tos_accepted` tinyint NOT NULL DEFAULT '0' COMMENT 'Indicates if user agreed to Terms of Service',
  `disabled` tinyint NOT NULL DEFAULT '0' COMMENT 'Set to 1 if the account is disabled',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the user record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the user record was last updated',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp for the user record',
  `password` varchar(255) NOT NULL COMMENT 'Hashed password for user authentication',
  `tfa_enabled` tinyint(1) DEFAULT '0' COMMENT 'If 1, two-factor authentication is enabled',
  `tfa_secret` varchar(255) DEFAULT NULL COMMENT 'Secret key used for generating TFA codes',
  `activation_token_expiration` datetime DEFAULT NULL COMMENT 'Timestamp when the activation token expires',
  `failed_login_attempts` int DEFAULT '0' COMMENT 'Number of consecutive failed login attempts',
  `lockout_until` datetime DEFAULT NULL COMMENT 'If set, user is locked out until this timestamp',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_username` (`username`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores user account information and credentials.';

