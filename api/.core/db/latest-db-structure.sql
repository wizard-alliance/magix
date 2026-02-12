SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `billing_customers`;
CREATE TABLE `billing_customers` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for billing_customers table',
  `user_id` bigint DEFAULT NULL COMMENT 'Foreign key to users.id (if customer is a user)',
  `company_id` bigint DEFAULT NULL COMMENT 'Foreign key to companies.id (if customer is a company)',
  `is_guest` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Set to 1 if customer is a guest',
  `billing_name` varchar(255) DEFAULT NULL COMMENT 'Customer billing name',
  `billing_email` varchar(255) DEFAULT NULL COMMENT 'Customer billing email address',
  `billing_phone` varchar(30) DEFAULT NULL COMMENT 'Customer billing phone number',
  `billing_address_line1` varchar(255) DEFAULT NULL COMMENT 'Billing address line 1',
  `billing_address_line2` varchar(255) DEFAULT NULL COMMENT 'Billing address line 2',
  `billing_city` varchar(100) DEFAULT NULL COMMENT 'Billing city',
  `billing_state` varchar(100) DEFAULT NULL COMMENT 'Billing state',
  `billing_zip` varchar(20) DEFAULT NULL COMMENT 'Billing ZIP/postal code',
  `billing_country` varchar(100) DEFAULT NULL COMMENT 'Billing country',
  `billing_latitude` decimal(10,7) DEFAULT NULL COMMENT 'Latitude for billing location',
  `billing_longitude` decimal(10,7) DEFAULT NULL COMMENT 'Longitude for billing location',
  `vat_id` varchar(50) DEFAULT NULL COMMENT 'VAT or tax ID number if applicable',
  `provider_customer_id` varchar(255) DEFAULT NULL COMMENT 'LemonSqueezy customer ID',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the record was last updated',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `idx_company_id` (`company_id`),
  UNIQUE KEY `idx_provider_customer_id` (`provider_customer_id`),
  KEY `fk_billing_customers_user` (`user_id`),
  KEY `fk_billing_customers_company` (`company_id`),
  CONSTRAINT `fk_billing_customers_company` FOREIGN KEY (`company_id`) REFERENCES `user_organization` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_billing_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_exclusive_customer_type` CHECK ((((`is_guest` = 1) and (`user_id` is null) and (`company_id` is null)) or ((`is_guest` = 0) and (((`user_id` is not null) and (`company_id` is null)) or ((`user_id` is null) and (`company_id` is not null))))))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Links users, companies, or guests to billing details.';


DROP TABLE IF EXISTS `billing_invoices`;
CREATE TABLE `billing_invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for billing_invoices table',
  `order_id` bigint NOT NULL COMMENT 'FK referencing billing_orders(id)',
  `customer_id` bigint NOT NULL COMMENT 'FK referencing billing_customers(id)',
  `billing_info_snapshot` json DEFAULT NULL COMMENT 'Snapshot of billing info - JSON due to future compatability',
  `billing_order_snapshot` json DEFAULT NULL COMMENT 'Snapshot of billing info - JSON due to future compatability',
  `snapshot_version` varchar(10) NOT NULL DEFAULT '1.0.0' COMMENT 'Snapshot version',
  `pdf_url` varchar(255) DEFAULT NULL COMMENT 'Optional URL to a PDF copy of the invoice',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the invoice record was created',
  PRIMARY KEY (`id`),
  KEY `idx_billing_invoices_order` (`order_id`),
  KEY `idx_billing_invoices_customer` (`customer_id`),
  CONSTRAINT `fk_billing_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `billing_customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_billing_invoices_order` FOREIGN KEY (`order_id`) REFERENCES `billing_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Immutable storage for finalized invoices for completed orders.';


DROP TABLE IF EXISTS `billing_orders`;
CREATE TABLE `billing_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for billing_orders table',
  `customer_id` bigint NOT NULL COMMENT 'FK referencing billing_customers(id)',
  `type` enum('subscription','purchase','refund','adjustment','trial') NOT NULL DEFAULT 'purchase' COMMENT 'Type of order',
  `subscription_id` bigint DEFAULT NULL COMMENT 'FK referencing billing_subscriptions(id), if applicable',
  `provider_order_id` varchar(255) NOT NULL COMMENT 'Order ID from external provider',
  `amount` decimal(10,2) NOT NULL COMMENT 'Monetary amount for this order',
  `currency` varchar(10) NOT NULL DEFAULT 'USD' COMMENT 'ISO currency code for the order amount',
  `status` enum('pending','paid','failed','refunded','canceled') NOT NULL DEFAULT 'pending' COMMENT 'Order status',
  `payment_method` varchar(255) DEFAULT NULL COMMENT 'Payment method used (e.g., card, Klarna)',
  `paid_at` datetime DEFAULT NULL COMMENT 'Timestamp when payment was completed',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the order record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the order record was last updated',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp',
  `parent_order_id` bigint DEFAULT NULL COMMENT 'FK referencing billing_orders(id) for refunds/partials',
  `idempotency_key` varchar(255) DEFAULT NULL COMMENT 'Prevents duplicate order creation',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_order` (`provider_order_id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `idx_billing_orders_subscription` (`subscription_id`),
  KEY `idx_billing_orders_customer` (`customer_id`),
  KEY `fk_billing_orders_parent` (`parent_order_id`),
  CONSTRAINT `fk_billing_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `billing_customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_billing_orders_parent` FOREIGN KEY (`parent_order_id`) REFERENCES `billing_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_billing_orders_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `billing_subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=340 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tracks all payment transactions.';


DROP TABLE IF EXISTS `billing_product_features`;
CREATE TABLE `billing_product_features` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for billing_plan_features table',
  `product_id` bigint NOT NULL COMMENT 'FK referencing billing_plans(id)',
  `feature_name` varchar(255) NOT NULL COMMENT 'Name of the feature in this plan',
  `description` text COMMENT 'Additional info describing the feature',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the feature record was created',
  PRIMARY KEY (`id`),
  KEY `idx_billing_plan_features_plan` (`product_id`),
  CONSTRAINT `fk_billing_plan_features_plan` FOREIGN KEY (`product_id`) REFERENCES `billing_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Defines features included in subscription plans.';


DROP TABLE IF EXISTS `billing_products`;
CREATE TABLE `billing_products` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for billing_plans table',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Name of the subscription plan (e.g., Basic, Pro)',
  `type` varchar(50) NOT NULL DEFAULT 'subscription' COMMENT 'subscription, one_time, lead_magnet, pwyw',
  `provider_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'MoR product identifier from the external provider (e.g., Stripe)',
  `provider_variant_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'MoR variant identifier from the external provider (e.g., Stripe)',
  `price` float NOT NULL DEFAULT '0' COMMENT 'Recurring or fixed cost of the plan',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'USD' COMMENT 'ISO currency code for the plan price',
  `interval` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT 'day, week, month, year',
  `interval_count` int NOT NULL DEFAULT '1' COMMENT 'Number of intervals per cycle',
  `trial_days` int NOT NULL DEFAULT '0' COMMENT 'Free trial length in days',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT 'Display order',
  `description` text COMMENT 'Description of the plan features or details',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indicates if the plan is currently available',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the plan record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the plan record was last updated',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp for the plan',
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider_variant_id` (`provider_variant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lists subscription plans with pricing and descriptions.';


DROP TABLE IF EXISTS `billing_subscriptions`;
CREATE TABLE `billing_subscriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for billing_subscriptions table',
  `customer_id` bigint NOT NULL COMMENT 'FK referencing billing_customers(id)',
  `plan_id` bigint DEFAULT NULL,
  `provider_subscription_id` varchar(255) NOT NULL COMMENT 'Identifier for this subscription in the provider system',
  `current_period_start` datetime NOT NULL COMMENT 'Start timestamp of the current billing cycle',
  `current_period_end` datetime NOT NULL COMMENT 'End timestamp of the current billing cycle',
  `cancel_at_period_end` tinyint(1) DEFAULT '0' COMMENT 'If set to 1, subscription will end when current period ends',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp for the subscription record',
  `canceled_at` datetime DEFAULT NULL COMMENT 'Timestamp when the subscription was canceled, if any',
  `paused_at` datetime DEFAULT NULL COMMENT 'Timestamp when the subscription was paused, if any',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the subscription record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the subscription record was last updated',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_subscription` (`provider_subscription_id`),
  KEY `idx_billing_subscriptions_customer` (`customer_id`),
  KEY `idx_billing_subscriptions_plan` (`plan_id`),
  CONSTRAINT `fk_billing_subscriptions_customer` FOREIGN KEY (`customer_id`) REFERENCES `billing_customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_billing_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `billing_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tracks active, canceled, and trial subscriptions.';


DROP TABLE IF EXISTS `global_audit_logs`;
CREATE TABLE `global_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for global_audit_logs table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing users(id)',
  `action` varchar(255) NOT NULL COMMENT 'Descriptive name of the action performed',
  `target_table` varchar(255) NOT NULL COMMENT 'The database table the action was performed on',
  `target_id` bigint NOT NULL COMMENT 'Primary Key of the record in target_table',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when this audit log entry was created',
  `deleted_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address of the user performing the action',
  `details` text COMMENT 'Additional details about the event',
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_user` (`user_id`),
  CONSTRAINT `global_audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=365 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Logs system activities for auditing and security.';


DROP TABLE IF EXISTS `global_cron_log`;
CREATE TABLE `global_cron_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_name` varchar(255) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `event_details` text,
  `event_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `global_permissions`;
CREATE TABLE `global_permissions` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uk_settings_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `global_settings`;
CREATE TABLE `global_settings` (
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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores device information for users';


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


DROP TABLE IF EXISTS `user_organization`;
CREATE TABLE `user_organization` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for companies table',
  `owner_id` bigint NOT NULL COMMENT 'FK referencing users(id); owner of this company',
  `parent_org` bigint DEFAULT NULL COMMENT 'Optional Parent organization',
  `name` varchar(255) NOT NULL COMMENT 'Company name',
  `description` text COMMENT 'Description or summary of the company',
  `vat_id` varchar(50) DEFAULT NULL COMMENT 'Company VAT ID if applicable',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the company record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the company record was last updated',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp for the company record',
  PRIMARY KEY (`id`),
  KEY `idx_companies_user` (`owner_id`),
  CONSTRAINT `fk_companies_user` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores company details linked to user accounts.';


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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores permissions for users.';


DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary Key for site_settings table',
  `user_id` bigint NOT NULL COMMENT 'FK referencing sites(id)',
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Setting name/key',
  `value` text COMMENT 'Value/content of the setting',
  `created` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the setting record was created',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp when the setting record was last updated',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_site_setting` (`user_id`,`key`),
  KEY `idx_site_settings_site` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores site-specific settings and preferences.';


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
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores short-lived access tokens for user authentication.';


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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores blacklisted tokens for user authentication.';


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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores long-term refresh tokens for user authentication.';


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


DROP TABLE IF EXISTS `user_vendors`;
CREATE TABLE `user_vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `vendor` varchar(50) NOT NULL,
  `vendor_user_id` varchar(255) NOT NULL,
  `vendor_email` varchar(255) DEFAULT NULL,
  `vendor_username` varchar(255) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vendor_user` (`vendor`,`vendor_user_id`),
  UNIQUE KEY `uq_user_vendor` (`user_id`,`vendor`),
  CONSTRAINT `fk_user_vendors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


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
  `avatar_url` varchar(255) DEFAULT NULL COMMENT 'Relative path to user avatar',
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
  `pending_email` varchar(255) DEFAULT NULL,
  `email_change_token` varchar(255) DEFAULT NULL,
  `email_change_token_expiration` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_username` (`username`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores user account information and credentials.';


-- 2026-02-12 14:47:51 UTC
