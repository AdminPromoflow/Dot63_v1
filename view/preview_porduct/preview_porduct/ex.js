/* ============================================================================
  1) constructor()
============================================================================ */
constructor() {
  this.getDataProducts();
}

/* ============================================================================
  2) getDataProducts()
============================================================================ */
getDataProducts() {
  // (Aquí se consulta la BD y se obtiene el ID de la variación default)
  const id = /* obtener ID default */;

  this.fetchAllVariations(id);
}

/* ============================================================================
  3) fetchAllVariations(id)
============================================================================ */
fetchAllVariations(id) {
  // (Aquí consultas la BD y obtienes TODAS las variaciones hijas del id)
  const childVariations = /* obtener variaciones hijas del id */;

  // (Aquí calculas un array de variationType desde BD)
  const variationTypes = /* obtener array de variationType */;

  // IF 1: solo para variationTypes (borrado)
  if (variationTypes && variationTypes.length > 0) {
    this.organizeVariationTypesForDelete(variationTypes);
  }

  // IF 2: solo para childVariations (render)
  if (childVariations && childVariations.length > 0) {
    this.organizeVariationsForRender(childVariations);
  }
}

/* ============================================================================
  4) organizeVariationTypesForDelete(variationTypes)
============================================================================ */
organizeVariationTypesForDelete(variationTypes) {
  for (const typeVariation of variationTypes) {
    if (typeVariation?.Variations) this.deleteVariations(typeVariation);
    if (typeVariation?.Items)      this.deleteItems(typeVariation);
    if (typeVariation?.Images)     this.deleteImages(typeVariation);
    if (typeVariation?.Prices)     this.deletePrices(typeVariation);
    if (typeVariation?.Artwork)    this.deleteArtwork(typeVariation);
  }
}

/* ============================================================================
  5) deleteVariations(typeVariation)
============================================================================ */
deleteVariations(typeVariation) {
  // (Aquí eliminas los divs de variaciones relacionados a este typeVariation)
}

/* ============================================================================
  6) deleteItems(typeVariation)
============================================================================ */
deleteItems(typeVariation) {
  // (Aquí eliminas los divs/elementos de items relacionados a este typeVariation)
}

/* ============================================================================
  7) deleteImages(typeVariation)
============================================================================ */
deleteImages(typeVariation) {
  // (Aquí eliminas los divs/elementos de imágenes relacionados a este typeVariation)
}

/* ============================================================================
  8) deletePrices(typeVariation)
============================================================================ */
deletePrices(typeVariation) {
  // (Aquí eliminas los divs/elementos de precios relacionados a este typeVariation)
}

/* ============================================================================
  9) deleteArtwork(typeVariation)
============================================================================ */
deleteArtwork(typeVariation) {
  // (Aquí eliminas los divs/elementos de artwork relacionados a este typeVariation)
}

/* ============================================================================
  10) organizeVariationsForRender(childVariations)
============================================================================ */
organizeVariationsForRender(childVariations) {
  // (Aquí agrupas por typeVariation)
  const groupedByType = /* agrupar childVariations por typeVariation */;

  // Render: recorrer por typeVariation y enviar (data, typeVariation)
  for (const typeVariation of groupedByType) {
    if (childVariations?.Items)   this.renderItems(childVariations.Items, typeVariation);
    if (childVariations?.Images)  this.renderImages(childVariations.Images, typeVariation);
    if (childVariations?.Prices)  this.renderPrices(childVariations.Prices, typeVariation);
    if (childVariations?.Artwork) this.renderArtwork(childVariations.Artwork, typeVariation);

    this.renderVariations(typeVariation, childVariations);
  }
}

/* ============================================================================
  11) renderItems(items, typeVariation)
============================================================================ */
renderItems(items, typeVariation) {
  // (Render de items para este typeVariation)
}

/* ============================================================================
  12) renderImages(images, typeVariation)
============================================================================ */
renderImages(images, typeVariation) {
  // (Render de images para este typeVariation)
}

/* ============================================================================
  13) renderPrices(prices, typeVariation)
============================================================================ */
renderPrices(prices, typeVariation) {
  // (Render de prices para este typeVariation)
}

/* ============================================================================
  14) renderArtwork(artwork, typeVariation)
============================================================================ */
renderArtwork(artwork, typeVariation) {
  // (Render de artwork para este typeVariation)
}

/* ============================================================================
  15) renderVariations(typeVariation, allVariations)
============================================================================ */
renderVariations(typeVariation, allVariations) {
  // (Aquí dibujas las variaciones de este typeVariation en el DOM)
  this.selectVariationZeroAndContinue(allVariations);
}

/* ============================================================================
  16) selectVariationZeroAndContinue(allVariations)
============================================================================ */
selectVariationZeroAndContinue(allVariations) {
  // Selección automática: variación 0 del grupo GENERAL (NO del typeVariation)
  const selected = allVariations[0];

  // Capturar ID de la seleccionada
  const selectedId = selected.id;

  // Repetir el ciclo consultando hijas de la hija
  this.fetchAllVariations(selectedId);
}
