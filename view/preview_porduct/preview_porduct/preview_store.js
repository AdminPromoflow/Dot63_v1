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
    this.selectedPath = [];
  }

  setPathEntry(level, row) {
    if (!row || typeof row !== "object") return false;

    const numericLevel = Number(level);
    const safeLevel = Number.isFinite(numericLevel)
      ? Math.max(0, Math.trunc(numericLevel))
      : 0;

    this.selectedPath = this.selectedPath.slice(0, safeLevel);
    this.selectedPath[safeLevel] = row;
    return true;
  }

  truncatePath(level) {
    const numericLevel = Number(level);
    const length = Number.isFinite(numericLevel)
      ? Math.max(0, Math.trunc(numericLevel))
      : 0;

    this.selectedPath = this.selectedPath.slice(0, length);
  }

  getSelectedRows() {
    return this.selectedPath.filter((row) => row && typeof row === "object");
  }

  getSelectedVariationIds() {
    return this.getSelectedRows()
      .map((row) => Number(row?.variation?.variation_id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
}
