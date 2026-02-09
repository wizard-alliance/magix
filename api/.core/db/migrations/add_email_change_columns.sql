-- Add email change columns to users table
-- These support verified email address changes

ALTER TABLE `users`
  ADD COLUMN `pending_email` VARCHAR(255) DEFAULT NULL AFTER `lockout_until`,
  ADD COLUMN `email_change_token` VARCHAR(255) DEFAULT NULL AFTER `pending_email`,
  ADD COLUMN `email_change_token_expiration` DATETIME DEFAULT NULL AFTER `email_change_token`;
