-- Run manually after 20261109_add_delivery_price.sql in the intended database.
-- NULL means no delivery time configured. Existing prices are unchanged.
ALTER TABLE `variations`
    ADD COLUMN `delivery_time_days` SMALLINT UNSIGNED NULL DEFAULT NULL;

ALTER TABLE `prices`
    ADD COLUMN `delivery_time_days` SMALLINT UNSIGNED NULL DEFAULT NULL;
