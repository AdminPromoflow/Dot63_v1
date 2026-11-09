-- Execute manually in the intended database. This migration is NOT run by the app.
-- NULL means no surcharge configured. Existing prices remain unchanged.
ALTER TABLE `variations`
    ADD COLUMN `delivery_price` DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL,
    ADD COLUMN `delivery_price_type` ENUM('percentage', 'amount') NULL DEFAULT NULL;

ALTER TABLE `prices`
    ADD COLUMN `delivery_price` DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL,
    ADD COLUMN `delivery_price_type` ENUM('percentage', 'amount') NULL DEFAULT NULL;
