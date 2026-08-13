/*
 * [Customer 5.1 / 6.3 / 8.2]
 * Store es la memoria temporal del preview. No dibuja HTML ni llama al servidor;
 * conserva el producto, el precio y todas las ramas de variaciones elegidas.
 */
export class PreviewStore {
  constructor() {
    // [Customer 5.1.1] Toda instancia empieza con un estado conocido.
    this.reset();
  }

  reset() {
    // [Customer 5.1.2] Un reset evita que otro producto herede precio o selecciones anteriores.
    this.product = null;
    this.readiness = null;
    this.permissions = {};
    this.selectedPrice = null;
    this.selectedPriceId = null;
    this.selectedQuantity = null;
    this.loading = false;
    this.error = null;
    this.clearVariationSelections();
  }

  setProduct(payload) {
    // [Customer 5.1.3] Conservamos únicamente las partes de la respuesta usadas por la interfaz.
    this.product = payload.product || null;
    this.readiness = payload.readiness || null;
    this.permissions = payload.permissions || {};
  }

  clearVariationSelections() {
    // [Customer 6.3.1] La raíz se guarda aparte. Los Map permiten varias ramas en un mismo nivel.
    this.rootVariation = null;
    this.selectedByLevel = new Map();
    this.groupLevels = new Map();
  }

  setRootVariation(row) {
    // [Customer 6.3.2] La raíz aporta recursos generales y es el inicio de todo el árbol.
    this.rootVariation = row && typeof row === "object" ? row : null;
  }

  setGroupSelection(level, groupKey, row, metadata = {}) {
    // [Customer 6.3.3] groupKey identifica una rama por padre y tipo; así dos grupos hermanos
    // pueden conservar su selección sin sobrescribirse.
    const safeLevel = Math.max(1, Number(level) || 1);
    const safeKey = String(groupKey || "").trim();
    if (!safeKey || !row || typeof row !== "object") return false;

    const previousLevel = this.groupLevels.get(safeKey);
    if (previousLevel !== undefined && previousLevel !== safeLevel) {
      const previousMap = this.selectedByLevel.get(previousLevel);
      previousMap?.delete(safeKey);
      if (previousMap?.size === 0) this.selectedByLevel.delete(previousLevel);
    }

    if (!this.selectedByLevel.has(safeLevel)) {
      this.selectedByLevel.set(safeLevel, new Map());
    }

    this.selectedByLevel.get(safeLevel).set(safeKey, {
      row,
      level: safeLevel,
      groupKey: safeKey,
      parentVariationId: Number(metadata.parentVariationId) || 0,
      typeId: String(metadata.typeId || "")
    });
    this.groupLevels.set(safeKey, safeLevel);
    return true;
  }

  getGroupSelection(groupKey) {
    // [Customer 6.3.4] Localizamos una selección sin recorrer todos los niveles.
    const safeKey = String(groupKey || "").trim();
    const level = this.groupLevels.get(safeKey);
    if (level === undefined) return null;
    return this.selectedByLevel.get(level)?.get(safeKey) || null;
  }

  removeGroupSelection(groupKey) {
    // [Customer 6.3.5] Al cambiar un padre se elimina el estado de las ramas que dejan de existir.
    const safeKey = String(groupKey || "").trim();
    const level = this.groupLevels.get(safeKey);
    if (level === undefined) return false;

    const levelSelections = this.selectedByLevel.get(level);
    levelSelections?.delete(safeKey);
    if (levelSelections?.size === 0) this.selectedByLevel.delete(level);
    this.groupLevels.delete(safeKey);
    return true;
  }

  getSelectedEntries() {
    // [Customer 7.1.1] Aplanamos los Map respetando el orden de niveles para renderizar la ruta.
    const entries = [];
    const levels = [...this.selectedByLevel.keys()].sort((a, b) => a - b);

    for (const level of levels) {
      for (const entry of this.selectedByLevel.get(level).values()) {
        entries.push(entry);
      }
    }

    return entries;
  }

  getSelectedRows() {
    // [Customer 7.1.2] La lista final empieza con la raíz y continúa con todas las selecciones.
    const rows = [];
    if (this.rootVariation) rows.push(this.rootVariation);
    rows.push(...this.getSelectedEntries().map((entry) => entry.row));
    return rows;
  }

  getSelectedVariationIds() {
    // [Customer 10.1.3] El carrito recibe únicamente IDs numéricos positivos.
    return this.getSelectedRows()
      .map((row) => Number(row?.variation?.variation_id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
}
