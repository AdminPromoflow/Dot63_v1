/*
 * [Supplier 5.1 / 6.3 / 8.2]
 * Store es la memoria temporal del preview. No dibuja HTML ni llama al servidor;
 * conserva el producto, el precio y todas las ramas de variaciones elegidas.
 */
export class PreviewStore {
  constructor() {
    // [Supplier 5.1.1] Toda instancia empieza con un estado conocido.
    this.reset();
  }

  reset() {
    // [Supplier 5.1.2] Un reset borra datos anteriores para que otro producto no herede selecciones.
    this.product = null;
    this.readiness = null;
    this.permissions = {};
    this.selectedPrice = null;
    this.selectedQuantity = null;
    this.loading = false;
    this.error = null;
    this.clearVariationSelections();
  }

  setProduct(payload) {
    // [Supplier 5.1.3] Conservamos únicamente las partes de la respuesta usadas por la interfaz.
    this.product = payload.product || null;
    this.readiness = payload.readiness || null;
    this.permissions = payload.permissions || {};
  }

  clearVariationSelections() {
    // [Supplier 6.3.1] La raíz se guarda aparte. Los Map permiten varias ramas en un mismo nivel.
    this.rootVariation = null;
    this.selectedByLevel = new Map();
    this.groupLevels = new Map();
  }

  setRootVariation(row) {
    // [Supplier 6.3.2] La raíz aporta recursos generales y es el inicio de todo el árbol.
    this.rootVariation = row && typeof row === "object" ? row : null;
  }

  setGroupSelection(level, groupKey, row, metadata = {}) {
    // [Supplier 6.3.3] Cada grupo se identifica por su padre y su tipo. Dos grupos hermanos
    // pueden estar en el mismo nivel sin sobrescribir sus selecciones.
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
    // [Supplier 6.3.4] La clave permite consultar una rama sin recorrer los otros grupos.
    const safeKey = String(groupKey || "").trim();
    const level = this.groupLevels.get(safeKey);
    if (level === undefined) return null;
    return this.selectedByLevel.get(level)?.get(safeKey) || null;
  }

  removeGroupSelection(groupKey) {
    // [Supplier 6.3.5] Solo se elimina la rama que dejó de pertenecer a la configuración.
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
    // [Supplier 7.1.1] Se aplanan los grupos respetando el orden de niveles.
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
    // [Supplier 7.1.2] Los renderizadores reciben la raíz y todas las selecciones independientes.
    const rows = [];
    if (this.rootVariation) rows.push(this.rootVariation);
    rows.push(...this.getSelectedEntries().map((entry) => entry.row));
    return rows;
  }

  getSelectedVariationIds() {
    // [Supplier 8.3.1] La API de extras necesita únicamente IDs numéricos positivos.
    return this.getSelectedRows()
      .map((row) => Number(row?.variation?.variation_id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
}
