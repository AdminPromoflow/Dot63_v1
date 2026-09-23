-- SUPER LANYARD - DOUBLE-ENDED
-- Preparado a partir de u273173398_dot63.sql (23 de septiembre de 2026).
-- Importar este archivo completo en la base u273173398_dot63 desde phpMyAdmin.
-- No ejecutar/importar de nuevo el dump original para crear este producto.
--
-- Origen: Super Lanyard, product_id 39.
-- Copia: 68 variaciones, 68 items y 146 precios; cada precio original + GBP 0.06.
-- Categoria: Lanyards. Grupo: Lanyards - Double-Ended.
-- Se conservan estado 2, aprobacion 1, proveedor, opciones y referencias a PDF.
-- Sin imagenes: variations.image = NULL y ninguna fila nueva en images.
-- Los IDs son AUTO_INCREMENT y los padres se enlazan exclusivamente a la copia.
-- Reimportar el mismo archivo no vuelve a crear el producto si ya existe su SKU.
-- No modifica ni elimina el producto original. No necesita migraciones ni procedimientos.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
START TRANSACTION;
SET @de_sku = 'PRD-DOUBLE-ENDED-20260923-39';
SET @de_source_id = (SELECT product_id FROM products WHERE SKU = 'PRD-20260820-202626-008131-7E0BD6F150' LIMIT 1);
SET @de_supplier_id = (SELECT supplier_id FROM products WHERE product_id = @de_source_id);
SET @de_group_id = (SELECT g.group_id FROM `groups` g INNER JOIN categories c ON c.category_id = g.category_id WHERE g.name = 'Lanyards - Double-Ended' AND c.name = 'Lanyards' ORDER BY g.group_id LIMIT 1);
SET @de_existing_id = (SELECT product_id FROM products WHERE SKU = @de_sku LIMIT 1);
SET @de_types_ok = ((SELECT COUNT(*) FROM type_variations WHERE (type_id = 101 AND type_name = 'Width') OR (type_id = 102 AND type_name = 'Printed sides') OR (type_id = 105 AND type_name = 'Theme') OR (type_id = 110 AND type_name = 'Material') OR (type_id = 111 AND type_name = 'Print technique') OR (type_id = 112 AND type_name = 'Colour')) = 6);
SET @de_can_create = (@de_source_id IS NOT NULL AND @de_group_id IS NOT NULL AND @de_existing_id IS NULL AND @de_types_ok AND EXISTS (SELECT 1 FROM suppliers WHERE supplier_id = @de_supplier_id));

-- Producto nuevo: misma configuracion que el original, en el grupo de dos extremos.
INSERT INTO products (SKU, name, description, descriptive_tagline, status, date_status, is_approved, supplier_id, group_id)
SELECT @de_sku, 'Super Lanyard - Double-Ended', '', '', '2', NULL, 1, @de_supplier_id, @de_group_id
WHERE @de_can_create;
SET @de_product_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variaciones: se omiten todas las imagenes y se conservan los PDF originales.

-- Variacion original 629: Default
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Default', 'VRT-DOUBLE-ENDED-20260923-39-629', NULL, NULL, NULL, NULL, NULL, @de_product_id, NULL WHERE @de_product_id IS NOT NULL;
SET @de_v_629 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 634: Flat
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Flat', 'VRT-DOUBLE-ENDED-20260923-39-634', NULL, NULL, '', NULL, @de_v_629, @de_product_id, 105 WHERE @de_product_id IS NOT NULL;
SET @de_v_634 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 802: Tubular
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Tubular', 'VRT-DOUBLE-ENDED-20260923-39-802', NULL, NULL, '', NULL, @de_v_629, @de_product_id, 105 WHERE @de_product_id IS NOT NULL;
SET @de_v_802 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 635: Polyester
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Polyester', 'VRT-DOUBLE-ENDED-20260923-39-635', NULL, NULL, '', NULL, @de_v_634, @de_product_id, 110 WHERE @de_product_id IS NOT NULL;
SET @de_v_635 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 637: RPET Polyester
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'RPET Polyester', 'VRT-DOUBLE-ENDED-20260923-39-637', NULL, NULL, '', NULL, @de_v_634, @de_product_id, 110 WHERE @de_product_id IS NOT NULL;
SET @de_v_637 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 803: Polyester
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Polyester', 'VRT-DOUBLE-ENDED-20260923-39-803', NULL, NULL, '', NULL, @de_v_802, @de_product_id, 110 WHERE @de_product_id IS NOT NULL;
SET @de_v_803 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 639: 15mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '15mm', 'VRT-DOUBLE-ENDED-20260923-39-639', NULL, NULL, '', NULL, @de_v_635, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_639 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 640: 20mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '20mm', 'VRT-DOUBLE-ENDED-20260923-39-640', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-210535-607203-F8E77FEA84/20mm-Lanyard-Spot-Colour-Template.pdf', '20mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_635, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_640 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 641: 25mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '25mm', 'VRT-DOUBLE-ENDED-20260923-39-641', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-210622-427017-8B375BE936/25mm-Lanyard-Spot-Colour-Template.pdf', '25mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_635, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_641 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 642: 30mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '30mm', 'VRT-DOUBLE-ENDED-20260923-39-642', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-210640-834817-1E46B1B0DF/30mm-Lanyard-Spot-Colour-Template.pdf', '30mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_635, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_642 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 647: 15mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '15mm', 'VRT-DOUBLE-ENDED-20260923-39-647', NULL, NULL, '', NULL, @de_v_637, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_647 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 648: 20mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '20mm', 'VRT-DOUBLE-ENDED-20260923-39-648', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-213051-411359-3F31DEB529/20mm-Lanyard-Spot-Colour-Template.pdf', '20mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_637, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_648 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 649: 25mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '25mm', 'VRT-DOUBLE-ENDED-20260923-39-649', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-213105-042264-A038ADA2F4/25mm-Lanyard-Spot-Colour-Template.pdf', '25mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_637, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_649 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 650: 30mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '30mm', 'VRT-DOUBLE-ENDED-20260923-39-650', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-213117-231350-97992FA0D0/30mm-Lanyard-Spot-Colour-Template.pdf', '30mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_637, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_650 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 804: 12mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '12mm', 'VRT-DOUBLE-ENDED-20260923-39-804', NULL, NULL, '', NULL, @de_v_803, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_804 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 805: 15mm
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT '15mm', 'VRT-DOUBLE-ENDED-20260923-39-805', NULL, NULL, '', NULL, @de_v_803, @de_product_id, 101 WHERE @de_product_id IS NOT NULL;
SET @de_v_805 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 655: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-655', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-223115-953803-9749CF98A0/15mm-Lanyard-Spot-Colour-Template.pdf', '15mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_639, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_655 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 662: Screen print
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Screen print', 'VRT-DOUBLE-ENDED-20260923-39-662', NULL, NULL, '', NULL, @de_v_639, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_662 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 672: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-672', NULL, NULL, '', NULL, @de_v_640, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_672 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 675: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-675', NULL, NULL, '', NULL, @de_v_641, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_675 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 678: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-678', NULL, NULL, '', NULL, @de_v_642, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_678 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 773: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-773', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-279095-62F1D8529D/15mm-Lanyard-Spot-Colour-Template.pdf', '15mm-Lanyard-Spot-Colour-Template.pdf', NULL, @de_v_647, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_773 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 774: Screen print
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Screen print', 'VRT-DOUBLE-ENDED-20260923-39-774', NULL, NULL, '', NULL, @de_v_647, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_774 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 775: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-775', NULL, NULL, '', NULL, @de_v_648, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_775 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 776: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-776', NULL, NULL, '', NULL, @de_v_649, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_776 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 777: Dye Sublimation
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Dye Sublimation', 'VRT-DOUBLE-ENDED-20260923-39-777', NULL, NULL, '', NULL, @de_v_650, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_777 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 806: Screen print
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Screen print', 'VRT-DOUBLE-ENDED-20260923-39-806', NULL, NULL, '', NULL, @de_v_804, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_806 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 807: Screen print
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Screen print', 'VRT-DOUBLE-ENDED-20260923-39-807', NULL, NULL, '', NULL, @de_v_805, @de_product_id, 111 WHERE @de_product_id IS NOT NULL;
SET @de_v_807 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 663: One colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One colour', 'VRT-DOUBLE-ENDED-20260923-39-663', NULL, NULL, '', NULL, @de_v_662, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_663 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 666: Two colours
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two colours', 'VRT-DOUBLE-ENDED-20260923-39-666', NULL, NULL, '', NULL, @de_v_662, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_666 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 670: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-670', NULL, NULL, '', NULL, @de_v_655, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_670 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 673: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-673', NULL, NULL, '', NULL, @de_v_672, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_673 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 676: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-676', NULL, NULL, '', NULL, @de_v_675, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_676 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 679: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-679', NULL, NULL, '', NULL, @de_v_678, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_679 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 780: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-780', NULL, NULL, '', NULL, @de_v_773, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_780 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 781: One colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One colour', 'VRT-DOUBLE-ENDED-20260923-39-781', NULL, NULL, '', NULL, @de_v_774, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_781 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 782: Two colours
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two colours', 'VRT-DOUBLE-ENDED-20260923-39-782', NULL, NULL, '', NULL, @de_v_774, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_782 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 783: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-783', NULL, NULL, '', NULL, @de_v_775, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_783 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 784: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-784', NULL, NULL, '', NULL, @de_v_776, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_784 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 785: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-785', NULL, NULL, '', NULL, @de_v_777, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_785 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 809: One side
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One side', 'VRT-DOUBLE-ENDED-20260923-39-809', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-123248-734377-6B43B0529D/12mm-Lanyard-Spot-Colour-Template1S_copia.pdf', '12mm-Lanyard-Spot-Colour-Template1S copia.pdf', NULL, @de_v_806, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_809 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 810: One side
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One side', 'VRT-DOUBLE-ENDED-20260923-39-810', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-123248-734377-6B43B06E9D/15mm-Lanyard-Spot-Colour-Template1S.pdf', '15mm-Lanyard-Spot-Colour-Template1S.pdf', NULL, @de_v_807, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_810 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 811: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-811', NULL, NULL, '', NULL, @de_v_806, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_811 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 812: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-812', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-123248-734377-6B43B0869D/15mm-Lanyard-Spot-Colour-Template2S.pdf', '15mm-Lanyard-Spot-Colour-Template2S.pdf', NULL, @de_v_807, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_812 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 664: One side
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One side', 'VRT-DOUBLE-ENDED-20260923-39-664', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024504-409888-FA2F69A613/15mm-Lanyard-Spot-Colour-Template1S.pdf', '', NULL, @de_v_663, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_664 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 665: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-665', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024532-289942-75421A50DB/15mm-Lanyard-Spot-Colour-Template2S.pdf', '15mm-Lanyard-Spot-Colour-Template2S.pdf', NULL, @de_v_663, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_665 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 667: One side
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One side', 'VRT-DOUBLE-ENDED-20260923-39-667', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024714-481692-DF08699D56/15mm-Lanyard-Spot-Colour-Template1S.pdf', '15mm-Lanyard-Spot-Colour-Template1S.pdf', NULL, @de_v_666, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_667 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 668: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-668', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024745-482250-F03AE9D899/15mm-Lanyard-Spot-Colour-Template2S.pdf', '15mm-Lanyard-Spot-Colour-Template2S.pdf', NULL, @de_v_666, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_668 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 671: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-671', NULL, NULL, '', 'prices', @de_v_670, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_671 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 674: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-674', NULL, NULL, '', 'prices', @de_v_673, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_674 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 677: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-677', NULL, NULL, '', 'prices', @de_v_676, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_677 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 680: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-680', NULL, NULL, '', 'prices', @de_v_679, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_680 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 787: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-787', NULL, NULL, '', 'prices', @de_v_780, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_787 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 788: One side
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One side', 'VRT-DOUBLE-ENDED-20260923-39-788', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B10E9D/15mm-Lanyard-Spot-Colour-Template1S.pdf', '15mm-Lanyard-Spot-Colour-Template1S.pdf', NULL, @de_v_781, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_788 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 789: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-789', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B1C49D/15mm-Lanyard-Spot-Colour-Template2S.pdf', '15mm-Lanyard-Spot-Colour-Template2S.pdf', NULL, @de_v_781, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_789 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 790: One side
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One side', 'VRT-DOUBLE-ENDED-20260923-39-790', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B24F9D/15mm-Lanyard-Spot-Colour-Template1S.pdf', '15mm-Lanyard-Spot-Colour-Template1S.pdf', NULL, @de_v_782, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_790 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 791: Two sides
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two sides', 'VRT-DOUBLE-ENDED-20260923-39-791', NULL, 'views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B2B29D/15mm-Lanyard-Spot-Colour-Template2S.pdf', '15mm-Lanyard-Spot-Colour-Template2S.pdf', NULL, @de_v_782, @de_product_id, 102 WHERE @de_product_id IS NOT NULL;
SET @de_v_791 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 792: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-792', NULL, NULL, '', 'prices', @de_v_783, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_792 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 793: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-793', NULL, NULL, '', 'prices', @de_v_784, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_793 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 794: Full colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Full colour', 'VRT-DOUBLE-ENDED-20260923-39-794', NULL, NULL, '', 'prices', @de_v_785, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_794 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 816: One colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One colour', 'VRT-DOUBLE-ENDED-20260923-39-816', NULL, NULL, '', 'prices', @de_v_809, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_816 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 817: One colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One colour', 'VRT-DOUBLE-ENDED-20260923-39-817', NULL, NULL, '', 'prices', @de_v_811, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_817 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 818: One colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One colour', 'VRT-DOUBLE-ENDED-20260923-39-818', NULL, NULL, '', 'prices', @de_v_810, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_818 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 819: One colour
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'One colour', 'VRT-DOUBLE-ENDED-20260923-39-819', NULL, NULL, '', 'prices', @de_v_812, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_819 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 820: Two colours
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two colours', 'VRT-DOUBLE-ENDED-20260923-39-820', NULL, NULL, '', 'prices', @de_v_809, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_820 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 821: Two colours
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two colours', 'VRT-DOUBLE-ENDED-20260923-39-821', NULL, NULL, '', 'prices', @de_v_811, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_821 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 822: Two colours
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two colours', 'VRT-DOUBLE-ENDED-20260923-39-822', NULL, NULL, '', 'prices', @de_v_810, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_822 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Variacion original 823: Two colours
INSERT INTO variations (name, SKU, image, pdf_artwork, name_pdf_artwork, price_display_mode, parent_id, product_id, type_id)
SELECT 'Two colours', 'VRT-DOUBLE-ENDED-20260923-39-823', NULL, NULL, '', 'prices', @de_v_812, @de_product_id, 112 WHERE @de_product_id IS NOT NULL;
SET @de_v_823 = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

-- Items: mismos textos y asociaciones que en el SQL original.
INSERT INTO items (name, description, variation_id)
SELECT 'Super Lanyard Base', 'Build a standout lanyard from this base.', @de_v_629 WHERE @de_v_629 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Flat Lanyard Style', 'Smooth flat tape with a clean modern profile.', @de_v_634 WHERE @de_v_634 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Polyester', 'Durable polyester for reliable everyday wear.', @de_v_635 WHERE @de_v_635 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'RPET Polyester', 'Recycled polyester with a lower-impact finish.', @de_v_637 WHERE @de_v_637 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Width', 'Balanced 15mm tape for everyday versatility.', @de_v_639 WHERE @de_v_639 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm Width', 'Roomy 20mm tape for clear, visible branding.', @de_v_640 WHERE @de_v_640 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm Width', 'Bold 25mm tape for greater design impact.', @de_v_641 WHERE @de_v_641 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm Width', 'Extra-wide 30mm tape for maximum visibility.', @de_v_642 WHERE @de_v_642 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET Width', 'Slim recycled tape with everyday versatility.', @de_v_647 WHERE @de_v_647 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm RPET Width', 'Wide recycled tape for clear brand visibility.', @de_v_648 WHERE @de_v_648 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm RPET Width', 'Bold recycled tape with extra design space.', @de_v_649 WHERE @de_v_649 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm RPET Width', 'Extra-wide recycled tape for maximum impact.', @de_v_650 WHERE @de_v_650 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Dye Sublimation', 'Vibrant full-colour print on 15mm polyester.', @de_v_655 WHERE @de_v_655 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Screen Print', 'Crisp screen-printed detail on 15mm polyester.', @de_v_662 WHERE @de_v_662 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'One-Colour Screen Print', 'Clean artwork printed in one solid colour.', @de_v_663 WHERE @de_v_663 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'One-Sided One-Colour Print', 'Single-colour artwork printed on one side.', @de_v_664 WHERE @de_v_664 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Two-Sided One-Colour Print', 'Single-colour artwork printed on both sides.', @de_v_665 WHERE @de_v_665 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Two-Colour Screen Print', 'Two solid colours for extra visual definition.', @de_v_666 WHERE @de_v_666 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'One-Sided Two-Colour Print', 'Two-colour artwork printed on one side.', @de_v_667 WHERE @de_v_667 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Two-Sided Two-Colour Print', 'Two-colour artwork printed on both sides.', @de_v_668 WHERE @de_v_668 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Two-Sided Sublimation', 'Full-colour sublimation across both sides.', @de_v_670 WHERE @de_v_670 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Full-Colour Two-Sided Print', 'Rich full-colour artwork on both lanyard sides.', @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm Dye Sublimation', 'Vibrant full-colour print on 20mm polyester.', @de_v_672 WHERE @de_v_672 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm Two-Sided Sublimation', '20mm sublimation printed across both sides.', @de_v_673 WHERE @de_v_673 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm Full-Colour Print', 'Full-colour artwork on a wide 20mm lanyard.', @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm Dye Sublimation', 'Vibrant full-colour print on 25mm polyester.', @de_v_675 WHERE @de_v_675 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm Two-Sided Sublimation', '25mm sublimation printed across both sides.', @de_v_676 WHERE @de_v_676 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm Full-Colour Print', 'Full-colour artwork on a bold 25mm lanyard.', @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm Dye Sublimation', 'Vibrant full-colour print on 30mm polyester.', @de_v_678 WHERE @de_v_678 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm Two-Sided Sublimation', '30mm sublimation printed across both sides.', @de_v_679 WHERE @de_v_679 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm Full-Colour Print', 'Full-colour artwork on an extra-wide lanyard.', @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET Dye Sublimation', 'Full-colour sublimation on 15mm recycled PET.', @de_v_773 WHERE @de_v_773 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET Screen Print', 'Crisp screen print on 15mm recycled polyester.', @de_v_774 WHERE @de_v_774 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm RPET Dye Sublimation', 'Full-colour sublimation on 20mm recycled PET.', @de_v_775 WHERE @de_v_775 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm RPET Dye Sublimation', 'Full-colour sublimation on 25mm recycled PET.', @de_v_776 WHERE @de_v_776 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm RPET Dye Sublimation', 'Full-colour sublimation on 30mm recycled PET.', @de_v_777 WHERE @de_v_777 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET Two-Sided Print', '15mm recycled tape printed on both sides.', @de_v_780 WHERE @de_v_780 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET One-Colour Print', 'One-colour screen print on 15mm recycled tape.', @de_v_781 WHERE @de_v_781 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET Two-Colour Print', 'Two-colour screen print on 15mm recycled tape.', @de_v_782 WHERE @de_v_782 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm RPET Two-Sided Print', '20mm recycled tape printed on both sides.', @de_v_783 WHERE @de_v_783 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm RPET Two-Sided Print', '25mm recycled tape printed on both sides.', @de_v_784 WHERE @de_v_784 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm RPET Two-Sided Print', '30mm recycled tape printed on both sides.', @de_v_785 WHERE @de_v_785 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm RPET Full-Colour Print', 'Full-colour finish on 15mm recycled tape.', @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm One-Colour One-Sided', 'One-colour artwork on one side of 15mm tape.', @de_v_788 WHERE @de_v_788 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm One-Colour Two-Sided', 'One-colour artwork on both sides of 15mm tape.', @de_v_789 WHERE @de_v_789 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Two-Colour One-Sided', 'Two-colour artwork on one side of 15mm tape.', @de_v_790 WHERE @de_v_790 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Two-Colour Two-Sided', 'Two-colour artwork on both sides of 15mm tape.', @de_v_791 WHERE @de_v_791 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '20mm RPET Full-Colour Print', 'Full-colour finish on 20mm recycled tape.', @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '25mm RPET Full-Colour Print', 'Full-colour finish on 25mm recycled tape.', @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '30mm RPET Full-Colour Print', 'Full-colour finish on 30mm recycled tape.', @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Tubular Lanyard Style', 'Rounded tubular profile with a soft hand feel.', @de_v_802 WHERE @de_v_802 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT 'Tubular Polyester', 'Soft tubular polyester made for daily comfort.', @de_v_803 WHERE @de_v_803 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm Tubular Width', 'Slim tubular tape for lightweight comfort.', @de_v_804 WHERE @de_v_804 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Tubular Width', 'Classic tubular tape for easy branding.', @de_v_805 WHERE @de_v_805 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm Tubular Screen Print', 'Crisp screen print on slim 12mm tubular tape.', @de_v_806 WHERE @de_v_806 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Tubular Screen Print', 'Crisp screen print on classic 15mm tubular tape.', @de_v_807 WHERE @de_v_807 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm One-Sided Print', 'Focused artwork on one side of 12mm tape.', @de_v_809 WHERE @de_v_809 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm One-Sided Print', 'Focused artwork on one side of 15mm tape.', @de_v_810 WHERE @de_v_810 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm Two-Sided Print', 'Continuous artwork across both sides of 12mm tape.', @de_v_811 WHERE @de_v_811 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Two-Sided Print', 'Continuous artwork across both sides of 15mm tape.', @de_v_812 WHERE @de_v_812 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm One-Colour One-Sided', 'One solid colour on one side of 12mm tape.', @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm One-Colour Two-Sided', 'One solid colour across both sides of 12mm tape.', @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm One-Colour One-Sided', 'One solid colour on one side of 15mm tape.', @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm One-Colour Two-Sided', 'One solid colour across both sides of 15mm tape.', @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm Two-Colour One-Sided', 'Two bold colours on one side of 12mm tape.', @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '12mm Two-Colour Two-Sided', 'Two bold colours across both sides of 12mm tape.', @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Two-Colour One-Sided', 'Two bold colours on one side of 15mm tape.', @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO items (name, description, variation_id)
SELECT '15mm Two-Colour Two-Sided', 'Two bold colours across both sides of 15mm tape.', @de_v_823 WHERE @de_v_823 IS NOT NULL;

-- Precios: todos los importes ya incluyen GBP 0.06 adicionales.
-- Se mantienen exactamente los limites min_quantity y max_quantity.
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.96, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.76, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.71, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.65, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.55, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.51, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.48, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.46, @de_v_818 WHERE @de_v_818 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.11, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.84, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.78, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.70, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.58, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.53, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.50, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.48, @de_v_819 WHERE @de_v_819 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.02, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.81, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.77, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.71, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.60, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.56, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.53, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.51, @de_v_822 WHERE @de_v_822 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.17, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.90, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.84, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.76, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.63, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.58, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.55, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.53, @de_v_823 WHERE @de_v_823 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.90, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.70, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.65, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.59, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.49, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.45, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.43, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.41, @de_v_816 WHERE @de_v_816 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.05, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.78, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.71, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.63, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.52, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.47, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.45, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.42, @de_v_817 WHERE @de_v_817 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.95, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.75, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.71, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.64, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.54, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.50, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.48, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.45, @de_v_820 WHERE @de_v_820 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.11, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.84, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.77, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.69, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.57, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.53, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.50, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.47, @de_v_821 WHERE @de_v_821 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.52, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.27, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.80, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.65, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.62, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.53, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.46, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.45, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.41, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.40, @de_v_671 WHERE @de_v_671 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.55, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.30, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.85, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.71, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.68, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.59, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.52, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.49, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.45, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.43, @de_v_674 WHERE @de_v_674 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.60, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.36, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.96, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.81, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.78, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.69, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.61, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.55, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.53, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, 24999, 0.51, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 25000, NULL, 0.49, @de_v_677 WHERE @de_v_677 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.76, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.51, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.23, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 1.12, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 1.11, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 1.06, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.94, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.88, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.86, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.83, @de_v_680 WHERE @de_v_680 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.52, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.27, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.82, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.68, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.65, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.55, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.49, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.47, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.43, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.42, @de_v_787 WHERE @de_v_787 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.55, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.30, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.88, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.76, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.73, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.61, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.54, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.51, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.47, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.46, @de_v_792 WHERE @de_v_792 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.60, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.36, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 0.98, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 0.83, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 0.81, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 0.72, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.63, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.57, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.55, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, 24999, 0.53, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 25000, NULL, 0.51, @de_v_793 WHERE @de_v_793 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 10, 49, 5.76, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 50, 99, 1.51, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 100, 199, 1.23, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 200, 299, 1.12, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 300, 499, 1.11, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 500, 999, 1.06, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 1000, 1999, 0.94, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 2000, 2999, 0.88, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 3000, 4999, 0.86, @de_v_794 WHERE @de_v_794 IS NOT NULL;
INSERT INTO prices (min_quantity, max_quantity, price, variation_id)
SELECT 5000, NULL, 0.83, @de_v_794 WHERE @de_v_794 IS NOT NULL;

COMMIT;

-- Resultado de la importacion: CREATED, ALREADY_EXISTS o NOT_CREATED.
SELECT
    CASE WHEN @de_product_id IS NOT NULL THEN 'CREATED'
         WHEN @de_existing_id IS NOT NULL THEN 'ALREADY_EXISTS'
         ELSE 'NOT_CREATED: check source product, supplier, Double-Ended group and variation types'
    END AS import_result,
    COALESCE(@de_product_id, @de_existing_id) AS product_id,
    @de_sku AS SKU;

-- Comprobacion: se esperan 68 variaciones, 68 items, 146 precios y 0 imagenes.
SELECT
    p.product_id, p.SKU, p.name,
    (SELECT COUNT(*) FROM variations v WHERE v.product_id = p.product_id) AS variations_count,
    (SELECT COUNT(*) FROM items i JOIN variations v ON v.variation_id = i.variation_id WHERE v.product_id = p.product_id) AS items_count,
    (SELECT COUNT(*) FROM prices pr JOIN variations v ON v.variation_id = pr.variation_id WHERE v.product_id = p.product_id) AS prices_count,
    (SELECT COUNT(*) FROM images im JOIN variations v ON v.variation_id = im.variation_id WHERE v.product_id = p.product_id) AS gallery_images_count,
    (SELECT COUNT(*) FROM variations v WHERE v.product_id = p.product_id AND COALESCE(v.image, '') <> '') AS variation_images_count
FROM products p WHERE p.SKU = @de_sku;
