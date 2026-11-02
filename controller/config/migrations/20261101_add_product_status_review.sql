-- Run against the existing Dot63 database before using product status reviews.
-- Only add missing columns; preserve all products and their current statuses.
SET @review_columns = (
    SELECT GROUP_CONCAT(definition SEPARATOR ', ')
    FROM (
        SELECT 'pending_status' AS column_name, 'ADD COLUMN `pending_status` TINYINT UNSIGNED NULL' AS definition
        UNION ALL
        SELECT 'status_request_version', 'ADD COLUMN `status_request_version` INT UNSIGNED NOT NULL DEFAULT 0'
        UNION ALL
        SELECT 'status_requested_at', 'ADD COLUMN `status_requested_at` DATETIME NULL'
    ) AS required_columns
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns AS existing_columns
        WHERE existing_columns.table_schema = DATABASE()
          AND existing_columns.table_name = 'products'
          AND existing_columns.column_name = required_columns.column_name
    )
);
SET @review_migration = IF(@review_columns IS NULL, 'SELECT 1', CONCAT('ALTER TABLE `products` ', @review_columns));
PREPARE review_migration_statement FROM @review_migration;
EXECUTE review_migration_statement;
DEALLOCATE PREPARE review_migration_statement;
