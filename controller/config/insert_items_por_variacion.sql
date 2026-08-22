/*
 * Crea un item para cada variacion que aun no tenga uno.
 *
 * En el dump de referencia:
 *   - variations: 518
 *   - variations que ya tienen item: 406
 *   - items que se insertaran: 112
 *
 * El LEFT(..., 50) respeta el tamano de las columnas items.name e
 * items.description. item_id no se incluye porque es AUTO_INCREMENT.
 */

START TRANSACTION;

INSERT INTO `items` (`name`, `description`, `variation_id`)
SELECT
    LEFT(
        COALESCE(NULLIF(TRIM(v.`name`), ''), CONCAT('Variation ', v.`variation_id`)),
        50
    ) AS `name`,
    LEFT(
        COALESCE(NULLIF(TRIM(v.`name`), ''), CONCAT('Variation ', v.`variation_id`)),
        50
    ) AS `description`,
    v.`variation_id`
FROM `variations` AS v
WHERE NOT EXISTS (
    SELECT 1
    FROM `items` AS i
    WHERE i.`variation_id` = v.`variation_id`
)
ORDER BY v.`variation_id`;

SELECT ROW_COUNT() AS `items_insertados`;

COMMIT;
