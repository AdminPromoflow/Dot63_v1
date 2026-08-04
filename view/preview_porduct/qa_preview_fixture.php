<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Supplier preview QA</title>
  <style>html, body { margin: 0; }</style>
</head>
<body>
<script>
  const qaImage = (colour, label) => `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <rect width="900" height="900" fill="#f1f3f5"/>
      <rect x="170" y="120" width="560" height="660" rx="72" fill="${colour}"/>
      <rect x="250" y="205" width="400" height="300" rx="34" fill="#ffffff" opacity=".94"/>
      <text x="450" y="370" text-anchor="middle" font-family="Arial" font-weight="700" font-size="48" fill="#18212f">PROMOFLOW</text>
      <text x="450" y="590" text-anchor="middle" font-family="Arial" font-size="36" fill="#ffffff">${label}</text>
    </svg>
  `)}`;

  const row = (id, name, typeId, typeName, colour, priceMode = "variation") => ({
    variation: {
      variation_id: id,
      SKU: `QA-${id}`,
      name,
      type_id: typeId,
      type_name: typeName,
      image: qaImage(colour, name),
      price_display_mode: priceMode
    },
    images: [{ image_id: id, link: qaImage(colour, name) }],
    items: [],
    prices: [],
    artwork: null
  });

  const root = {
    variation: { variation_id: 1, SKU: "QA-ROOT", name: "Default", price_display_mode: "prices" },
    images: [
      { image_id: 1, link: qaImage("#df6b3b", "Hero view") },
      { image_id: 2, link: qaImage("#1f3150", "Detail view") }
    ],
    items: [
      { item_id: 1, name: "Material", description: "Recycled aluminium with a soft-touch finish." },
      { item_id: 2, name: "Lead time", description: "Standard production in 8–10 working days." }
    ],
    prices: [
      { price_id: 1, min_quantity: 50, max_quantity: 99, price: 4.85 },
      { price_id: 2, min_quantity: 100, max_quantity: 249, price: 4.15 },
      { price_id: 3, min_quantity: 250, max_quantity: 999, price: 3.72 }
    ],
    artwork: { name_pdf_artwork: "Print area guide", pdf_artwork: "" }
  };

  const red = row(10, "Terracotta", 2, "Colour", "#c65337");
  const navy = row(11, "Midnight", 2, "Colour", "#243653");
  const small = row(20, "500 ml", 3, "Capacity", "#c65337");
  const large = row(21, "750 ml", 3, "Capacity", "#c65337");

  window.fetch = async (_url, request = {}) => {
    const payload = JSON.parse(request.body || "{}");
    let data;

    if (payload.action === "get_supplier_preview") {
      data = {
        success: true,
        product: {
          id: 42,
          sku: "PF-BOTTLE-01",
          name: "Recycled aluminium bottle",
          description: "A lightweight reusable bottle designed for everyday campaigns. Its generous print area keeps branding visible while the screw-top lid makes it easy to carry.",
          tagline: "A refined reusable bottle with flexible branding options.",
          status: "1",
          is_approved: false,
          supplier_name: "Northstar Merchandise",
          category: { id: 1, name: "Drinkware" },
          group: { id: 2, name: "Reusable bottles" }
        },
        root_variation_id: 1,
        readiness: {
          complete: true,
          issues: [],
          checks: [
            { label: "Product details", complete: true },
            { label: "Category and group", complete: true },
            { label: "Product variations", complete: true },
            { label: "Product imagery", complete: true },
            { label: "Pricing", complete: true }
          ]
        },
        permissions: { can_edit: true, can_submit: true }
      };
    } else if (payload.action === "get_supplier_variation_children") {
      const id = Number(payload.variation_id);
      if (id === 1) data = { success: true, current: root, children: [red, navy], types: [{ type_id: 2, type_name: "Colour" }] };
      else if (id === 10 || id === 11) data = { success: true, current: id === 10 ? red : navy, children: [small, large], types: [{ type_id: 3, type_name: "Capacity" }] };
      else data = { success: true, current: id === 20 ? small : large, children: [], types: [] };
    } else if (payload.action === "get_supplier_variation_prices") {
      data = {
        success: true,
        prices: (payload.ids || []).map((id) => ({ variation_id: id, price: Number(id) === 21 ? 0.65 : 0.35 }))
      };
    } else {
      data = { success: true, message: "Product submitted for approval." };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };
</script>
<?php include __DIR__ . '/preview_porduct/preview.php'; ?>
</body>
</html>
