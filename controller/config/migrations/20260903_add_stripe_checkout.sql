ALTER TABLE `orders`
  ADD COLUMN `address_id` INT NULL AFTER `customer_id`,
  ADD COLUMN `shipping_address_json` TEXT NULL AFTER `address_id`,
  ADD COLUMN `promotion_code` VARCHAR(50) NULL AFTER `shipping_address_json`,
  ADD COLUMN `discount_total` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `promotion_code`,
  ADD COLUMN `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `discount_total`,
  ADD COLUMN `cart_fingerprint` CHAR(64) NULL AFTER `total_amount`,
  ADD COLUMN `stripe_payment_intent_id` VARCHAR(255) NULL AFTER `cart_fingerprint`,
  ADD COLUMN `stripe_payment_status` VARCHAR(50) NULL AFTER `stripe_payment_intent_id`,
  ADD COLUMN `stripe_idempotency_key` VARCHAR(255) NULL AFTER `stripe_payment_status`,
  ADD COLUMN `paid_at` DATETIME NULL AFTER `stripe_idempotency_key`,
  ADD COLUMN `updated_at` DATETIME NULL AFTER `paid_at`,
  ADD UNIQUE INDEX `UX_orders_stripe_payment_intent` (`stripe_payment_intent_id`),
  ADD INDEX `IX_orders_address` (`address_id`),
  ADD INDEX `IX_orders_payment_status` (`status`, `stripe_payment_status`);

ALTER TABLE `orders`
  ADD CONSTRAINT `FK_orders_addresses`
    FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `stripe_webhook_events`
(
  `event_id` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `payment_intent_id` VARCHAR(255) NULL,
  `processed_at` DATETIME NOT NULL,
  CONSTRAINT `PK_stripe_webhook_events` PRIMARY KEY (`event_id`)
);
