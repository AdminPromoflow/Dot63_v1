-- Execute manually after the Delivery Price and Delivery Time migrations.
-- NULL preserves the existing single-option configuration as a fallback.
-- [] explicitly means no configured delivery options.
ALTER TABLE `variations` ADD COLUMN `delivery_options` JSON NULL;
ALTER TABLE `prices` ADD COLUMN `delivery_options` JSON NULL;
