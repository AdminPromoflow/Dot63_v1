/*
 * ITEMS PARA LAS VARIACIONES SIN ITEM DEL DUMP
 * Fuente: dump generado el 22-08-2026 a las 13:33
 *
 * Listo para copiar y pegar en phpMyAdmin (MariaDB/MySQL).
 * Cada registro tiene un nombre y una descripcion relacionados con
 * el producto, material, color, ancho o tecnica de su variacion.
 *
 * El NOT EXISTS permite volver a ejecutar el archivo sin duplicar
 * items en variaciones que ya tengan uno.
 */

START TRANSACTION;

INSERT INTO `items` (`name`, `description`, `variation_id`)
SELECT
    source.`name`,
    source.`description`,
    source.`variation_id`
FROM (
    SELECT 'RPET Lanyard Base' AS `name`, 'Eco-friendly base for a custom lanyard.' AS `description`, 119 AS `variation_id`
    UNION ALL SELECT 'RPET Polyester', 'Recycled polyester with a smooth, durable feel.', 120
    UNION ALL SELECT 'No Accessory', 'Streamlined setup with no added accessory.', 137
    UNION ALL SELECT 'No Attachment', 'Simple finish with no extra attachment.', 141
    UNION ALL SELECT 'Eco RPET Lanyard Base', 'Eco-conscious base ready for custom branding.', 200
    UNION ALL SELECT 'Tubular Lanyard Base', 'Soft tubular construction for everyday comfort.', 274
    UNION ALL SELECT 'Tubular Polyester', 'Rounded polyester weave with a soft touch.', 275
    UNION ALL SELECT 'No Attachment', 'Clean setup without an added attachment.', 318
    UNION ALL SELECT 'Soft Grey', 'Balanced grey tone for a polished finish.', 325
    UNION ALL SELECT 'No Bluetooth', 'Classic lanyard design with no Bluetooth.', 326
    UNION ALL SELECT 'Deep Burgundy', 'Rich burgundy for a refined brand look.', 329
    UNION ALL SELECT 'Classic Black', 'Timeless black for bold, versatile branding.', 335
    UNION ALL SELECT 'Royal Blue', 'Vivid royal blue with a confident finish.', 336
    UNION ALL SELECT 'Navy Blue', 'Deep navy blue for a professional look.', 337
    UNION ALL SELECT 'Bright Red', 'Bright red made to stand out instantly.', 338
    UNION ALL SELECT 'Pure White', 'Clean white for crisp, modern branding.', 339
    UNION ALL SELECT 'Sunny Yellow', 'Vibrant yellow for high-impact visibility.', 340
    UNION ALL SELECT 'Dye-Sub Lanyard Base', 'Polyester base for vivid custom artwork.', 355
    UNION ALL SELECT 'Smooth Polyester', 'Durable polyester with a smooth finish.', 356
    UNION ALL SELECT 'No Accessory', 'Streamlined lanyard with no added accessory.', 373
    UNION ALL SELECT 'No Attachment', 'Simple lanyard with no extra attachment.', 378
    UNION ALL SELECT 'Standard Lanyard Setup', 'A clean starting point for custom lanyards.', 407
    UNION ALL SELECT 'No Bluetooth', 'Classic lanyard design with no Bluetooth.', 413
    UNION ALL SELECT 'Polyester Lanyard Base', 'Reliable base for an everyday polyester lanyard.', 414
    UNION ALL SELECT 'Durable Polyester', 'Strong, comfortable polyester for daily wear.', 415
    UNION ALL SELECT 'No Attachment', 'Simple finish with no extra attachment.', 484
    UNION ALL SELECT 'Soft Grey', 'Balanced grey tone for a polished finish.', 491
    UNION ALL SELECT 'No Bluetooth', 'Classic lanyard design with no Bluetooth.', 492
    UNION ALL SELECT 'Deep Burgundy', 'Rich burgundy for a refined brand look.', 495
    UNION ALL SELECT 'Classic Black', 'Timeless black for bold, versatile branding.', 501
    UNION ALL SELECT 'Royal Blue', 'Vivid royal blue with a confident finish.', 502
    UNION ALL SELECT 'Navy Blue', 'Deep navy blue for a professional look.', 503
    UNION ALL SELECT 'Standard Polyester Setup', 'Clean foundation for a custom polyester lanyard.', 504
    UNION ALL SELECT 'Bright Red', 'Bright red made to stand out instantly.', 505
    UNION ALL SELECT 'Pure White', 'Clean white for crisp, modern branding.', 506
    UNION ALL SELECT 'Sunny Yellow', 'Vibrant yellow for high-impact visibility.', 507
    UNION ALL SELECT 'No Accessory', 'Streamlined setup with no added accessory.', 508
    UNION ALL SELECT 'Addie RPET Lanyard Base', 'Recycled PET base with a safety breakaway.', 509
    UNION ALL SELECT 'White on White', 'Crisp white tape paired with white details.', 540
    UNION ALL SELECT 'Addie Satin Lanyard Base', 'Smooth satin base for vibrant sublimation.', 568
    UNION ALL SELECT 'Premium Everyday Base', 'Comfortable, polished and ready for daily use.', 623
    UNION ALL SELECT 'Custom Colour', 'A flexible colour option for bespoke branding.', 625
    UNION ALL SELECT 'Versatile Lanyard Base', 'A flexible starting point for custom branding.', 627
    UNION ALL SELECT 'Standard Lanyard Setup', 'Clean, practical foundation for your design.', 628
    UNION ALL SELECT 'Super Lanyard Base', 'Build a standout lanyard from this base.', 629
    UNION ALL SELECT 'Flat Lanyard Style', 'Smooth flat tape with a clean modern profile.', 634
    UNION ALL SELECT 'Polyester', 'Durable polyester for reliable everyday wear.', 635
    UNION ALL SELECT 'RPET Polyester', 'Recycled polyester with a lower-impact finish.', 637
    UNION ALL SELECT '15mm Width', 'Balanced 15mm tape for everyday versatility.', 639
    UNION ALL SELECT '20mm Width', 'Roomy 20mm tape for clear, visible branding.', 640
    UNION ALL SELECT '25mm Width', 'Bold 25mm tape for greater design impact.', 641
    UNION ALL SELECT '30mm Width', 'Extra-wide 30mm tape for maximum visibility.', 642
    UNION ALL SELECT '15mm RPET Width', 'Slim recycled tape with everyday versatility.', 647
    UNION ALL SELECT '20mm RPET Width', 'Wide recycled tape for clear brand visibility.', 648
    UNION ALL SELECT '25mm RPET Width', 'Bold recycled tape with extra design space.', 649
    UNION ALL SELECT '30mm RPET Width', 'Extra-wide recycled tape for maximum impact.', 650
    UNION ALL SELECT '15mm Dye Sublimation', 'Vibrant full-colour print on 15mm polyester.', 655
    UNION ALL SELECT '15mm Screen Print', 'Crisp screen-printed detail on 15mm polyester.', 662
    UNION ALL SELECT 'One-Colour Screen Print', 'Clean artwork printed in one solid colour.', 663
    UNION ALL SELECT 'One-Sided One-Colour Print', 'Single-colour artwork printed on one side.', 664
    UNION ALL SELECT 'Two-Sided One-Colour Print', 'Single-colour artwork printed on both sides.', 665
    UNION ALL SELECT 'Two-Colour Screen Print', 'Two solid colours for extra visual definition.', 666
    UNION ALL SELECT 'One-Sided Two-Colour Print', 'Two-colour artwork printed on one side.', 667
    UNION ALL SELECT 'Two-Sided Two-Colour Print', 'Two-colour artwork printed on both sides.', 668
    UNION ALL SELECT 'Two-Sided Sublimation', 'Full-colour sublimation across both sides.', 670
    UNION ALL SELECT 'Full-Colour Two-Sided Print', 'Rich full-colour artwork on both lanyard sides.', 671
    UNION ALL SELECT '20mm Dye Sublimation', 'Vibrant full-colour print on 20mm polyester.', 672
    UNION ALL SELECT '20mm Two-Sided Sublimation', '20mm sublimation printed across both sides.', 673
    UNION ALL SELECT '20mm Full-Colour Print', 'Full-colour artwork on a wide 20mm lanyard.', 674
    UNION ALL SELECT '25mm Dye Sublimation', 'Vibrant full-colour print on 25mm polyester.', 675
    UNION ALL SELECT '25mm Two-Sided Sublimation', '25mm sublimation printed across both sides.', 676
    UNION ALL SELECT '25mm Full-Colour Print', 'Full-colour artwork on a bold 25mm lanyard.', 677
    UNION ALL SELECT '30mm Dye Sublimation', 'Vibrant full-colour print on 30mm polyester.', 678
    UNION ALL SELECT '30mm Two-Sided Sublimation', '30mm sublimation printed across both sides.', 679
    UNION ALL SELECT '30mm Full-Colour Print', 'Full-colour artwork on an extra-wide lanyard.', 680
    UNION ALL SELECT '15mm RPET Dye Sublimation', 'Full-colour sublimation on 15mm recycled PET.', 773
    UNION ALL SELECT '15mm RPET Screen Print', 'Crisp screen print on 15mm recycled polyester.', 774
    UNION ALL SELECT '20mm RPET Dye Sublimation', 'Full-colour sublimation on 20mm recycled PET.', 775
    UNION ALL SELECT '25mm RPET Dye Sublimation', 'Full-colour sublimation on 25mm recycled PET.', 776
    UNION ALL SELECT '30mm RPET Dye Sublimation', 'Full-colour sublimation on 30mm recycled PET.', 777
    UNION ALL SELECT '15mm RPET Two-Sided Print', '15mm recycled tape printed on both sides.', 780
    UNION ALL SELECT '15mm RPET One-Colour Print', 'One-colour screen print on 15mm recycled tape.', 781
    UNION ALL SELECT '15mm RPET Two-Colour Print', 'Two-colour screen print on 15mm recycled tape.', 782
    UNION ALL SELECT '20mm RPET Two-Sided Print', '20mm recycled tape printed on both sides.', 783
    UNION ALL SELECT '25mm RPET Two-Sided Print', '25mm recycled tape printed on both sides.', 784
    UNION ALL SELECT '30mm RPET Two-Sided Print', '30mm recycled tape printed on both sides.', 785
    UNION ALL SELECT '15mm RPET Full-Colour Print', 'Full-colour finish on 15mm recycled tape.', 787
    UNION ALL SELECT '15mm One-Colour One-Sided', 'One-colour artwork on one side of 15mm tape.', 788
    UNION ALL SELECT '15mm One-Colour Two-Sided', 'One-colour artwork on both sides of 15mm tape.', 789
    UNION ALL SELECT '15mm Two-Colour One-Sided', 'Two-colour artwork on one side of 15mm tape.', 790
    UNION ALL SELECT '15mm Two-Colour Two-Sided', 'Two-colour artwork on both sides of 15mm tape.', 791
    UNION ALL SELECT '20mm RPET Full-Colour Print', 'Full-colour finish on 20mm recycled tape.', 792
    UNION ALL SELECT '25mm RPET Full-Colour Print', 'Full-colour finish on 25mm recycled tape.', 793
    UNION ALL SELECT '30mm RPET Full-Colour Print', 'Full-colour finish on 30mm recycled tape.', 794
    UNION ALL SELECT 'Tubular Lanyard Style', 'Rounded tubular profile with a soft hand feel.', 802
    UNION ALL SELECT 'Tubular Polyester', 'Soft tubular polyester made for daily comfort.', 803
    UNION ALL SELECT '12mm Tubular Width', 'Slim tubular tape for lightweight comfort.', 804
    UNION ALL SELECT '15mm Tubular Width', 'Classic tubular tape for easy branding.', 805
    UNION ALL SELECT '12mm Tubular Screen Print', 'Crisp screen print on slim 12mm tubular tape.', 806
    UNION ALL SELECT '15mm Tubular Screen Print', 'Crisp screen print on classic 15mm tubular tape.', 807
    UNION ALL SELECT '12mm One-Sided Print', 'Focused artwork on one side of 12mm tape.', 809
    UNION ALL SELECT '15mm One-Sided Print', 'Focused artwork on one side of 15mm tape.', 810
    UNION ALL SELECT '12mm Two-Sided Print', 'Continuous artwork across both sides of 12mm tape.', 811
    UNION ALL SELECT '15mm Two-Sided Print', 'Continuous artwork across both sides of 15mm tape.', 812
    UNION ALL SELECT '12mm One-Colour One-Sided', 'One solid colour on one side of 12mm tape.', 816
    UNION ALL SELECT '12mm One-Colour Two-Sided', 'One solid colour across both sides of 12mm tape.', 817
    UNION ALL SELECT '15mm One-Colour One-Sided', 'One solid colour on one side of 15mm tape.', 818
    UNION ALL SELECT '15mm One-Colour Two-Sided', 'One solid colour across both sides of 15mm tape.', 819
    UNION ALL SELECT '12mm Two-Colour One-Sided', 'Two bold colours on one side of 12mm tape.', 820
    UNION ALL SELECT '12mm Two-Colour Two-Sided', 'Two bold colours across both sides of 12mm tape.', 821
    UNION ALL SELECT '15mm Two-Colour One-Sided', 'Two bold colours on one side of 15mm tape.', 822
    UNION ALL SELECT '15mm Two-Colour Two-Sided', 'Two bold colours across both sides of 15mm tape.', 823
) AS source
WHERE NOT EXISTS (
    SELECT 1
    FROM `items` AS existing
    WHERE existing.`variation_id` = source.`variation_id`
)
ORDER BY source.`variation_id`;

SELECT ROW_COUNT() AS `items_insertados`;

COMMIT;
