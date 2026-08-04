export class PreviewStore {
  constructor() {
    this.reset();
  }

  reset() {
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
    this.product = payload.product || null;
    this.readiness = payload.readiness || null;
    this.permissions = payload.permissions || {};
  }

  clearVariationSelections() {
    this.rootVariation = null;
    this.selectedByLevel = new Map();
    this.groupLevels = new Map();
  }

  setRootVariation(row) {
    this.rootVariation = row && typeof row === "object" ? row : null;
  }

  setGroupSelection(level, groupKey, row, metadata = {}) {
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
    const safeKey = String(groupKey || "").trim();
    const level = this.groupLevels.get(safeKey);
    if (level === undefined) return null;
    return this.selectedByLevel.get(level)?.get(safeKey) || null;
  }

  removeGroupSelection(groupKey) {
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
    const rows = [];
    if (this.rootVariation) rows.push(this.rootVariation);
    rows.push(...this.getSelectedEntries().map((entry) => entry.row));
    return rows;
  }

  getSelectedVariationIds() {
    return this.getSelectedRows()
      .map((row) => Number(row?.variation?.variation_id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
}
