/* =========================================================
   INSERT CATEGORIES, GROUPS AND TYPE VARIATIONS
   - approved = 1
   - Safe inserts
   ========================================================= */


/* =========================
   1) CATEGORIES
   ========================= */

INSERT INTO `categories` (`name`, `approved`)
SELECT x.name, 1
FROM (
  SELECT 'Clothing' AS name
  UNION ALL SELECT 'Bags'
  UNION ALL SELECT 'Drinkware'
  UNION ALL SELECT 'Pens & Writing'
  UNION ALL SELECT 'Technology'
  UNION ALL SELECT 'Notebooks & Paper Products'
  UNION ALL SELECT 'Umbrellas'
  UNION ALL SELECT 'Home & Kitchen'
  UNION ALL SELECT 'Giveaways'
  UNION ALL SELECT 'Sports & Leisure'
  UNION ALL SELECT 'Toys & Games'
  UNION ALL SELECT 'Tools & Car Accessories'
  UNION ALL SELECT 'Health & Personal Care'
  UNION ALL SELECT 'Unassigned Category'
) x
LEFT JOIN `categories` c
  ON c.name = x.name
WHERE c.category_id IS NULL;



/* =========================
   2) GROUPS
   ========================= */

INSERT INTO `groups` (`name`, `approved`, `category_id`)
SELECT x.group_name, 1, c.category_id
FROM `categories` c
JOIN (

  SELECT 'Clothing' AS category_name, 'Tops - T-shirts' AS group_name

  UNION ALL SELECT 'Bags', 'Unassigned Group'
  UNION ALL SELECT 'Drinkware', 'Unassigned Group'
  UNION ALL SELECT 'Pens & Writing', 'Unassigned Group'
  UNION ALL SELECT 'Technology', 'Unassigned Group'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Unassigned Group'
  UNION ALL SELECT 'Umbrellas', 'Unassigned Group'
  UNION ALL SELECT 'Home & Kitchen', 'Unassigned Group'
  UNION ALL SELECT 'Giveaways', 'Unassigned Group'
  UNION ALL SELECT 'Sports & Leisure', 'Unassigned Group'
  UNION ALL SELECT 'Toys & Games', 'Unassigned Group'
  UNION ALL SELECT 'Tools & Car Accessories', 'Unassigned Group'
  UNION ALL SELECT 'Health & Personal Care', 'Unassigned Group'
  UNION ALL SELECT 'Unassigned Category', 'Unassigned Group'

  UNION ALL SELECT 'Clothing', 'Tops - Polos'
  UNION ALL SELECT 'Clothing', 'Tops - Shirts'
  UNION ALL SELECT 'Clothing', 'Sweaters & Hoodies - Sweaters'
  UNION ALL SELECT 'Clothing', 'Sweaters & Hoodies - Hoodies'
  UNION ALL SELECT 'Clothing', 'Outdoor - Jackets'
  UNION ALL SELECT 'Clothing', 'Outdoor - Bodywarmers'
  UNION ALL SELECT 'Clothing', 'Outdoor - Fleece'
  UNION ALL SELECT 'Clothing', 'Headwear - Caps & Hats'
  UNION ALL SELECT 'Clothing', 'Headwear - Beanies'
  UNION ALL SELECT 'Clothing', 'Sports - Tops'
  UNION ALL SELECT 'Clothing', 'Sports - Caps'
  UNION ALL SELECT 'Clothing', 'Sports - Activewear'
  UNION ALL SELECT 'Clothing', 'Sports - Shorts & Trousers'
  UNION ALL SELECT 'Clothing', 'Sports - Shoes'
  UNION ALL SELECT 'Clothing', 'Sports - Sets'
  UNION ALL SELECT 'Clothing', 'Workwear'

  UNION ALL SELECT 'Bags', 'Business Bags - Conference Bags'
  UNION ALL SELECT 'Bags', 'Business Bags - Messenger & Shoulder Bags'
  UNION ALL SELECT 'Bags', 'Business Bags - Laptop & Tablet Bags'
  UNION ALL SELECT 'Bags', 'Backpacks'
  UNION ALL SELECT 'Bags', 'Backpacks - Laptop Backpacks'
  UNION ALL SELECT 'Bags', 'Backpacks - Drawstring Bags'
  UNION ALL SELECT 'Bags', 'Shopping Bags - Shopping & Tote Bags'
  UNION ALL SELECT 'Bags', 'Shopping Bags - Cotton Bags'
  UNION ALL SELECT 'Bags', 'Shopping Bags - Jute Bags'
  UNION ALL SELECT 'Bags', 'Shopping Bags - Paper Bags'
  UNION ALL SELECT 'Bags', 'Shopping Bags - Foldable Bags'
  UNION ALL SELECT 'Bags', 'Sports & Leisure - Sport & Gym Bags'
  UNION ALL SELECT 'Bags', 'Sports & Leisure - Cooler Bags'
  UNION ALL SELECT 'Bags', 'Travel - Travel Bags'
  UNION ALL SELECT 'Bags', 'Travel - Trolleys & Suitcases'
  UNION ALL SELECT 'Bags', 'Travel - Sailor Bags'
  UNION ALL SELECT 'Bags', 'Travel - Toiletry Bags'
  UNION ALL SELECT 'Bags', 'Travel - Wallets & Card Wallets'
  UNION ALL SELECT 'Bags', 'Travel - Travel Accessories'

  UNION ALL SELECT 'Drinkware', 'Bottles - Sports Bottles'
  UNION ALL SELECT 'Drinkware', 'Bottles - Water Bottles'
  UNION ALL SELECT 'Drinkware', 'Bottles - Insulated Bottles'
  UNION ALL SELECT 'Drinkware', 'Bottles - Infuser Bottles'
  UNION ALL SELECT 'Drinkware', 'Mugs & Tumblers - Standard Mugs'
  UNION ALL SELECT 'Drinkware', 'Mugs & Tumblers - Travel Mugs'
  UNION ALL SELECT 'Drinkware', 'Mugs & Tumblers - Insulated Mugs'
  UNION ALL SELECT 'Drinkware', 'Mugs & Tumblers - Cups'
  UNION ALL SELECT 'Drinkware', 'Glasses & Carafes - Glasses'
  UNION ALL SELECT 'Drinkware', 'Gift Sets'

  UNION ALL SELECT 'Pens & Writing', 'Pens - Ballpoint Pens'
  UNION ALL SELECT 'Pens & Writing', 'Pens - Fountain Pens'
  UNION ALL SELECT 'Pens & Writing', 'Pens - Rollerball Pens'
  UNION ALL SELECT 'Pens & Writing', 'Pens - Stylus Pens'
  UNION ALL SELECT 'Pens & Writing', 'Gift Sets'
  UNION ALL SELECT 'Pens & Writing', 'Pencils & Writing Accessories - Pencils'
  UNION ALL SELECT 'Pens & Writing', 'Pencils & Writing Accessories - Colouring Sets'
  UNION ALL SELECT 'Pens & Writing', 'Pencils & Writing Accessories - Markers'
  UNION ALL SELECT 'Pens & Writing', 'Pencils & Writing Accessories - Other Pens & Writing Accessories'

  UNION ALL SELECT 'Technology', 'Audio - Speakers'
  UNION ALL SELECT 'Technology', 'Audio - Earbuds'
  UNION ALL SELECT 'Technology', 'Audio - Headphones'
  UNION ALL SELECT 'Technology', 'Charging - Power Banks'
  UNION ALL SELECT 'Technology', 'Charging - Chargers'
  UNION ALL SELECT 'Technology', 'Charging - Wireless Charging'
  UNION ALL SELECT 'Technology', 'USB - USB Flash Drives'
  UNION ALL SELECT 'Technology', 'USB - USB Hubs'
  UNION ALL SELECT 'Technology', 'Other Tech - Gadgets'
  UNION ALL SELECT 'Technology', 'Other Tech - Cameras'
  UNION ALL SELECT 'Technology', 'Other Tech - Smartwatches'
  UNION ALL SELECT 'Technology', 'Other Tech - Computer Accessories'
  UNION ALL SELECT 'Technology', 'Phone & Tablet - Stands & Holders'
  UNION ALL SELECT 'Technology', 'Phone & Tablet - Cables'
  UNION ALL SELECT 'Technology', 'Phone & Tablet - Telephone & Tablet Accessories'

  UNION ALL SELECT 'Notebooks & Paper Products', 'Notebooks - Hard Cover Notebooks'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Notebooks - Soft Cover Notebooks'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Notebooks - Portfolios'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Notebooks - Planners'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Notebooks - Sketchbooks'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Paper Products - Memo Blocks'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Paper Products - Sticky Notes'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Paper Products - Notepads'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Paper Products - Desk Pads'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Paper Products - Greeting Cards'

  UNION ALL SELECT 'Umbrellas', 'Umbrellas - Standard Umbrellas'
  UNION ALL SELECT 'Umbrellas', 'Umbrellas - Golf Umbrellas'
  UNION ALL SELECT 'Umbrellas', 'Umbrellas - Rain Ponchos'
  UNION ALL SELECT 'Umbrellas', 'Umbrellas - Storm Umbrellas'
  UNION ALL SELECT 'Umbrellas', 'Umbrellas - Folding Umbrellas'

  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Aprons'
  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Bottle Openers & Accessories'
  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Serving Boards & Sets'
  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Lunch Boxes'
  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Chef’s Knives'
  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Kitchenware'
  UNION ALL SELECT 'Home & Kitchen', 'Kitchen - Kitchen Linen'
  UNION ALL SELECT 'Home & Kitchen', 'Home - Home Accessories'
  UNION ALL SELECT 'Home & Kitchen', 'Home - Blankets'
  UNION ALL SELECT 'Home & Kitchen', 'Home - Glasses & Carafes'
  UNION ALL SELECT 'Home & Kitchen', 'Home - Wine Accessories'

  UNION ALL SELECT 'Giveaways', 'Giveaways - Lanyards'
  UNION ALL SELECT 'Giveaways', 'Giveaways - Wristbands'
  UNION ALL SELECT 'Giveaways', 'Giveaways - Badge Holders'
  UNION ALL SELECT 'Giveaways', 'Giveaways - Keychains & Keyrings'
  UNION ALL SELECT 'Giveaways', 'Giveaways - Stress Balls'
  UNION ALL SELECT 'Giveaways', 'Giveaways - Sweets'

  UNION ALL SELECT 'Sports & Leisure', 'Leisure - Outdoor Items'
  UNION ALL SELECT 'Sports & Leisure', 'Leisure - Picnic Accessories'
  UNION ALL SELECT 'Sports & Leisure', 'Leisure - Travel Accessories'
  UNION ALL SELECT 'Sports & Leisure', 'Leisure - BBQ Accessories'
  UNION ALL SELECT 'Sports & Leisure', 'Leisure - Cycling Accessories'
  UNION ALL SELECT 'Sports & Leisure', 'Leisure - Sunglasses'
  UNION ALL SELECT 'Sports & Leisure', 'Leisure - Beach Items'
  UNION ALL SELECT 'Sports & Leisure', 'Sport - Fitness & Sport'
  UNION ALL SELECT 'Sports & Leisure', 'Sport - Sport Shirts'
  UNION ALL SELECT 'Sports & Leisure', 'Sport - Activewear'

  UNION ALL SELECT 'Toys & Games', 'Toys - Colouring Sets For Kids'
  UNION ALL SELECT 'Toys & Games', 'Games - Indoor Games'
  UNION ALL SELECT 'Toys & Games', 'Games - Outdoor Games'

  UNION ALL SELECT 'Tools & Car Accessories', 'Tools - Lamps'
  UNION ALL SELECT 'Tools & Car Accessories', 'Tools - Measuring Tapes'
  UNION ALL SELECT 'Tools & Car Accessories', 'Tools - Multitools'
  UNION ALL SELECT 'Tools & Car Accessories', 'Tools - Pocket Knives'
  UNION ALL SELECT 'Tools & Car Accessories', 'Tools - Tool Sets'
  UNION ALL SELECT 'Tools & Car Accessories', 'Safety & Car - Reflective Items'
  UNION ALL SELECT 'Tools & Car Accessories', 'Safety & Car - Safety Vests'
  UNION ALL SELECT 'Tools & Car Accessories', 'Safety & Car - Car Accessories'

  UNION ALL SELECT 'Health & Personal Care', 'Personal Care - Towels'
  UNION ALL SELECT 'Health & Personal Care', 'Personal Care'
  UNION ALL SELECT 'Health & Personal Care', 'Personal Care - Toiletry Bags'
  UNION ALL SELECT 'Health & Personal Care', 'Personal Care - Lip Balms'
  UNION ALL SELECT 'Health & Personal Care', 'Personal Care - Wellness & Manicure Sets'
  UNION ALL SELECT 'Health & Personal Care', 'Health - First Aid Kits'
  UNION ALL SELECT 'Health & Personal Care', 'Health - Protection'

) x
  ON x.category_name = c.name
LEFT JOIN `groups` g
  ON g.category_id = c.category_id
 AND g.name = x.group_name
WHERE g.group_id IS NULL;



/* =========================================================
   3) TYPE VARIATIONS / FILTERS
   - Uses existing categories
   - Safe inserts
   ========================================================= */

INSERT INTO `type_variations` (`type_name`, `description`, `category_id`)
SELECT x.filter_name, NULL, c.category_id
FROM `categories` c
JOIN (

  SELECT 'Clothing' AS category_name, 'Price' AS filter_name
  UNION ALL SELECT 'Clothing', 'Colour'
  UNION ALL SELECT 'Clothing', 'Print technique'
  UNION ALL SELECT 'Clothing', 'Material'
  UNION ALL SELECT 'Clothing', 'Environmental certifications'
  UNION ALL SELECT 'Clothing', 'Social audit'
  UNION ALL SELECT 'Clothing', 'Impact Index'
  UNION ALL SELECT 'Clothing', 'Brand'
  UNION ALL SELECT 'Clothing', 'Theme'
  UNION ALL SELECT 'Clothing', 'Stock location'
  UNION ALL SELECT 'Clothing', 'Gender'
  UNION ALL SELECT 'Clothing', 'Clothing features'

  UNION ALL SELECT 'Bags', 'Price'
  UNION ALL SELECT 'Bags', 'Colour'
  UNION ALL SELECT 'Bags', 'Print technique'
  UNION ALL SELECT 'Bags', 'Material'
  UNION ALL SELECT 'Bags', 'Environmental certifications'
  UNION ALL SELECT 'Bags', 'Social audit'
  UNION ALL SELECT 'Bags', 'Impact Index'
  UNION ALL SELECT 'Bags', 'Brand'
  UNION ALL SELECT 'Bags', 'Theme'
  UNION ALL SELECT 'Bags', 'Stock location'
  UNION ALL SELECT 'Bags', 'Origin'

  UNION ALL SELECT 'Drinkware', 'Price'
  UNION ALL SELECT 'Drinkware', 'Colour'
  UNION ALL SELECT 'Drinkware', 'Print technique'
  UNION ALL SELECT 'Drinkware', 'Material'
  UNION ALL SELECT 'Drinkware', 'Environmental certifications'
  UNION ALL SELECT 'Drinkware', 'Social audit'
  UNION ALL SELECT 'Drinkware', 'Impact Index'
  UNION ALL SELECT 'Drinkware', 'Brand'
  UNION ALL SELECT 'Drinkware', 'Theme'
  UNION ALL SELECT 'Drinkware', 'Stock location'
  UNION ALL SELECT 'Drinkware', 'Insulation'
  UNION ALL SELECT 'Drinkware', 'Dishwasher safe'
  UNION ALL SELECT 'Drinkware', 'Microwave safe'

  UNION ALL SELECT 'Pens & Writing', 'Price'
  UNION ALL SELECT 'Pens & Writing', 'Colour'
  UNION ALL SELECT 'Pens & Writing', 'Print technique'
  UNION ALL SELECT 'Pens & Writing', 'Material'
  UNION ALL SELECT 'Pens & Writing', 'Environmental certifications'
  UNION ALL SELECT 'Pens & Writing', 'Social audit'
  UNION ALL SELECT 'Pens & Writing', 'Impact Index'
  UNION ALL SELECT 'Pens & Writing', 'Brand'
  UNION ALL SELECT 'Pens & Writing', 'Theme'
  UNION ALL SELECT 'Pens & Writing', 'Stock location'
  UNION ALL SELECT 'Pens & Writing', 'Paper type'
  UNION ALL SELECT 'Pens & Writing', 'Pen ink colour'
  UNION ALL SELECT 'Pens & Writing', 'Cover'

  UNION ALL SELECT 'Technology', 'Price'
  UNION ALL SELECT 'Technology', 'Colour'
  UNION ALL SELECT 'Technology', 'Print technique'
  UNION ALL SELECT 'Technology', 'Material'
  UNION ALL SELECT 'Technology', 'Environmental certifications'
  UNION ALL SELECT 'Technology', 'Social audit'
  UNION ALL SELECT 'Technology', 'Impact Index'
  UNION ALL SELECT 'Technology', 'Brand'
  UNION ALL SELECT 'Technology', 'Theme'
  UNION ALL SELECT 'Technology', 'Stock location'
  UNION ALL SELECT 'Technology', 'Memory size'
  UNION ALL SELECT 'Technology', 'Bluetooth'
  UNION ALL SELECT 'Technology', 'Charging time'
  UNION ALL SELECT 'Technology', 'Battery duration'

  UNION ALL SELECT 'Notebooks & Paper Products', 'Price'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Colour'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Print technique'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Material'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Environmental certifications'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Social audit'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Impact Index'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Brand'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Theme'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Stock location'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Notebook size'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Paper type'
  UNION ALL SELECT 'Notebooks & Paper Products', 'Cover'

  UNION ALL SELECT 'Umbrellas', 'Price'
  UNION ALL SELECT 'Umbrellas', 'Colour'
  UNION ALL SELECT 'Umbrellas', 'Print technique'
  UNION ALL SELECT 'Umbrellas', 'Material'
  UNION ALL SELECT 'Umbrellas', 'Social audit'
  UNION ALL SELECT 'Umbrellas', 'Impact Index'
  UNION ALL SELECT 'Umbrellas', 'Brand'
  UNION ALL SELECT 'Umbrellas', 'Theme'
  UNION ALL SELECT 'Umbrellas', 'Stock location'
  UNION ALL SELECT 'Umbrellas', 'Opening type'

  UNION ALL SELECT 'Home & Kitchen', 'Price'
  UNION ALL SELECT 'Home & Kitchen', 'Colour'
  UNION ALL SELECT 'Home & Kitchen', 'Print technique'
  UNION ALL SELECT 'Home & Kitchen', 'Material'
  UNION ALL SELECT 'Home & Kitchen', 'Environmental certifications'
  UNION ALL SELECT 'Home & Kitchen', 'Social audit'
  UNION ALL SELECT 'Home & Kitchen', 'Impact Index'
  UNION ALL SELECT 'Home & Kitchen', 'Brand'
  UNION ALL SELECT 'Home & Kitchen', 'Theme'
  UNION ALL SELECT 'Home & Kitchen', 'Stock location'
  UNION ALL SELECT 'Home & Kitchen', 'Bluetooth'
  UNION ALL SELECT 'Home & Kitchen', 'Charging time'
  UNION ALL SELECT 'Home & Kitchen', 'Dishwasher safe'
  UNION ALL SELECT 'Home & Kitchen', 'Microwave safe'

  UNION ALL SELECT 'Giveaways', 'Price'
  UNION ALL SELECT 'Giveaways', 'Colour'
  UNION ALL SELECT 'Giveaways', 'Print technique'
  UNION ALL SELECT 'Giveaways', 'Material'
  UNION ALL SELECT 'Giveaways', 'Environmental certifications'
  UNION ALL SELECT 'Giveaways', 'Social audit'
  UNION ALL SELECT 'Giveaways', 'Impact Index'
  UNION ALL SELECT 'Giveaways', 'Brand'
  UNION ALL SELECT 'Giveaways', 'Theme'
  UNION ALL SELECT 'Giveaways', 'Stock location'
  UNION ALL SELECT 'Giveaways', 'Bluetooth'
  UNION ALL SELECT 'Giveaways', 'Printed sides'
  UNION ALL SELECT 'Giveaways', 'Width'


  UNION ALL SELECT 'Sports & Leisure', 'Price'
  UNION ALL SELECT 'Sports & Leisure', 'Colour'
  UNION ALL SELECT 'Sports & Leisure', 'Print technique'
  UNION ALL SELECT 'Sports & Leisure', 'Material'
  UNION ALL SELECT 'Sports & Leisure', 'Environmental certifications'
  UNION ALL SELECT 'Sports & Leisure', 'Social audit'
  UNION ALL SELECT 'Sports & Leisure', 'Impact Index'
  UNION ALL SELECT 'Sports & Leisure', 'Brand'
  UNION ALL SELECT 'Sports & Leisure', 'Theme'
  UNION ALL SELECT 'Sports & Leisure', 'Stock location'
  UNION ALL SELECT 'Sports & Leisure', 'Gender'
  UNION ALL SELECT 'Sports & Leisure', 'Clothing features'

  UNION ALL SELECT 'Toys & Games', 'Price'
  UNION ALL SELECT 'Toys & Games', 'Colour'
  UNION ALL SELECT 'Toys & Games', 'Print technique'
  UNION ALL SELECT 'Toys & Games', 'Material'
  UNION ALL SELECT 'Toys & Games', 'Social audit'
  UNION ALL SELECT 'Toys & Games', 'Impact Index'
  UNION ALL SELECT 'Toys & Games', 'Theme'
  UNION ALL SELECT 'Toys & Games', 'Stock location'

  UNION ALL SELECT 'Tools & Car Accessories', 'Price'
  UNION ALL SELECT 'Tools & Car Accessories', 'Colour'
  UNION ALL SELECT 'Tools & Car Accessories', 'Print technique'
  UNION ALL SELECT 'Tools & Car Accessories', 'Material'
  UNION ALL SELECT 'Tools & Car Accessories', 'Environmental certifications'
  UNION ALL SELECT 'Tools & Car Accessories', 'Social audit'
  UNION ALL SELECT 'Tools & Car Accessories', 'Impact Index'
  UNION ALL SELECT 'Tools & Car Accessories', 'Brand'
  UNION ALL SELECT 'Tools & Car Accessories', 'Theme'
  UNION ALL SELECT 'Tools & Car Accessories', 'Stock location'

  UNION ALL SELECT 'Health & Personal Care', 'Price'
  UNION ALL SELECT 'Health & Personal Care', 'Colour'
  UNION ALL SELECT 'Health & Personal Care', 'Print technique'
  UNION ALL SELECT 'Health & Personal Care', 'Material'
  UNION ALL SELECT 'Health & Personal Care', 'Environmental certifications'
  UNION ALL SELECT 'Health & Personal Care', 'Social audit'
  UNION ALL SELECT 'Health & Personal Care', 'Impact Index'
  UNION ALL SELECT 'Health & Personal Care', 'Brand'
  UNION ALL SELECT 'Health & Personal Care', 'Theme'
  UNION ALL SELECT 'Health & Personal Care', 'Stock location'
  UNION ALL SELECT 'Health & Personal Care', 'Battery duration'

) x
  ON x.category_name = c.name
LEFT JOIN `type_variations` tv
  ON tv.category_id = c.category_id
 AND tv.type_name = x.filter_name
WHERE tv.type_id IS NULL;
