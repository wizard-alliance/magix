ALTER TABLE `billing_customers`
  ADD COLUMN `provider_customer_id` varchar(255) DEFAULT NULL COMMENT 'LemonSqueezy customer ID' AFTER `vat_id`,
  ADD UNIQUE KEY `idx_provider_customer_id` (`provider_customer_id`);
