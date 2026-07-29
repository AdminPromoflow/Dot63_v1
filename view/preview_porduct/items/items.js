class Items {
  constructor() {

  }
  deleteItems(typeId) {
    const wrapper = document.getElementById(`wrap-items-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    return true;
  }
}
const items = new Items();
