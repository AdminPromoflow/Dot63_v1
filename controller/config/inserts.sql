/* =========================================================
   FULL SQL SCRIPT
   - Inserts categories (including Unassigned Category)
   - Creates "Unassigned Group" for EVERY category
   - Inserts all product groups by category name
   - approved = 1
   ========================================================= */


/* =========================
   1) CATEGORIES
   ========================= */

/* CATEGORY: Unassigned Category */
INSERT INTO `categories` (`name`, `approved`) VALUES
('Unassigned Category', 1);

/* Main categories */
INSERT INTO `categories`(`name`, `approved`) VALUES
('Bags', 1),
('Packaging & Presentation', 1),
('Tech & USBs', 1),
('Badges & Accessories', 1),
('Lanyards & ID', 1),
('Clothing & Wearables', 1),
('Office & Stationery', 1),
('Gift & Seasonal', 1),
('Custom / Bespoke Projects', 1);


/* =========================
   2) DEFAULT GROUP for EACH category
   (Safe insert: avoids duplicates)
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT 'Unassigned Group', 1, c.category_id
FROM `categories` c
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = 'Unassigned Group'
WHERE g.group_id IS NULL;


/* =========================================================
   3) GROUPS (product groups) by Category name
   - Uses existing categories
   - approved = 1
   - Safe inserts (avoid duplicates)
   ========================================================= */


/* =========================
   3.1) Bags
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Classic Rope Handle Paper Bags' AS name
  UNION ALL SELECT 'Luxury Rope Handle Paper Bags'
  UNION ALL SELECT 'Twist Handle Paper Bags'
  UNION ALL SELECT 'Flat Handle Paper Bags'
  UNION ALL SELECT 'Gloss Laminated Paper Bags'
  UNION ALL SELECT 'Matte Laminated Paper Bags'
  UNION ALL SELECT 'Kraft Paper Bags'
  UNION ALL SELECT 'Recycled Paper Bags'
  UNION ALL SELECT 'Euro Tote Paper Bags'
  UNION ALL SELECT 'Bottle Bags (Paper)'
  UNION ALL SELECT 'Takeaway / Food Paper Bags'
  UNION ALL SELECT 'SOS Paper Bags (Block Bottom)'
  UNION ALL SELECT 'Die-Cut Handle Paper Bags'
  UNION ALL SELECT 'Gift Paper Bags'
  UNION ALL SELECT 'Cotton Tote Bags'
  UNION ALL SELECT 'Canvas Tote Bags'
  UNION ALL SELECT 'Non-Woven Tote Bags'
  UNION ALL SELECT 'RPET Tote Bags'
  UNION ALL SELECT 'Jute / Hessian Bags'
  UNION ALL SELECT 'Drawstring Bags'
  UNION ALL SELECT 'Backpacks & Gymsacks'
  UNION ALL SELECT 'Cooler Bags'
  UNION ALL SELECT 'Garment Bags'
  UNION ALL SELECT 'Messenger / Conference Bags'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Bags' AND g.group_id IS NULL;


/* =========================
   3.2) Packaging & Presentation
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Satin Ribbon' AS name
  UNION ALL SELECT 'Grosgrain Ribbon'
  UNION ALL SELECT 'Cotton Ribbon'
  UNION ALL SELECT 'Printed Ribbon'
  UNION ALL SELECT 'Gift Wrap Paper'
  UNION ALL SELECT 'Tissue Paper'
  UNION ALL SELECT 'Gift Boxes'
  UNION ALL SELECT 'Rigid Gift Boxes'
  UNION ALL SELECT 'Folding Cartons'
  UNION ALL SELECT 'Mailer Boxes'
  UNION ALL SELECT 'Postal / Mailing Bags'
  UNION ALL SELECT 'Paper Carrier Trays'
  UNION ALL SELECT 'Stickers & Labels'
  UNION ALL SELECT 'Branded Seals / Thank You Stickers'
  UNION ALL SELECT 'Swing Tags'
  UNION ALL SELECT 'Product Inserts / Thank You Cards'
  UNION ALL SELECT 'Wrapping Sleeves / Belly Bands'
  UNION ALL SELECT 'Bubble Wrap / Protective Packaging'
  UNION ALL SELECT 'Packing Tape (Printed)'
  UNION ALL SELECT 'Kraft Paper Roll / Void Fill'
  UNION ALL SELECT 'Shopping Bag Accessories (Handles / Tags)'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Packaging & Presentation' AND g.group_id IS NULL;


/* =========================
   3.3) Tech & USBs
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'USB Sticks (Standard)' AS name
  UNION ALL SELECT 'USB Sticks (Eco / Recycled)'
  UNION ALL SELECT 'USB Sticks (Wood)'
  UNION ALL SELECT 'USB Sticks (Metal)'
  UNION ALL SELECT 'USB Sticks (Card Style)'
  UNION ALL SELECT 'USB Sticks (Key Style)'
  UNION ALL SELECT 'Power Banks'
  UNION ALL SELECT 'Wireless Chargers'
  UNION ALL SELECT 'Charging Cables (Multi)'
  UNION ALL SELECT 'Wall Chargers / Plugs'
  UNION ALL SELECT 'Car Chargers'
  UNION ALL SELECT 'Earbuds / Headphones'
  UNION ALL SELECT 'Bluetooth Speakers'
  UNION ALL SELECT 'Smart Trackers (Key finders)'
  UNION ALL SELECT 'Webcam Covers'
  UNION ALL SELECT 'Laptop / Phone Stands'
  UNION ALL SELECT 'Mouse Mats (Tech)'
  UNION ALL SELECT 'Screen Cleaners'
  UNION ALL SELECT 'Phone Holders / Grips'
  UNION ALL SELECT 'Tech Pouches / Cable Organisers'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Tech & USBs' AND g.group_id IS NULL;


/* =========================
   3.4) Badges & Accessories
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Button Badges' AS name
  UNION ALL SELECT 'Metal Pin Badges'
  UNION ALL SELECT 'Enamel Pin Badges'
  UNION ALL SELECT 'Name Badges (Plastic)'
  UNION ALL SELECT 'Name Badges (Metal)'
  UNION ALL SELECT 'Magnetic Name Badges'
  UNION ALL SELECT 'Clip Name Badges'
  UNION ALL SELECT 'Badge Reels (Yo-yo)'
  UNION ALL SELECT 'Badge Holders (Rigid)'
  UNION ALL SELECT 'Badge Holders (Soft PVC)'
  UNION ALL SELECT 'Event Pass Holders'
  UNION ALL SELECT 'Badge Lanyard Clips'
  UNION ALL SELECT 'ID Card Clips'
  UNION ALL SELECT 'Wristbands (Tyvek)'
  UNION ALL SELECT 'Wristbands (Fabric)'
  UNION ALL SELECT 'Wristbands (Silicone)'
  UNION ALL SELECT 'Event Tickets / Vouchers'
  UNION ALL SELECT 'Keyrings (Standard)'
  UNION ALL SELECT 'Keyrings (Metal)'
  UNION ALL SELECT 'Keyrings (Leather)'
  UNION ALL SELECT 'Keyrings (Eco)'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Badges & Accessories' AND g.group_id IS NULL;


/* =========================
   3.5) Lanyards & ID
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Eco RPET Lanyards' AS name
  UNION ALL SELECT 'Polyester Lanyards'
  UNION ALL SELECT 'Ribbed Polyester Lanyards'
  UNION ALL SELECT 'Nylon Lanyards'
  UNION ALL SELECT 'Cotton Lanyards'
  UNION ALL SELECT 'Bamboo Lanyards'
  UNION ALL SELECT 'Full Colour Printed Lanyards'
  UNION ALL SELECT 'Woven Lanyards'
  UNION ALL SELECT 'Tube Lanyards'
  UNION ALL SELECT 'Breakaway Safety Lanyards'
  UNION ALL SELECT 'Detachable Buckle Lanyards'
  UNION ALL SELECT 'Reflective Lanyards'
  UNION ALL SELECT 'Wrist Lanyards'
  UNION ALL SELECT 'Phone Lanyards'
  UNION ALL SELECT 'Lanyard Card Holders'
  UNION ALL SELECT 'ID Card Holders (Landscape)'
  UNION ALL SELECT 'ID Card Holders (Portrait)'
  UNION ALL SELECT 'Waterproof ID Holders'
  UNION ALL SELECT 'Retractable Badge Reels'
  UNION ALL SELECT 'Lanyard Attachments (Hooks / Clips / Buckles)'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Lanyards & ID' AND g.group_id IS NULL;


/* =========================
   3.6) Clothing & Wearables
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Shoe Laces' AS name
  UNION ALL SELECT 'Caps & Hats'
  UNION ALL SELECT 'T-Shirts'
  UNION ALL SELECT 'Polo Shirts'
  UNION ALL SELECT 'Hoodies & Sweatshirts'
  UNION ALL SELECT 'Jackets & Gilets'
  UNION ALL SELECT 'Hi-Vis / Safety Wear'
  UNION ALL SELECT 'Aprons'
  UNION ALL SELECT 'Workwear (General)'
  UNION ALL SELECT 'Socks'
  UNION ALL SELECT 'Scarves / Beanies / Gloves'
  UNION ALL SELECT 'Umbrellas'
  UNION ALL SELECT 'Tote Aprons / Hospitality Wear'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Clothing & Wearables' AND g.group_id IS NULL;


/* =========================
   3.7) Office & Stationery
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Notebooks' AS name
  UNION ALL SELECT 'Journals'
  UNION ALL SELECT 'Sticky Notes'
  UNION ALL SELECT 'Notepads'
  UNION ALL SELECT 'Pens (Plastic)'
  UNION ALL SELECT 'Pens (Metal)'
  UNION ALL SELECT 'Eco Pens'
  UNION ALL SELECT 'Highlighters'
  UNION ALL SELECT 'Pencil Sets'
  UNION ALL SELECT 'Desk Calendars'
  UNION ALL SELECT 'Wall Calendars'
  UNION ALL SELECT 'Planners / Diaries'
  UNION ALL SELECT 'Folders / Document Wallets'
  UNION ALL SELECT 'Presentation Folders'
  UNION ALL SELECT 'Business Cards'
  UNION ALL SELECT 'Desk Organisers'
  UNION ALL SELECT 'Mouse Mats (Office)'
  UNION ALL SELECT 'Coasters (Office)'
  UNION ALL SELECT 'Desk Name Plates'
  UNION ALL SELECT 'Magnets'
  UNION ALL SELECT 'Clipboards'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Office & Stationery' AND g.group_id IS NULL;


/* =========================
   3.8) Gift & Seasonal
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Chocolate Advent Calendars' AS name
  UNION ALL SELECT 'Seasonal Gift Sets'
  UNION ALL SELECT 'Christmas Hampers'
  UNION ALL SELECT 'Branded Chocolates / Sweets'
  UNION ALL SELECT 'Mugs & Drinkware'
  UNION ALL SELECT 'Water Bottles'
  UNION ALL SELECT 'Tumblers / Travel Cups'
  UNION ALL SELECT 'Thermos / Flasks'
  UNION ALL SELECT 'Key Gift Sets'
  UNION ALL SELECT 'Eco Gift Sets'
  UNION ALL SELECT 'Summer Gifts (Outdoor)'
  UNION ALL SELECT 'Winter Gifts (Warm items)'
  UNION ALL SELECT 'New Joiner / Onboarding Packs'
  UNION ALL SELECT 'Employee Appreciation Gifts'
  UNION ALL SELECT 'Client Thank-You Gifts'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Gift & Seasonal' AND g.group_id IS NULL;


/* =========================
   3.9) Custom / Bespoke Projects
   ========================= */
INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.name, 1, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Samples Picking' AS name
  UNION ALL SELECT 'Kan Samples'
  UNION ALL SELECT 'Bespoke Orders'
  UNION ALL SELECT 'Custom Packaging Projects'
  UNION ALL SELECT 'Custom Event Packs'
  UNION ALL SELECT 'Custom Welcome Packs'
  UNION ALL SELECT 'White Label Projects'
  UNION ALL SELECT 'Offline Only Projects'
  UNION ALL SELECT 'Works Hamble – Bespoke'
  UNION ALL SELECT 'Large Volume / Tender Orders'
  UNION ALL SELECT 'Design Service Requests'
  UNION ALL SELECT 'Prototypes & Mockups'
) x
LEFT JOIN `groups` g
  ON g.category_id = c.category_id AND g.name = x.name
WHERE c.name = 'Custom / Bespoke Projects' AND g.group_id IS NULL;













/* =========================================================
   4) TYPE VARIATIONS by Category name
   - Uses existing categories (already inserted)
   - Safe inserts (avoid duplicates)
   ========================================================= */

/* =========================
   4.1) Bags
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Size (W×H×Gusset)' AS type_name
  UNION ALL SELECT 'Material / Paper type'
  UNION ALL SELECT 'Paper weight (gsm)'
  UNION ALL SELECT 'Handle type'
  UNION ALL SELECT 'Finish (Gloss/Matte/Uncoated/Soft-touch)'
  UNION ALL SELECT 'Bag colour'
  UNION ALL SELECT 'Print method (Digital/Offset/Screen/Foil)'
  UNION ALL SELECT 'Print sides / coverage (1-side/2-side/Full-bleed)'
  UNION ALL SELECT 'Gusset / base reinforcement option'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Bags' AND tv.type_id IS NULL;


/* =========================
   4.2) Packaging & Presentation
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Dimensions / capacity' AS type_name
  UNION ALL SELECT 'Material (Card/Paper/Plastic/Fabric)'
  UNION ALL SELECT 'Finish (Matt/Gloss/Soft-touch/Foil)'
  UNION ALL SELECT 'Closure type (Lid/Magnetic/Ribbon/etc.)'
  UNION ALL SELECT 'Insert / inlay option (Foam/Card/None)'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Print method'
  UNION ALL SELECT 'Window option (Yes/No)'
  UNION ALL SELECT 'Assembly (Flat-packed/Assembled)'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Packaging & Presentation' AND tv.type_id IS NULL;


/* =========================
   4.3) Tech & USBs
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Product type / model' AS type_name
  UNION ALL SELECT 'Memory / capacity (GB) (if applicable)'
  UNION ALL SELECT 'Interface (USB-A/USB-C/etc.)'
  UNION ALL SELECT 'Material (Metal/Plastic/Wood/etc.)'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Branding method (Laser/Print/Engrave)'
  UNION ALL SELECT 'Packaging option'
  UNION ALL SELECT 'Accessory add-ons (Keyring/Lanyard/etc.)'
  UNION ALL SELECT 'Data services (Preload/Encryption) (if applicable)'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Tech & USBs' AND tv.type_id IS NULL;


/* =========================
   4.4) Badges & Accessories
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Product type' AS type_name
  UNION ALL SELECT 'Size / dimensions'
  UNION ALL SELECT 'Shape'
  UNION ALL SELECT 'Material (Metal/Plastic/etc.)'
  UNION ALL SELECT 'Fixing type (Pin/Magnet/Clip)'
  UNION ALL SELECT 'Finish (Gloss/Matte)'
  UNION ALL SELECT 'Colour / print (Full-colour/Spot)'
  UNION ALL SELECT 'Backing card / packaging option'
  UNION ALL SELECT 'Personalisation (Name/Number) (if applicable)'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Badges & Accessories' AND tv.type_id IS NULL;


/* =========================
   4.5) Lanyards & ID
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Width (mm)' AS type_name
  UNION ALL SELECT 'Material (Polyester/RPET/Nylon/etc.)'
  UNION ALL SELECT 'Print method (Dye-sub/Screen/Woven)'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Length / style (Single/Double-ended)'
  UNION ALL SELECT 'Attachment type (Hook/Clip/etc.)'
  UNION ALL SELECT 'Safety breakaway (Yes/No)'
  UNION ALL SELECT 'Accessory add-ons (Buckle/Phone loop/etc.)'
  UNION ALL SELECT 'ID holder type (if applicable)'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Lanyards & ID' AND tv.type_id IS NULL;


/* =========================
   4.6) Clothing & Wearables
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Garment type' AS type_name
  UNION ALL SELECT 'Size (S–XXL, etc.)'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Fit (Unisex/Men/Women)'
  UNION ALL SELECT 'Material / fabric'
  UNION ALL SELECT 'Branding method (Embroidery/Screen/DTG)'
  UNION ALL SELECT 'Print position (Front/Back/Sleeve)'
  UNION ALL SELECT 'Label / tag option (if applicable)'
  UNION ALL SELECT 'Packaging (Individual bagging) (if applicable)'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Clothing & Wearables' AND tv.type_id IS NULL;


/* =========================
   4.7) Office & Stationery
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Product type' AS type_name
  UNION ALL SELECT 'Size / format (A5/A4/etc.)'
  UNION ALL SELECT 'Paper stock (gsm) / material'
  UNION ALL SELECT 'Page count / capacity'
  UNION ALL SELECT 'Binding type (Spiral/Perfect/etc.)'
  UNION ALL SELECT 'Cover type / finish (Soft/Hard, Matt/Gloss)'
  UNION ALL SELECT 'Ruling (Lined/Blank/Dotted) (if applicable)'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Branding method / print spec'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Office & Stationery' AND tv.type_id IS NULL;


/* =========================
   4.8) Gift & Seasonal
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Occasion / theme' AS type_name
  UNION ALL SELECT 'Set contents (if applicable)'
  UNION ALL SELECT 'Size / dimensions'
  UNION ALL SELECT 'Material'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Packaging option'
  UNION ALL SELECT 'Personalisation method'
  UNION ALL SELECT 'Message card option (if applicable)'
  UNION ALL SELECT 'Seasonal lead time / deadline'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Gift & Seasonal' AND tv.type_id IS NULL;


/* =========================
   4.9) Custom / Bespoke Projects
   ========================= */
INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.type_name, NULL, c.category_id
FROM `categories` c
JOIN (
  SELECT 'Project spec / requirements' AS type_name
  UNION ALL SELECT 'Dimensions'
  UNION ALL SELECT 'Material'
  UNION ALL SELECT 'Colour'
  UNION ALL SELECT 'Branding method'
  UNION ALL SELECT 'Packaging option'
  UNION ALL SELECT 'Lead time'
  UNION ALL SELECT 'MOQ tier / quantity break'
  UNION ALL SELECT 'Compliance / certification needs (if applicable)'
) x
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id AND tv.type_name = x.type_name
WHERE c.name = 'Custom / Bespoke Projects' AND tv.type_id IS NULL;
