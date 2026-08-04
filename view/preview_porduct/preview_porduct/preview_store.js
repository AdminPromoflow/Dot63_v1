export class PreviewStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.product = null;
    this.readiness = null;
    this.permissions = {};
    this.selectedPath = [];
    this.selectedPrice = null;
    this.selectedQuantity = null;
    this.loading = false;
    this.error = null;
  }

  setProduct(payload) {
    this.product = payload.product || null;
    this.readiness = payload.readiness || null;
    this.permissions = payload.permissions || {};
  }

  setPathEntry(level, row) {
    const safeLevel = Math.max(0, Number(level) || 0);
    this.selectedPath = this.selectedPath.slice(0, safeLevel);
    this.selectedPath[safeLevel] = row;
  }

  truncatePath(level) {
    const length = Math.max(0, Number(level) || 0);
    this.selectedPath = this.selectedPath.slice(0, length);
  }

  getSelectedVariationIds() {
    return this.selectedPath
      .map((row) => Number(row?.variation?.variation_id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
}
