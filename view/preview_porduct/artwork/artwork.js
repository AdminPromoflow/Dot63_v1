class Artwork {
  constructor() {

  }
  deleteArtwork(typeId) {
    const wrapper = document.getElementById(`wrap-artworks-${typeId}`);
    if (!wrapper) return false;

    wrapper.remove();
    return true;
  }
}
const artwork = new Artwork();
