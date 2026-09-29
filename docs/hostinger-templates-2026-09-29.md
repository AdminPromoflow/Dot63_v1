# Verificación de templates PDF en Hostinger

Fecha: 2026-09-29 13:48:29 UTC.

Sitio: https://promoflow.net/dot63/

Inventario consultado mediante consultas SELECT en phpMyAdmin de Hostinger, base `u273173398_dot63`, tabla `variations`, campo `pdf_artwork`.

## Resultado

- 587 variaciones totales en la base de producción.
- 60 variaciones tienen un enlace de template: corresponden a 41 rutas distintas.
- Las 41 rutas respondieron HTTP 206 a una solicitud de los primeros 8 bytes, con `Content-Type: application/pdf` y firma `%PDF-`.
- 0 enlaces rotos entre las 41 rutas registradas.
- 4 variaciones tienen `name_pdf_artwork` pero no `pdf_artwork`: todas pertenecen a productos en estado `draft`, con `is_approved = 0`.
- Las otras 523 variaciones no tienen ni ruta ni nombre de template; este conteo no implica que cada opción del producto necesite un PDF propio.

Se verificó la disponibilidad de los archivos, no el contenido gráfico de cada plantilla. Los archivos subidos por clientes en `jobs.pdf_artwork_link` son distintos de estos templates de producto.

## Variaciones con nombre de template pero sin enlace

| ID de variación | Producto | Variación | Nombre del template | Estado |
| --- | --- | --- | --- | --- |
| 202 | RPET Polyester | 10mm | 10mm-Lanyard-Spot-Colour-Template.pdf | draft, sin aprobar |
| 241 | RPET Polyester | 25mm | 25mm-Lanyard-Spot-Colour-Template.pdf | draft, sin aprobar |
| 254 | RPET Polyester | 30mm | 30mm-Lanyard-Spot-Colour-Template.pdf | draft, sin aprobar |
| 416 | Polyester | 10mm | 10mm-Lanyard-Spot-Colour-Template.pdf | draft, sin aprobar |

## Archivos comprobados

Las rutas almacenadas comienzan con `views/uploads/`; se resolvieron como hace el catálogo, añadiendo `https://promoflow.net/dot63/controller/`.

| Variaciones | Producto | Archivo | HTTP | Tamaño del archivo (bytes) |
| --- | --- | --- | --- | --- |
| 121 | RPET Polyester Die Sub | [10mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260530-011924-583626-9D6044915C/VRT-20260530-131319-906576-B05340E8D0/10mm-Lanyard-Full-Colour-Template.pdf) | 206 | 175002 |
| 142 | RPET Polyester Die Sub | [15mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260530-011924-583626-9D6044915C/VRT-20260530-170306-713389-F29216D012/15mm-Lanyard-Full-Colour-Template.pdf) | 206 | 681787 |
| 149 | RPET Polyester Die Sub | [20mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260530-011924-583626-9D6044915C/VRT-20260530-170944-399372-8B73F54E8F/20mm-Lanyard-Full-Colour-Template.pdf) | 206 | 674165 |
| 156 | RPET Polyester Die Sub | [25mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260530-011924-583626-9D6044915C/VRT-20260530-171331-390076-F0A5925358/25mm-Lanyard-Full-Colour-Template.pdf) | 206 | 665466 |
| 163 | RPET Polyester Die Sub | [30mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260530-011924-583626-9D6044915C/VRT-20260530-171605-965398-A3ADB60116/30mm-Lanyard-Full-Colour-Template.pdf) | 206 | 197763 |
| 357 | Polyester Die Sub | [10mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260625-192546-100697-C2356D6ACD/VRT-20260625-193412-231754-C230E3C736/10mm-Lanyard-Full-Colour-Template.pdf) | 206 | 175002 |
| 380 | Polyester Die Sub | [15mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260625-192546-100697-C2356D6ACD/VRT-20260625-215017-601906-1C0CE2A8A7/15mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 681787 |
| 387 | Polyester Die Sub | [30mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260625-192546-100697-C2356D6ACD/VRT-20260625-220423-576475-3FA4EAE453/30mm-Lanyard-Full-Colour-Template.pdf) | 206 | 197763 |
| 512 | Addie recycled PET lanyard with safety breakaway | [10mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-013036-250379-132D9158A0/10mm-Lanyard-Full-Colour-Template.pdf) | 206 | 175002 |
| 519 | Addie recycled PET lanyard with safety breakaway | [15mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-013848-008032-7B5B487B12/15mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 681787 |
| 526 | Addie recycled PET lanyard with safety breakaway | [20mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-014200-826986-5B09507346/20mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 674165 |
| 533 | Addie recycled PET lanyard with safety breakaway | [25mm-Lanyard-Full-Colour-Template_1_ecd603c1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-014633-721218-453C845B3A/25mm-Lanyard-Full-Colour-Template_1_ecd603c1.pdf) | 206 | 665466 |
| 541 | Addie recycled PET lanyard with safety breakaway | [15mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-015647-024357-4B00BEE5DD/15mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 681787 |
| 548 | Addie recycled PET lanyard with safety breakaway | [20mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-020006-491960-D1D5A312C4/20mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 674165 |
| 555 | Addie recycled PET lanyard with safety breakaway | [25mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260727-012441-233002-9B2DCBC2D7/VRT-20260727-020333-509894-C7A654E590/25mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 665466 |
| 571 | Addie sublimation lanyard with safety breakaway | [10mm-Lanyard-Full-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-003301-418825-C59CEF6880/10mm-Lanyard-Full-Colour-Template.pdf) | 206 | 175002 |
| 578 | Addie sublimation lanyard with safety breakaway | [15mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-003630-249458-19CE997EC1/15mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 681787 |
| 585 | Addie sublimation lanyard with safety breakaway | [20mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-003910-881736-75D4A3406E/20mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 674165 |
| 593 | Addie sublimation lanyard with safety breakaway | [25mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-004152-363361-0FCC58E0BA/25mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 665466 |
| 601 | Addie sublimation lanyard with safety breakaway | [15mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-004540-771475-656A00EA0C/15mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 681787 |
| 607 | Addie sublimation lanyard with safety breakaway | [20mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-004827-372640-DA8CD33752/20mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 674165 |
| 614 | Addie sublimation lanyard with safety breakaway | [25mm-Lanyard-Full-Colour-Template_1.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260731-002848-636256-0EA70276E0/VRT-20260731-005126-254619-11EAB71727/25mm-Lanyard-Full-Colour-Template_1.pdf) | 206 | 665466 |
| 640, 2519 | Super Lanyard \| Super Lanyard - Double-Ended | [20mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-210535-607203-F8E77FEA84/20mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 657651 |
| 641, 2520 | Super Lanyard \| Super Lanyard - Double-Ended | [25mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-210622-427017-8B375BE936/25mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 572575 |
| 642, 2521 | Super Lanyard \| Super Lanyard - Double-Ended | [30mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-210640-834817-1E46B1B0DF/30mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 1026832 |
| 648, 2523 | Super Lanyard \| Super Lanyard - Double-Ended | [20mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-213051-411359-3F31DEB529/20mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 657651 |
| 649, 2524 | Super Lanyard \| Super Lanyard - Double-Ended | [25mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-213105-042264-A038ADA2F4/25mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 572575 |
| 650, 2525 | Super Lanyard \| Super Lanyard - Double-Ended | [30mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-213117-231350-97992FA0D0/30mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 1026832 |
| 655, 2528 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260820-223115-953803-9749CF98A0/15mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 643372 |
| 664, 2556 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template1S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024504-409888-FA2F69A613/15mm-Lanyard-Spot-Colour-Template1S.pdf) | 206 | 136330 |
| 665, 2557 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template2S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024532-289942-75421A50DB/15mm-Lanyard-Spot-Colour-Template2S.pdf) | 206 | 643372 |
| 667, 2558 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template1S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024714-481692-DF08699D56/15mm-Lanyard-Spot-Colour-Template1S.pdf) | 206 | 136330 |
| 668, 2559 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template2S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-024745-482250-F03AE9D899/15mm-Lanyard-Spot-Colour-Template2S.pdf) | 206 | 643372 |
| 773, 2533 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-279095-62F1D8529D/15mm-Lanyard-Spot-Colour-Template.pdf) | 206 | 643372 |
| 788, 2565 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template1S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B10E9D/15mm-Lanyard-Spot-Colour-Template1S.pdf) | 206 | 136330 |
| 789, 2566 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template2S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B1C49D/15mm-Lanyard-Spot-Colour-Template2S.pdf) | 206 | 643372 |
| 790, 2567 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template1S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B24F9D/15mm-Lanyard-Spot-Colour-Template1S.pdf) | 206 | 136330 |
| 791, 2568 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template2S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-122525-330315-62F9B2B29D/15mm-Lanyard-Spot-Colour-Template2S.pdf) | 206 | 643372 |
| 809, 2552 | Super Lanyard \| Super Lanyard - Double-Ended | [12mm-Lanyard-Spot-Colour-Template1S_copia.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-123248-734377-6B43B0529D/12mm-Lanyard-Spot-Colour-Template1S_copia.pdf) | 206 | 480675 |
| 810, 2553 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template1S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-123248-734377-6B43B06E9D/15mm-Lanyard-Spot-Colour-Template1S.pdf) | 206 | 136330 |
| 812, 2555 | Super Lanyard \| Super Lanyard - Double-Ended | [15mm-Lanyard-Spot-Colour-Template2S.pdf](https://promoflow.net/dot63/controller/views/uploads/1_Ian_Southworth/PRD-20260820-202626-008131-7E0BD6F150/VRT-20260821-123248-734377-6B43B0869D/15mm-Lanyard-Spot-Colour-Template2S.pdf) | 206 | 643372 |

