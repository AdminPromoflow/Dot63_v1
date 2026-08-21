-- SuperLanyard (product_id = 39)
-- Prices for Flat Polyester/RPET Polyester: Screen print and Dye Sublimation.
-- Prices are attached only to final Colour variations.

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_flat_screen_price_matrix;
DROP TEMPORARY TABLE IF EXISTS tmp_flat_dye_price_matrix;
DROP TEMPORARY TABLE IF EXISTS tmp_flat_resolved_prices;

CREATE TEMPORARY TABLE tmp_flat_screen_price_matrix (
    target_material VARCHAR(50) NOT NULL,
    width_name VARCHAR(20) NOT NULL,
    min_quantity INT NOT NULL,
    max_quantity INT NULL,
    one_side_one_colour DECIMAL(10,3) NOT NULL,
    one_side_two_colours DECIMAL(10,3) NOT NULL,
    two_sides_one_colour DECIMAL(10,3) NOT NULL,
    two_sides_two_colours DECIMAL(10,3) NOT NULL,
    PRIMARY KEY (target_material, width_name, min_quantity)
);

INSERT INTO tmp_flat_screen_price_matrix VALUES
('Polyester', '10mm', 100, 199, 0.81, 0.86, 0.95, 1.01),
('Polyester', '10mm', 200, 299, 0.60, 0.65, 0.68, 0.75),
('Polyester', '10mm', 300, 499, 0.55, 0.61, 0.61, 0.68),
('Polyester', '10mm', 500, 999, 0.50, 0.56, 0.55, 0.61),
('Polyester', '10mm', 1000, 1999, 0.41, 0.46, 0.44, 0.50),
('Polyester', '10mm', 2000, 2999, 0.38, 0.42, 0.40, 0.45),
('Polyester', '10mm', 3000, 4999, 0.36, 0.41, 0.38, 0.43),
('Polyester', '10mm', 5000, NULL, 0.35, 0.39, 0.36, 0.42),
('Polyester', '15mm', 100, 199, 0.84, 0.89, 0.99, 1.05),
('Polyester', '15mm', 200, 299, 0.64, 0.69, 0.72, 0.79),
('Polyester', '15mm', 300, 499, 0.59, 0.65, 0.65, 0.72),
('Polyester', '15mm', 500, 999, 0.54, 0.60, 0.59, 0.65),
('Polyester', '15mm', 1000, 1999, 0.45, 0.50, 0.47, 0.53),
('Polyester', '15mm', 2000, 2999, 0.41, 0.45, 0.43, 0.48),
('Polyester', '15mm', 3000, 4999, 0.38, 0.42, 0.39, 0.45),
('Polyester', '15mm', 5000, NULL, 0.36, 0.40, 0.37, 0.43),
('Polyester', '20mm', 100, 199, 0.88, 0.92, 1.02, 1.08),
('Polyester', '20mm', 200, 299, 0.69, 0.74, 0.77, 0.83),
('Polyester', '20mm', 300, 499, 0.64, 0.69, 0.70, 0.76),
('Polyester', '20mm', 500, 999, 0.59, 0.64, 0.63, 0.70),
('Polyester', '20mm', 1000, 1999, 0.49, 0.54, 0.51, 0.57),
('Polyester', '20mm', 2000, 2999, 0.45, 0.50, 0.47, 0.53),
('Polyester', '20mm', 3000, 4999, 0.42, 0.46, 0.43, 0.49),
('Polyester', '20mm', 5000, NULL, 0.40, 0.44, 0.41, 0.47),
('Polyester', '25mm', 100, 199, 0.97, 1.02, 1.11, 1.18),
('Polyester', '25mm', 200, 299, 0.70, 0.75, 0.78, 0.84),
('Polyester', '25mm', 300, 499, 0.65, 0.70, 0.71, 0.78),
('Polyester', '25mm', 500, 999, 0.68, 0.73, 0.72, 0.79),
('Polyester', '25mm', 1000, 1999, 0.62, 0.67, 0.65, 0.71),
('Polyester', '25mm', 2000, 2999, 0.51, 0.56, 0.53, 0.58),
('Polyester', '25mm', 3000, 4999, 0.49, 0.53, 0.50, 0.56),
('Polyester', '25mm', 5000, NULL, 0.47, 0.52, 0.49, 0.54),
('Polyester', '30mm', 100, 199, 1.29, 1.35, 1.45, 1.52),
('Polyester', '30mm', 200, 299, 1.10, 1.16, 1.19, 1.27),
('Polyester', '30mm', 300, 499, 1.07, 1.13, 1.14, 1.22),
('Polyester', '30mm', 500, 999, 1.03, 1.09, 1.08, 1.16),
('Polyester', '30mm', 1000, 1999, 0.89, 0.94, 0.92, 0.99),
('Polyester', '30mm', 2000, 2999, 0.81, 0.87, 0.84, 0.91),
('Polyester', '30mm', 3000, 4999, 0.79, 0.84, 0.81, 0.88),
('Polyester', '30mm', 5000, NULL, 0.75, 0.80, 0.77, 0.84),
('RPET Polyester', '10mm', 100, 199, 0.86, 0.91, 1.01, 1.07),
('RPET Polyester', '10mm', 200, 299, 0.67, 0.72, 0.75, 0.81),
('RPET Polyester', '10mm', 300, 499, 0.62, 0.67, 0.68, 0.75),
('RPET Polyester', '10mm', 500, 999, 0.57, 0.62, 0.61, 0.68),
('RPET Polyester', '10mm', 1000, 1999, 0.47, 0.52, 0.49, 0.55),
('RPET Polyester', '10mm', 2000, 2999, 0.43, 0.48, 0.45, 0.51),
('RPET Polyester', '10mm', 3000, 4999, 0.42, 0.46, 0.43, 0.49),
('RPET Polyester', '10mm', 5000, NULL, 0.39, 0.44, 0.41, 0.46),
('RPET Polyester', '15mm', 100, 199, 0.90, 0.95, 1.05, 1.11),
('RPET Polyester', '15mm', 200, 299, 0.71, 0.76, 0.79, 0.85),
('RPET Polyester', '15mm', 300, 499, 0.66, 0.71, 0.72, 0.79),
('RPET Polyester', '15mm', 500, 999, 0.61, 0.66, 0.65, 0.72),
('RPET Polyester', '15mm', 1000, 1999, 0.51, 0.55, 0.53, 0.59),
('RPET Polyester', '15mm', 2000, 2999, 0.47, 0.52, 0.49, 0.55),
('RPET Polyester', '15mm', 3000, 4999, 0.44, 0.49, 0.46, 0.51),
('RPET Polyester', '15mm', 5000, NULL, 0.43, 0.47, 0.44, 0.49),
('RPET Polyester', '20mm', 10, 49, 5.27, 5.32, 6.59, 6.65),
('RPET Polyester', '20mm', 50, 99, 1.26, 1.31, 1.53, 1.59),
('RPET Polyester', '20mm', 100, 199, 0.93, 0.98, 1.08, 1.14),
('RPET Polyester', '20mm', 200, 299, 0.75, 0.80, 0.84, 0.90),
('RPET Polyester', '20mm', 300, 499, 0.71, 0.76, 0.77, 0.83),
('RPET Polyester', '20mm', 500, 999, 0.66, 0.71, 0.70, 0.77),
('RPET Polyester', '20mm', 1000, 1999, 0.55, 0.60, 0.57, 0.63),
('RPET Polyester', '20mm', 2000, 2999, 0.51, 0.55, 0.52, 0.58),
('RPET Polyester', '20mm', 3000, 4999, 0.47, 0.51, 0.48, 0.54),
('RPET Polyester', '20mm', 5000, NULL, 0.46, 0.50, 0.47, 0.53),
('RPET Polyester', '25mm', 100, 199, 1.02, 1.07, 1.16, 1.23),
('RPET Polyester', '25mm', 200, 299, 0.83, 0.88, 0.91, 0.98),
('RPET Polyester', '25mm', 300, 499, 0.79, 0.84, 0.85, 0.91),
('RPET Polyester', '25mm', 500, 999, 0.74, 0.79, 0.78, 0.85),
('RPET Polyester', '25mm', 1000, 1999, 0.62, 0.67, 0.65, 0.71),
('RPET Polyester', '25mm', 2000, 2999, 0.56, 0.61, 0.58, 0.64),
('RPET Polyester', '25mm', 3000, 4999, 0.53, 0.57, 0.54, 0.60),
('RPET Polyester', '25mm', 5000, NULL, 0.52, 0.56, 0.53, 0.58),
('RPET Polyester', '30mm', 100, 199, 1.38, 1.44, 1.54, 1.61),
('RPET Polyester', '30mm', 200, 299, 1.22, 1.28, 1.31, 1.38),
('RPET Polyester', '30mm', 300, 499, 1.19, 1.25, 1.25, 1.33),
('RPET Polyester', '30mm', 500, 999, 1.15, 1.21, 1.20, 1.28),
('RPET Polyester', '30mm', 1000, 1999, 0.99, 1.04, 1.02, 1.09),
('RPET Polyester', '30mm', 2000, 2999, 0.91, 0.96, 0.93, 1.00),
('RPET Polyester', '30mm', 3000, 4999, 0.86, 0.91, 0.88, 0.95),
('RPET Polyester', '30mm', 5000, NULL, 0.83, 0.88, 0.85, 0.92);

CREATE TEMPORARY TABLE tmp_flat_dye_price_matrix (
    target_material VARCHAR(50) NOT NULL,
    width_name VARCHAR(20) NOT NULL,
    min_quantity INT NOT NULL,
    max_quantity INT NULL,
    full_colour_price DECIMAL(10,3) NOT NULL,
    PRIMARY KEY (target_material, width_name, min_quantity)
);

INSERT INTO tmp_flat_dye_price_matrix VALUES
('Polyester', '10mm', 10, 49, 5.42),
('Polyester', '10mm', 50, 99, 1.18),
('Polyester', '10mm', 100, 199, 0.69),
('Polyester', '10mm', 200, 299, 0.54),
('Polyester', '10mm', 300, 499, 0.51),
('Polyester', '10mm', 500, 999, 0.43),
('Polyester', '10mm', 1000, 1999, 0.37),
('Polyester', '10mm', 2000, 2999, 0.35),
('Polyester', '10mm', 3000, 4999, 0.32),
('Polyester', '10mm', 5000, 24999, 0.30),
('Polyester', '10mm', 25000, NULL, 0.28),
('Polyester', '15mm', 10, 49, 5.457),
('Polyester', '15mm', 50, 99, 1.214),
('Polyester', '15mm', 100, 199, 0.74),
('Polyester', '15mm', 200, 299, 0.59),
('Polyester', '15mm', 300, 499, 0.56),
('Polyester', '15mm', 500, 999, 0.47),
('Polyester', '15mm', 1000, 1999, 0.404),
('Polyester', '15mm', 2000, 2999, 0.388),
('Polyester', '15mm', 3000, 4999, 0.349),
('Polyester', '15mm', 5000, NULL, 0.335),
('Polyester', '20mm', 10, 49, 5.49),
('Polyester', '20mm', 50, 99, 1.24),
('Polyester', '20mm', 100, 199, 0.79),
('Polyester', '20mm', 200, 299, 0.65),
('Polyester', '20mm', 300, 499, 0.62),
('Polyester', '20mm', 500, 999, 0.53),
('Polyester', '20mm', 1000, 1999, 0.46),
('Polyester', '20mm', 2000, 2999, 0.43),
('Polyester', '20mm', 3000, 4999, 0.39),
('Polyester', '20mm', 5000, NULL, 0.37),
('Polyester', '25mm', 10, 49, 5.54),
('Polyester', '25mm', 50, 99, 1.30),
('Polyester', '25mm', 100, 199, 0.90),
('Polyester', '25mm', 200, 299, 0.75),
('Polyester', '25mm', 300, 499, 0.72),
('Polyester', '25mm', 500, 999, 0.63),
('Polyester', '25mm', 1000, 1999, 0.55),
('Polyester', '25mm', 2000, 2999, 0.49),
('Polyester', '25mm', 3000, 4999, 0.47),
('Polyester', '25mm', 5000, 24999, 0.45),
('Polyester', '25mm', 25000, NULL, 0.43),
('Polyester', '30mm', 10, 49, 5.70),
('Polyester', '30mm', 50, 99, 1.45),
('Polyester', '30mm', 100, 199, 1.17),
('Polyester', '30mm', 200, 299, 1.06),
('Polyester', '30mm', 300, 499, 1.05),
('Polyester', '30mm', 500, 999, 1.00),
('Polyester', '30mm', 1000, 1999, 0.88),
('Polyester', '30mm', 2000, 2999, 0.82),
('Polyester', '30mm', 3000, 4999, 0.80),
('Polyester', '30mm', 5000, NULL, 0.77),
('RPET Polyester', '15mm', 10, 49, 5.46),
('RPET Polyester', '15mm', 50, 99, 1.21),
('RPET Polyester', '15mm', 100, 199, 0.76),
('RPET Polyester', '15mm', 200, 299, 0.62),
('RPET Polyester', '15mm', 300, 499, 0.59),
('RPET Polyester', '15mm', 500, 999, 0.49),
('RPET Polyester', '15mm', 1000, 1999, 0.43),
('RPET Polyester', '15mm', 2000, 2999, 0.41),
('RPET Polyester', '15mm', 3000, 4999, 0.37),
('RPET Polyester', '15mm', 5000, NULL, 0.36),
('RPET Polyester', '20mm', 10, 49, 5.49),
('RPET Polyester', '20mm', 50, 99, 1.24),
('RPET Polyester', '20mm', 100, 199, 0.82),
('RPET Polyester', '20mm', 200, 299, 0.70),
('RPET Polyester', '20mm', 300, 499, 0.67),
('RPET Polyester', '20mm', 500, 999, 0.55),
('RPET Polyester', '20mm', 1000, 1999, 0.48),
('RPET Polyester', '20mm', 2000, 2999, 0.45),
('RPET Polyester', '20mm', 3000, 4999, 0.41),
('RPET Polyester', '20mm', 5000, NULL, 0.40),
('RPET Polyester', '25mm', 10, 49, 5.54),
('RPET Polyester', '25mm', 50, 99, 1.30),
('RPET Polyester', '25mm', 100, 199, 0.92),
('RPET Polyester', '25mm', 200, 299, 0.77),
('RPET Polyester', '25mm', 300, 499, 0.75),
('RPET Polyester', '25mm', 500, 999, 0.66),
('RPET Polyester', '25mm', 1000, 1999, 0.57),
('RPET Polyester', '25mm', 2000, 2999, 0.51),
('RPET Polyester', '25mm', 3000, 4999, 0.49),
('RPET Polyester', '25mm', 5000, 24999, 0.47),
('RPET Polyester', '25mm', 25000, NULL, 0.45),
('RPET Polyester', '30mm', 10, 49, 5.70),
('RPET Polyester', '30mm', 50, 99, 1.45),
('RPET Polyester', '30mm', 100, 199, 1.17),
('RPET Polyester', '30mm', 200, 299, 1.06),
('RPET Polyester', '30mm', 300, 499, 1.05),
('RPET Polyester', '30mm', 500, 999, 1.00),
('RPET Polyester', '30mm', 1000, 1999, 0.88),
('RPET Polyester', '30mm', 2000, 2999, 0.82),
('RPET Polyester', '30mm', 3000, 4999, 0.80),
('RPET Polyester', '30mm', 5000, NULL, 0.77);

CREATE TEMPORARY TABLE tmp_flat_resolved_prices (
    variation_id INT NOT NULL,
    target_material VARCHAR(50) NOT NULL,
    width_name VARCHAR(20) NOT NULL,
    method_name VARCHAR(50) NOT NULL,
    side_name VARCHAR(30) NOT NULL,
    colour_name VARCHAR(30) NOT NULL,
    min_quantity INT NOT NULL,
    max_quantity INT NULL,
    price DECIMAL(10,3) NOT NULL,
    PRIMARY KEY (variation_id, min_quantity)
);

-- Screen print: price ends at One colour or Two colours.
INSERT INTO tmp_flat_resolved_prices (
    variation_id, target_material, width_name, method_name,
    side_name, colour_name, min_quantity, max_quantity, price
)
SELECT
    colour_option.variation_id,
    matrix.target_material,
    matrix.width_name,
    'Screen print',
    combination.side_name,
    combination.colour_name,
    matrix.min_quantity,
    matrix.max_quantity,
    CASE combination.price_column
        WHEN 1 THEN matrix.one_side_one_colour
        WHEN 2 THEN matrix.one_side_two_colours
        WHEN 3 THEN matrix.two_sides_one_colour
        WHEN 4 THEN matrix.two_sides_two_colours
    END
FROM tmp_flat_screen_price_matrix AS matrix
INNER JOIN variations AS flat
    ON flat.parent_id = 629
   AND flat.product_id = 39
   AND flat.name = 'Flat'
   AND flat.type_id = 105
INNER JOIN variations AS material
    ON material.parent_id = flat.variation_id
   AND material.product_id = 39
   AND material.name = matrix.target_material
   AND material.type_id = 110
INNER JOIN variations AS width_option
    ON width_option.parent_id = material.variation_id
   AND width_option.product_id = 39
   AND width_option.name = matrix.width_name
   AND width_option.type_id = 101
INNER JOIN variations AS screen_print
    ON screen_print.parent_id = width_option.variation_id
   AND screen_print.product_id = 39
   AND screen_print.name = 'Screen print'
   AND screen_print.type_id = 111
CROSS JOIN (
    SELECT 1 AS price_column, 'One side' AS side_name, 'One colour' AS colour_name
    UNION ALL SELECT 2, 'One side', 'Two colours'
    UNION ALL SELECT 3, 'Two sides', 'One colour'
    UNION ALL SELECT 4, 'Two sides', 'Two colours'
) AS combination
INNER JOIN variations AS printed_side
    ON printed_side.parent_id = screen_print.variation_id
   AND printed_side.product_id = 39
   AND printed_side.name = combination.side_name
   AND printed_side.type_id = 102
INNER JOIN variations AS colour_option
    ON colour_option.parent_id = printed_side.variation_id
   AND colour_option.product_id = 39
   AND colour_option.name = combination.colour_name
   AND colour_option.type_id = 112;

-- Dye Sublimation: CMYK 2 sides ends at Full colour.
INSERT INTO tmp_flat_resolved_prices (
    variation_id, target_material, width_name, method_name,
    side_name, colour_name, min_quantity, max_quantity, price
)
SELECT
    full_colour.variation_id,
    matrix.target_material,
    matrix.width_name,
    'Dye Sublimation',
    'Two sides',
    'Full colour',
    matrix.min_quantity,
    matrix.max_quantity,
    matrix.full_colour_price
FROM tmp_flat_dye_price_matrix AS matrix
INNER JOIN variations AS flat
    ON flat.parent_id = 629
   AND flat.product_id = 39
   AND flat.name = 'Flat'
   AND flat.type_id = 105
INNER JOIN variations AS material
    ON material.parent_id = flat.variation_id
   AND material.product_id = 39
   AND material.name = matrix.target_material
   AND material.type_id = 110
INNER JOIN variations AS width_option
    ON width_option.parent_id = material.variation_id
   AND width_option.product_id = 39
   AND width_option.name = matrix.width_name
   AND width_option.type_id = 101
INNER JOIN variations AS dye_sublimation
    ON dye_sublimation.parent_id = width_option.variation_id
   AND dye_sublimation.product_id = 39
   AND dye_sublimation.name = 'Dye Sublimation'
   AND dye_sublimation.type_id = 111
INNER JOIN variations AS printed_side
    ON printed_side.parent_id = dye_sublimation.variation_id
   AND printed_side.product_id = 39
   AND printed_side.name = 'Two sides'
   AND printed_side.type_id = 102
INNER JOIN variations AS full_colour
    ON full_colour.parent_id = printed_side.variation_id
   AND full_colour.product_id = 39
   AND full_colour.name = 'Full colour'
   AND full_colour.type_id = 112;

SET @resolved_prices = (SELECT COUNT(*) FROM tmp_flat_resolved_prices);

-- Final Colour nodes are the price-bearing variations.
UPDATE variations AS final_colour
INNER JOIN (
    SELECT DISTINCT variation_id
    FROM tmp_flat_resolved_prices
) AS target
    ON target.variation_id = final_colour.variation_id
SET final_colour.price_display_mode = 'prices';

-- Update existing tiers.
UPDATE prices AS current_price
INNER JOIN tmp_flat_resolved_prices AS desired
    ON desired.variation_id = current_price.variation_id
   AND desired.min_quantity = current_price.min_quantity
SET
    current_price.max_quantity = desired.max_quantity,
    current_price.price = desired.price;

SET @updated_prices = ROW_COUNT();

-- Insert missing tiers without duplicating a variation/minimum pair.
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT
    desired.min_quantity,
    desired.max_quantity,
    desired.price,
    desired.variation_id
FROM tmp_flat_resolved_prices AS desired
WHERE NOT EXISTS (
    SELECT 1
    FROM prices AS existing
    WHERE existing.variation_id = desired.variation_id
      AND existing.min_quantity = desired.min_quantity
);

SET @inserted_prices = ROW_COUNT();

-- Validation: resolved_price_rows must equal expected_price_rows.
SELECT
    expected.target_material,
    expected.method_name,
    expected.width_name,
    expected.expected_price_rows,
    COUNT(resolved.variation_id) AS resolved_price_rows,
    expected.expected_price_rows - COUNT(resolved.variation_id) AS missing_price_rows
FROM (
    SELECT
        target_material, width_name, 'Screen print' AS method_name,
        COUNT(*) * 4 AS expected_price_rows
    FROM tmp_flat_screen_price_matrix
    GROUP BY target_material, width_name

    UNION ALL

    SELECT
        target_material, width_name, 'Dye Sublimation',
        COUNT(*)
    FROM tmp_flat_dye_price_matrix
    GROUP BY target_material, width_name
) AS expected
LEFT JOIN tmp_flat_resolved_prices AS resolved
    ON resolved.target_material = expected.target_material
   AND resolved.width_name = expected.width_name
   AND resolved.method_name = expected.method_name
GROUP BY
    expected.target_material, expected.method_name,
    expected.width_name, expected.expected_price_rows
ORDER BY expected.target_material, expected.method_name, expected.width_name;

SELECT
    @resolved_prices AS resolved_prices,
    @updated_prices AS updated_prices,
    @inserted_prices AS inserted_prices;

DROP TEMPORARY TABLE tmp_flat_resolved_prices;
DROP TEMPORARY TABLE tmp_flat_dye_price_matrix;
DROP TEMPORARY TABLE tmp_flat_screen_price_matrix;

COMMIT;


