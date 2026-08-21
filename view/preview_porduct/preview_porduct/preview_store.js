/*
 * [Supplier 5.1 / 6.3 / 8.2]
 * Store es la memoria temporal del preview. No dibuja HTML ni llama al servidor;
 * solo conserva el producto, el precio y la ruta de variaciones elegida.
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
    // [Supplier 6.3.1] selectedPath representa raíz -> opción -> subopción en el mismo orden visual.
    this.selectedPath = [];
  }

  setPathEntry(level, row) {
    // [Supplier 6.3.2] Al escribir un nivel se eliminan niveles más profundos que ya no pertenecen a la ruta.
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
    // [Supplier 6.3.3] Si todavía no conocemos el nuevo nodo, conservamos solo sus antecesores.
    const numericLevel = Number(level);
    const length = Number.isFinite(numericLevel)
      ? Math.max(0, Math.trunc(numericLevel))
      : 0;

    this.selectedPath = this.selectedPath.slice(0, length);
  }

  getSelectedRows() {
    // [Supplier 7.1] Los renderizadores reciben solo filas válidas y en orden.
    return this.selectedPath.filter((row) => row && typeof row === "object");
  }

  getSelectedVariationIds() {
    // [Supplier 8.3.1] La API de extras necesita únicamente IDs numéricos positivos.
    return this.getSelectedRows()
      .map((row) => Number(row?.variation?.variation_id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
}
