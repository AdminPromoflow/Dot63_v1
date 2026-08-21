<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Super Lanyard catalogue visual fixture</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../view/product_list/style.css">
</head>
<body class="body_product_list">
  <script>
    (() => {
      const themes = ['Flat', 'Tubular'];
      const materials = ['Polyester', 'RPET Polyester'];
      const widths = ['15mm', '20mm'];
      const techniques = ['Screen Print', 'Dye Sublimation'];
      const sides = ['One Side', 'Two Sides'];
      const colours = ['One Colour', 'Full Colour'];
      const values = [themes, materials, widths, techniques, sides, colours];
      const keys = ['theme', 'material', 'width', 'print_technique', 'printed_sides', 'colour'];
      const products = Array.from({length: 18}, (_, index) => {
        const configuration = Object.fromEntries(keys.map((key, axis) => [key, values[axis][Math.floor(index / (2 ** axis)) % 2]]));
        return {
          id: index + 1,
          product_sku: 'SOURCE-SL',
          sku: `SLY-FIXTURE-${String(index + 1).padStart(3, '0')}`,
          title: `Super Lanyard — ${keys.map((key) => configuration[key]).join(' — ')}`,
          image: '',
          starting_price: index % 3 === 0 ? null : .35 + (index * .025),
          configuration,
        };
      });
      const filterLabels = {
        theme: 'Theme', material: 'Material', width: 'Width',
        print_technique: 'Print Technique', printed_sides: 'Printed Sides', colour: 'Colour'
      };
      const filterOptions = Object.fromEntries(keys.map((key, axis) => [key, values[axis]]));

      window.fetch = async (url, options = {}) => {
        const action = JSON.parse(options.body || '{}').action;
        if (action === 'verify_login_supplier') {
          return {ok: true, json: async () => ({response: true})};
        }

        return {
          ok: true,
          json: async () => ({
            success: true,
            catalog_type: 'super_lanyard',
            result: [],
            catalog: {
              title: 'Super Lanyard',
              subtitle: 'Explore every available configuration.',
              current_sku: 'SOURCE-SL',
              filter_labels: filterLabels,
              filter_options: filterOptions,
              products,
            },
          }),
        };
      };
    })();
  </script>
  <?php include __DIR__ . '/../view/global/menu_supplier/menu_general.php'; ?>
  <?php
  $visualFixtureDirectory = getcwd();
  chdir(__DIR__ . '/../view/product_list');
  include __DIR__ . '/../view/product_list/product_list/product_list.php';
  chdir($visualFixtureDirectory);
  ?>
</body>
</html>
