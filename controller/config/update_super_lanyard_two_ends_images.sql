-- SUPER LANYARD TWO ENDS: imagenes disponibles en SuperLanyardTwoEnds.zip.
-- Requisito: producto creado con insert_super_lanyard_double_ended.sql.
-- Copiar primero la carpeta controller del paquete a la raiz del sitio.
-- 64 imagenes de opcion y 61 de galeria. Flat y Polyester quedan pendientes.
-- No modifica precios, estructura, PDF ni el Super Lanyard original.
-- Completa solo images de opcion vacias. No duplica filas de galeria al reimportar.
-- Este archivo no se ha aplicado a una base real.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
START TRANSACTION;
SET @te_product_count = (SELECT COUNT(*) FROM products WHERE SKU = 'PRD-DOUBLE-ENDED-20260923-39');
SET @te_product_id = (SELECT MIN(product_id) FROM products WHERE SKU = 'PRD-DOUBLE-ENDED-20260923-39');
SET @te_expected_count = (SELECT COUNT(*) FROM variations WHERE product_id = @te_product_id AND SKU IN (
    'VRT-DOUBLE-ENDED-20260923-39-629',
    'VRT-DOUBLE-ENDED-20260923-39-634',
    'VRT-DOUBLE-ENDED-20260923-39-635',
    'VRT-DOUBLE-ENDED-20260923-39-637',
    'VRT-DOUBLE-ENDED-20260923-39-639',
    'VRT-DOUBLE-ENDED-20260923-39-640',
    'VRT-DOUBLE-ENDED-20260923-39-641',
    'VRT-DOUBLE-ENDED-20260923-39-642',
    'VRT-DOUBLE-ENDED-20260923-39-647',
    'VRT-DOUBLE-ENDED-20260923-39-648',
    'VRT-DOUBLE-ENDED-20260923-39-649',
    'VRT-DOUBLE-ENDED-20260923-39-650',
    'VRT-DOUBLE-ENDED-20260923-39-655',
    'VRT-DOUBLE-ENDED-20260923-39-662',
    'VRT-DOUBLE-ENDED-20260923-39-663',
    'VRT-DOUBLE-ENDED-20260923-39-664',
    'VRT-DOUBLE-ENDED-20260923-39-665',
    'VRT-DOUBLE-ENDED-20260923-39-666',
    'VRT-DOUBLE-ENDED-20260923-39-667',
    'VRT-DOUBLE-ENDED-20260923-39-668',
    'VRT-DOUBLE-ENDED-20260923-39-670',
    'VRT-DOUBLE-ENDED-20260923-39-671',
    'VRT-DOUBLE-ENDED-20260923-39-672',
    'VRT-DOUBLE-ENDED-20260923-39-673',
    'VRT-DOUBLE-ENDED-20260923-39-674',
    'VRT-DOUBLE-ENDED-20260923-39-675',
    'VRT-DOUBLE-ENDED-20260923-39-676',
    'VRT-DOUBLE-ENDED-20260923-39-677',
    'VRT-DOUBLE-ENDED-20260923-39-678',
    'VRT-DOUBLE-ENDED-20260923-39-679',
    'VRT-DOUBLE-ENDED-20260923-39-680',
    'VRT-DOUBLE-ENDED-20260923-39-773',
    'VRT-DOUBLE-ENDED-20260923-39-774',
    'VRT-DOUBLE-ENDED-20260923-39-775',
    'VRT-DOUBLE-ENDED-20260923-39-776',
    'VRT-DOUBLE-ENDED-20260923-39-777',
    'VRT-DOUBLE-ENDED-20260923-39-780',
    'VRT-DOUBLE-ENDED-20260923-39-781',
    'VRT-DOUBLE-ENDED-20260923-39-782',
    'VRT-DOUBLE-ENDED-20260923-39-783',
    'VRT-DOUBLE-ENDED-20260923-39-784',
    'VRT-DOUBLE-ENDED-20260923-39-785',
    'VRT-DOUBLE-ENDED-20260923-39-787',
    'VRT-DOUBLE-ENDED-20260923-39-788',
    'VRT-DOUBLE-ENDED-20260923-39-789',
    'VRT-DOUBLE-ENDED-20260923-39-790',
    'VRT-DOUBLE-ENDED-20260923-39-791',
    'VRT-DOUBLE-ENDED-20260923-39-792',
    'VRT-DOUBLE-ENDED-20260923-39-793',
    'VRT-DOUBLE-ENDED-20260923-39-794',
    'VRT-DOUBLE-ENDED-20260923-39-802',
    'VRT-DOUBLE-ENDED-20260923-39-803',
    'VRT-DOUBLE-ENDED-20260923-39-804',
    'VRT-DOUBLE-ENDED-20260923-39-805',
    'VRT-DOUBLE-ENDED-20260923-39-806',
    'VRT-DOUBLE-ENDED-20260923-39-807',
    'VRT-DOUBLE-ENDED-20260923-39-809',
    'VRT-DOUBLE-ENDED-20260923-39-810',
    'VRT-DOUBLE-ENDED-20260923-39-811',
    'VRT-DOUBLE-ENDED-20260923-39-812',
    'VRT-DOUBLE-ENDED-20260923-39-816',
    'VRT-DOUBLE-ENDED-20260923-39-817',
    'VRT-DOUBLE-ENDED-20260923-39-818',
    'VRT-DOUBLE-ENDED-20260923-39-819',
    'VRT-DOUBLE-ENDED-20260923-39-820',
    'VRT-DOUBLE-ENDED-20260923-39-821',
    'VRT-DOUBLE-ENDED-20260923-39-822',
    'VRT-DOUBLE-ENDED-20260923-39-823'
));
SET @te_unique_count = (SELECT COUNT(DISTINCT SKU) FROM variations WHERE product_id = @te_product_id);
SET @te_total_count = (SELECT COUNT(*) FROM variations WHERE product_id = @te_product_id);
SET @te_ready = (@te_product_count = 1 AND @te_expected_count = 68 AND @te_unique_count = 68 AND @te_total_count = 68);

-- Default / Flat / RPET Polyester
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-637/RPET-Polyester-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-637' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-639/15mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-639' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-639/15mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-639'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-639/15mm-TwoEnds.png');

-- Default / Flat / Polyester / 20mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-640/20mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-640' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 20mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-640/20mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-640'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-640/20mm-TwoEnds.png');

-- Default / Flat / Polyester / 25mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-641/25mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-641' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 25mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-641/25mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-641'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-641/25mm-TwoEnds.png');

-- Default / Flat / Polyester / 30mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-642/30mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-642' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 30mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-642/30mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-642'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-642/30mm-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-647/15mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-647' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-647/15mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-647'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-647/15mm-TwoEnds.png');

-- Default / Flat / RPET Polyester / 20mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-648/20mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-648' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 20mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-648/20mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-648'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-648/20mm-TwoEnds.png');

-- Default / Flat / RPET Polyester / 25mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-649/25mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-649' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 30mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-650/30mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-650' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-655/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-655' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-655/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-655'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-655/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-662/Screen-Print-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-662' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-662/Screen-Print-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-662'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-662/Screen-Print-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print / One colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-663/One-Colour-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-663' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print / One colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-663/One-Colour-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-663'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-663/One-Colour-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print / One colour / One side
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-664/One-Side-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-664' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print / One colour / One side
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-664/One-Side-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-664'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-664/One-Side-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print / One colour / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-665/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-665' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print / One colour / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-665/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-665'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-665/Two-Sides-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print / Two colours
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-666/Two-Colours-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-666' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print / Two colours
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-666/Two-Colours-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-666'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-666/Two-Colours-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print / Two colours / One side
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-667/One-Side-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-667' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print / Two colours / One side
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-667/One-Side-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-667'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-667/One-Side-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Screen print / Two colours / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-668/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-668' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Screen print / Two colours / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-668/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-668'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-668/Two-Sides-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-670/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-670' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-670/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-670'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-670/Two-Sides-TwoEnds.png');

-- Default / Flat / Polyester / 15mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-671/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-671' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 15mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-671/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-671'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-671/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / Polyester / 20mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-672/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-672' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 20mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-672/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-672'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-672/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / Polyester / 20mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-673/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-673' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 20mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-673/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-673'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-673/Two-Sides-TwoEnds.png');

-- Default / Flat / Polyester / 20mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-674/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-674' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 20mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-674/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-674'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-674/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / Polyester / 25mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-675/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-675' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 25mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-675/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-675'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-675/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / Polyester / 25mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-676/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-676' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 25mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-676/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-676'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-676/Two-Sides-TwoEnds.png');

-- Default / Flat / Polyester / 25mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-677/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-677' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 25mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-677/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-677'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-677/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / Polyester / 30mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-678/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-678' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 30mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-678/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-678'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-678/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / Polyester / 30mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-679/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-679' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 30mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-679/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-679'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-679/Two-Sides-TwoEnds.png');

-- Default / Flat / Polyester / 30mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-680/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-680' AND COALESCE(image, '') = '';

-- Default / Flat / Polyester / 30mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-680/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-680'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-680/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-773/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-773' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-773/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-773'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-773/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-774/Screen-Print-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-774' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-774/Screen-Print-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-774'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-774/Screen-Print-TwoEnds.png');

-- Default / Flat / RPET Polyester / 20mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-775/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-775' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 20mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-775/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-775'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-775/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / RPET Polyester / 25mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-776/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-776' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 25mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-776/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-776'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-776/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / RPET Polyester / 30mm / Dye Sublimation
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-777/Dye-Sublimation-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-777' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 30mm / Dye Sublimation
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-777/Dye-Sublimation-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-777'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-777/Dye-Sublimation-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-780/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-780' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-780/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-780'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-780/Two-Sides-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print / One colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-781/One-Colour-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-781' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print / One colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-781/One-Colour-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-781'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-781/One-Colour-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print / Two colours
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-782/Two-Colours-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-782' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print / Two colours
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-782/Two-Colours-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-782'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-782/Two-Colours-TwoEnds.png');

-- Default / Flat / RPET Polyester / 20mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-783/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-783' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 20mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-783/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-783'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-783/Two-Sides-TwoEnds.png');

-- Default / Flat / RPET Polyester / 25mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-784/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-784' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 25mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-784/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-784'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-784/Two-Sides-TwoEnds.png');

-- Default / Flat / RPET Polyester / 30mm / Dye Sublimation / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-785/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-785' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 30mm / Dye Sublimation / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-785/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-785'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-785/Two-Sides-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-787/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-787' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-787/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-787'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-787/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print / One colour / One side
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-788/One-Side-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-788' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print / One colour / One side
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-788/One-Side-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-788'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-788/One-Side-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print / One colour / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-789/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-789' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print / One colour / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-789/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-789'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-789/Two-Sides-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print / Two colours / One side
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-790/One-Side-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-790' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print / Two colours / One side
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-790/One-Side-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-790'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-790/One-Side-TwoEnds.png');

-- Default / Flat / RPET Polyester / 15mm / Screen print / Two colours / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-791/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-791' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 15mm / Screen print / Two colours / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-791/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-791'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-791/Two-Sides-TwoEnds.png');

-- Default / Flat / RPET Polyester / 20mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-792/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-792' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 20mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-792/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-792'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-792/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / RPET Polyester / 25mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-793/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-793' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 25mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-793/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-793'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-793/Full-Colour-CMYK-TwoEnds.png');

-- Default / Flat / RPET Polyester / 30mm / Dye Sublimation / Two sides / Full colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-794/CMYK-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-794' AND COALESCE(image, '') = '';

-- Default / Flat / RPET Polyester / 30mm / Dye Sublimation / Two sides / Full colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-794/Full-Colour-CMYK-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-794'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-794/Full-Colour-CMYK-TwoEnds.png');

-- Default / Tubular
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-802/Tubular-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-802' AND COALESCE(image, '') = '';

-- Default / Tubular
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-802/Tubular-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-802'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-802/Tubular-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-804/12mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-804' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-804/12mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-804'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-804/12mm-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-805/15mm-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-805' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-805/15mm-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-805'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-805/15mm-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-806/Screen-Print-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-806' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-806/Screen-Print-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-806'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-806/Screen-Print-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-807/Screen-Print-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-807' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-807/Screen-Print-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-807'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-807/Screen-Print-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print / One side
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-809/One-Side-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-809' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print / One side
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-809/One-Side-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-809'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-809/One-Side-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print / One side
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-810/One-Side-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-810' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print / One side
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-810/One-Side-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-810'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-810/One-Side-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-811/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-811' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-811/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-811'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-811/Two-Sides-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print / Two sides
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-812/Two-Sides-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-812' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print / Two sides
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-812/Two-Sides-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-812'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-812/Two-Sides-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print / One side / One colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-816/One-Colour-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-816' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print / One side / One colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-816/One-Colour-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-816'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-816/One-Colour-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print / Two sides / One colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-817/One-Colour-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-817' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print / Two sides / One colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-817/One-Colour-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-817'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-817/One-Colour-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print / One side / One colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-818/One-Colour-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-818' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print / One side / One colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-818/One-Colour-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-818'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-818/One-Colour-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print / Two sides / One colour
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-819/One-Colour-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-819' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print / Two sides / One colour
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-819/One-Colour-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-819'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-819/One-Colour-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print / One side / Two colours
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-820/Two-Colours-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-820' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print / One side / Two colours
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-820/Two-Colours-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-820'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-820/Two-Colours-TwoEnds.png');

-- Default / Tubular / Polyester / 12mm / Screen print / Two sides / Two colours
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-821/Two-Colours-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-821' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 12mm / Screen print / Two sides / Two colours
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-821/Two-Colours-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-821'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-821/Two-Colours-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print / One side / Two colours
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-822/Two-Colours-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-822' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print / One side / Two colours
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-822/Two-Colours-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-822'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-822/Two-Colours-TwoEnds.png');

-- Default / Tubular / Polyester / 15mm / Screen print / Two sides / Two colours
UPDATE variations
SET image = 'views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-823/Two-Colours-TwoEnds.png'
WHERE @te_ready = 1 AND product_id = @te_product_id
  AND SKU = 'VRT-DOUBLE-ENDED-20260923-39-823' AND COALESCE(image, '') = '';

-- Default / Tubular / Polyester / 15mm / Screen print / Two sides / Two colours
INSERT INTO images (link, updated, variation_id)
SELECT 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-823/Two-Colours-TwoEnds.png', 1, v.variation_id
FROM variations v
WHERE @te_ready = 1 AND v.product_id = @te_product_id AND v.SKU = 'VRT-DOUBLE-ENDED-20260923-39-823'
  AND NOT EXISTS (SELECT 1 FROM images i WHERE i.variation_id = v.variation_id AND i.link = 'controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-823/Two-Colours-TwoEnds.png');

COMMIT;

SELECT IF(@te_ready = 1, 'APPLIED_AVAILABLE_IMAGES', 'NOT_APPLIED: expected one product and its 68 exact variation SKUs') AS import_result, @te_product_id AS product_id;
SELECT p.SKU,
  (SELECT COUNT(*) FROM variations v WHERE v.product_id = p.product_id AND COALESCE(v.image, '') <> '') AS variation_images_count,
  (SELECT COUNT(*) FROM images i JOIN variations v ON v.variation_id = i.variation_id WHERE v.product_id = p.product_id) AS gallery_images_count
FROM products p WHERE p.product_id = @te_product_id;
