# Imágenes de Super Lanyard — Two Ends

SKU de producto: `PRD-DOUBLE-ENDED-20260923-39`.

Se mantiene la estructura de 68 variaciones de Super Lanyard y la distribución original de 67 imágenes de opción y 62 de galería. El ZIP permite cubrir 64 imágenes de opción y 61 de galería. Default conserva la ausencia de imagen.

Los nombres siguientes están preparados para Two Ends; todavía no están registrados en una base de datos real. Los archivos proceden de `SuperLanyardTwoEnds.zip`, sin editar su contenido visual.

## Carpetas

Galería (`images.link`):

`controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/<SKU_variacion>/`

Opciones (ubicación física):

`controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/<SKU_variacion>/`

En `variations.image` se guarda la misma ruta sin el prefijo `controller/`.

Los SKU de las variaciones son `VRT-DOUBLE-ENDED-20260923-39-<ID_original>`, iguales a los del SQL existente.

## Nombres y archivos de origen

| Nombre preparado | Archivo del ZIP | Uso |
|---|---|---|
| `12mm-TwoEnds.png` | `minis/Widths/12mm.png` | Galería |
| `12mm-TwoEnds.png` | `minis/Widths/12mm.png` | Opción |
| `15mm-TwoEnds.png` | `15.png` | Galería |
| `15mm-TwoEnds.png` | `minis/Widths/15mm.png` | Opción |
| `20mm-TwoEnds.png` | `20.png` | Galería |
| `20mm-TwoEnds.png` | `minis/Widths/20mm.png` | Opción |
| `25mm-TwoEnds.png` | `25.png` | Galería |
| `25mm-TwoEnds.png` | `minis/Widths/25mm.png` | Opción |
| `30mm-TwoEnds.png` | `30.png` | Galería |
| `30mm-TwoEnds.png` | `minis/Widths/30mm.png` | Opción |
| `CMYK-TwoEnds.png` | `minis/colour/CMYK.png` | Opción |
| `Dye-Sublimation-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_49_01.png` | Galería |
| `Dye-Sublimation-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_49_01.png` | Opción |
| `Flat-TwoEnds.png` | `PENDIENTE: no incluido en el ZIP` | Galería |
| `Flat-TwoEnds.png` | `PENDIENTE: no incluido en el ZIP` | Opción |
| `Full-Colour-CMYK-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_58_38.png` | Galería |
| `One-Colour-TwoEnds.png` | `minis/colour/one-colour.png` | Galería |
| `One-Colour-TwoEnds.png` | `minis/colour/one-colour.png` | Opción |
| `One-Side-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_58_44.png` | Galería |
| `One-Side-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_58_44.png` | Opción |
| `Polyester-TwoEnds.png` | `PENDIENTE: no incluido en el ZIP` | Opción |
| `RPET-Polyester-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 20_02_37.png` | Opción |
| `Screen-Print-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_49_59.png` | Galería |
| `Screen-Print-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_49_59.png` | Opción |
| `Tubular-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_49_42.png` | Galería |
| `Tubular-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_49_42.png` | Opción |
| `Two-Colours-TwoEnds.png` | `minis/colour/Two-colour.png` | Galería |
| `Two-Colours-TwoEnds.png` | `minis/colour/Two-colour.png` | Opción |
| `Two-Sides-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_58_49.png` | Galería |
| `Two-Sides-TwoEnds.png` | `ChatGPT Image 22 sept 2026, 19_58_49.png` | Opción |

## Pendientes y observaciones

- `Flat-TwoEnds.png`: falta en la opción Flat y su galería (variación original 634).
- `Polyester-TwoEnds.png`: falta en las opciones de material Polyester de Flat y Tubular (635 y 803).
- Se crean sus carpetas, pero no se insertan rutas a archivos inexistentes. Los pendientes permanecen sin imagen si el producto se creó con el SQL original.
- Para 12mm se usa el archivo real `minis/Widths/12mm.png`, evitando repetir la referencia errónea a 10mm del Super Lanyard original.
- Los iconos de color y ancho son los disponibles en minis. La imagen de 12mm es un detalle de un extremo, no una vista completa de ambos extremos.
- One Side y Two Sides son las imágenes suministradas. En One Side, el texto dice One side aunque las insignias muestran Side 2; se conserva el original.
- No se añaden accesorios, clips ni portatarjetas porque no son variaciones de este producto en la estructura de referencia.
- El ZIP contiene dos copias idénticas de Dye Sublimation (19_49_01 y 19_49_54). Se utiliza 19_49_01.

## Aplicación del paquete

1. El producto debe existir con el SKU indicado y las 68 variaciones creadas por `insert_super_lanyard_double_ended.sql`.
2. Copiar la carpeta `controller` del paquete a la raíz del sitio, conservando sus subcarpetas.
3. Importar `update_super_lanyard_two_ends_images.sql` en la base correspondiente. Se espera APPLIED_AVAILABLE_IMAGES y, partiendo del producto sin imágenes, 64 opciones y 61 imágenes de galería.
4. El SQL completa opciones vacías, conserva las que ya tengan una imagen y evita duplicar sus imágenes de galería. Si la estructura no coincide, devuelve NOT_APPLIED.

## Inventario completo por variación

### VRT-DOUBLE-ENDED-20260923-39-629

Default

Sin imagen, igual que en Super Lanyard.

### VRT-DOUBLE-ENDED-20260923-39-634

Default / Flat

- Opción — PENDIENTE: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-634/Flat-TwoEnds.png`
- Galería — PENDIENTE: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-634/Flat-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-635

Default / Flat / Polyester

- Opción — PENDIENTE: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-635/Polyester-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-637

Default / Flat / RPET Polyester

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-637/RPET-Polyester-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-639

Default / Flat / Polyester / 15mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-639/15mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-639/15mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-640

Default / Flat / Polyester / 20mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-640/20mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-640/20mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-641

Default / Flat / Polyester / 25mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-641/25mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-641/25mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-642

Default / Flat / Polyester / 30mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-642/30mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-642/30mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-647

Default / Flat / RPET Polyester / 15mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-647/15mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-647/15mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-648

Default / Flat / RPET Polyester / 20mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-648/20mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-648/20mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-649

Default / Flat / RPET Polyester / 25mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-649/25mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-650

Default / Flat / RPET Polyester / 30mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-650/30mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-655

Default / Flat / Polyester / 15mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-655/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-655/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-662

Default / Flat / Polyester / 15mm / Screen print

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-662/Screen-Print-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-662/Screen-Print-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-663

Default / Flat / Polyester / 15mm / Screen print / One colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-663/One-Colour-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-663/One-Colour-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-664

Default / Flat / Polyester / 15mm / Screen print / One colour / One side

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-664/One-Side-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-664/One-Side-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-665

Default / Flat / Polyester / 15mm / Screen print / One colour / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-665/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-665/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-666

Default / Flat / Polyester / 15mm / Screen print / Two colours

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-666/Two-Colours-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-666/Two-Colours-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-667

Default / Flat / Polyester / 15mm / Screen print / Two colours / One side

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-667/One-Side-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-667/One-Side-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-668

Default / Flat / Polyester / 15mm / Screen print / Two colours / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-668/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-668/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-670

Default / Flat / Polyester / 15mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-670/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-670/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-671

Default / Flat / Polyester / 15mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-671/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-671/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-672

Default / Flat / Polyester / 20mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-672/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-672/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-673

Default / Flat / Polyester / 20mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-673/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-673/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-674

Default / Flat / Polyester / 20mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-674/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-674/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-675

Default / Flat / Polyester / 25mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-675/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-675/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-676

Default / Flat / Polyester / 25mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-676/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-676/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-677

Default / Flat / Polyester / 25mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-677/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-677/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-678

Default / Flat / Polyester / 30mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-678/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-678/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-679

Default / Flat / Polyester / 30mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-679/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-679/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-680

Default / Flat / Polyester / 30mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-680/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-680/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-773

Default / Flat / RPET Polyester / 15mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-773/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-773/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-774

Default / Flat / RPET Polyester / 15mm / Screen print

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-774/Screen-Print-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-774/Screen-Print-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-775

Default / Flat / RPET Polyester / 20mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-775/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-775/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-776

Default / Flat / RPET Polyester / 25mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-776/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-776/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-777

Default / Flat / RPET Polyester / 30mm / Dye Sublimation

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-777/Dye-Sublimation-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-777/Dye-Sublimation-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-780

Default / Flat / RPET Polyester / 15mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-780/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-780/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-781

Default / Flat / RPET Polyester / 15mm / Screen print / One colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-781/One-Colour-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-781/One-Colour-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-782

Default / Flat / RPET Polyester / 15mm / Screen print / Two colours

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-782/Two-Colours-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-782/Two-Colours-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-783

Default / Flat / RPET Polyester / 20mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-783/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-783/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-784

Default / Flat / RPET Polyester / 25mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-784/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-784/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-785

Default / Flat / RPET Polyester / 30mm / Dye Sublimation / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-785/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-785/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-787

Default / Flat / RPET Polyester / 15mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-787/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-787/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-788

Default / Flat / RPET Polyester / 15mm / Screen print / One colour / One side

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-788/One-Side-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-788/One-Side-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-789

Default / Flat / RPET Polyester / 15mm / Screen print / One colour / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-789/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-789/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-790

Default / Flat / RPET Polyester / 15mm / Screen print / Two colours / One side

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-790/One-Side-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-790/One-Side-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-791

Default / Flat / RPET Polyester / 15mm / Screen print / Two colours / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-791/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-791/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-792

Default / Flat / RPET Polyester / 20mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-792/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-792/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-793

Default / Flat / RPET Polyester / 25mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-793/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-793/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-794

Default / Flat / RPET Polyester / 30mm / Dye Sublimation / Two sides / Full colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-794/CMYK-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-794/Full-Colour-CMYK-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-802

Default / Tubular

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-802/Tubular-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-802/Tubular-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-803

Default / Tubular / Polyester

- Opción — PENDIENTE: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-803/Polyester-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-804

Default / Tubular / Polyester / 12mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-804/12mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-804/12mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-805

Default / Tubular / Polyester / 15mm

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-805/15mm-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-805/15mm-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-806

Default / Tubular / Polyester / 12mm / Screen print

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-806/Screen-Print-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-806/Screen-Print-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-807

Default / Tubular / Polyester / 15mm / Screen print

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-807/Screen-Print-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-807/Screen-Print-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-809

Default / Tubular / Polyester / 12mm / Screen print / One side

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-809/One-Side-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-809/One-Side-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-810

Default / Tubular / Polyester / 15mm / Screen print / One side

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-810/One-Side-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-810/One-Side-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-811

Default / Tubular / Polyester / 12mm / Screen print / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-811/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-811/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-812

Default / Tubular / Polyester / 15mm / Screen print / Two sides

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-812/Two-Sides-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-812/Two-Sides-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-816

Default / Tubular / Polyester / 12mm / Screen print / One side / One colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-816/One-Colour-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-816/One-Colour-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-817

Default / Tubular / Polyester / 12mm / Screen print / Two sides / One colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-817/One-Colour-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-817/One-Colour-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-818

Default / Tubular / Polyester / 15mm / Screen print / One side / One colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-818/One-Colour-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-818/One-Colour-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-819

Default / Tubular / Polyester / 15mm / Screen print / Two sides / One colour

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-819/One-Colour-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-819/One-Colour-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-820

Default / Tubular / Polyester / 12mm / Screen print / One side / Two colours

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-820/Two-Colours-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-820/Two-Colours-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-821

Default / Tubular / Polyester / 12mm / Screen print / Two sides / Two colours

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-821/Two-Colours-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-821/Two-Colours-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-822

Default / Tubular / Polyester / 15mm / Screen print / One side / Two colours

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-822/Two-Colours-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-822/Two-Colours-TwoEnds.png`

### VRT-DOUBLE-ENDED-20260923-39-823

Default / Tubular / Polyester / 15mm / Screen print / Two sides / Two colours

- Opción — disponible: `controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-823/Two-Colours-TwoEnds.png`
- Galería — disponible: `controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39/VRT-DOUBLE-ENDED-20260923-39-823/Two-Colours-TwoEnds.png`

## Traslado desde Downloads completado

Se movieron y renombraron las 46 imágenes originales de `/Users/aleinarossui/Downloads/SuperLanyardTwoEnds` a `/private/tmp/super-lanyard-two-ends`. Las 19 imágenes usadas por el producto conservan sus 125 destinos por variación; las otras 27 están en `extras` con nombres terminados en `-TwoEnds.png`. El archivo `IMAGENES_MOVIDAS.md` del paquete detalla cada cambio de nombre y ubicación. No quedan PNG en la carpeta de origen.

## Instalación de las carpetas en el proyecto

Las imágenes de Double Ended ya están instaladas en `/Applications/XAMPP/xamppfiles/htdocs/Dot63_v1`, en las dos rutas siguientes:

- `/Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/uploads/1_Ian-Southworth/PRD-DOUBLE-ENDED-20260923-39`
- `/Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/views/uploads/1_Ian_Southworth/PRD-DOUBLE-ENDED-20260923-39`

Cada carpeta de producto contiene las 68 subcarpetas `VRT-DOUBLE-ENDED-20260923-39-…`. Galería contiene 61 PNG y opciones contiene 64 PNG. Se verificó que los 125 archivos coinciden con el paquete. Default y los destinos pendientes conservan sus carpetas vacías. Este traslado instala archivos; el SQL de imágenes sigue sin aplicarse a una base real.
