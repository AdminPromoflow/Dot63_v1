<?php

$cssFile =
  '../../view/variations/varia/variations.css';

$jsFile =
  '../../view/variations/varia/variations.js';

$cssVersion =
  is_file($cssFile)
    ? filemtime($cssFile)
    : '';

$jsVersion =
  is_file($jsFile)
    ? filemtime($jsFile)
    : '';

?>
<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Product variations
  </title>

  <link
    rel="stylesheet"
    href="../../view/variations/varia/variations.css<?= $cssVersion ? '?v=' . $cssVersion : '' ?>"
  >

</head>

<body>

  <main
    class="create_product"
    aria-labelledby="variation_title"
  >

    <?php

    include
      "../../view/variations/navigation/navigation.php";

    ?>

    <?php

    include
      "../../view/global/header_add_product/header_add_product.php";

    ?>

    <!-- =========================
         VARIATION SELECTION
    ========================== -->

    <section
      class="cp-card cp-section"
      id="variation_decision_section"
      aria-labelledby="variation_title"
    >

      <header class="cp-card-header">

        <h2 id="variation_title">
          Variations
        </h2>

      </header>

      <div class="cp-decision">

        <div class="cp-choice">

          <div class="cp-choice-body">

            <div
              class="cp-actions cp-actions-decision"
              style="
                gap:6px;
                position:relative;
              "
            >

              <button
                class="btn btn-ghost"
                id="menu_btn"
                type="button"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Select variation ▾
              </button>

              <ul
                id="menu_list"
                class="cp-menu-list"
                hidden
                style="
                  position:absolute;
                  top:110%;
                  left:0;
                  min-width:220px;
                  max-height:260px;
                  margin:0;
                  padding:6px;
                  overflow:auto;
                  list-style:none;
                  background:#ffffff;
                  border:1px solid var(--border);
                  border-radius:12px;
                  box-shadow:var(--shadow);
                "
              ></ul>

              <button
                class="btn btn-primary"
                id="add_variation"
                type="button"
                aria-label="Create a new variation"
              >
                + New variation
              </button>

            </div>

            <small class="cp-hint">
              Select an existing variation to modify
              or create a new one.
            </small>

          </div>

        </div>

      </div>

    </section>

    <!-- =========================
         VARIATION DETAILS
    ========================== -->

    <section
      class="cp-card cp-section"
      id="variation_details_section"
      aria-labelledby="variation_details_title"
    >

      <header class="cp-card-header">

        <h2 id="variation_details_title">
          Variation details
        </h2>

      </header>

      <form
        id="variationForm"
        class="cp-form"
        autocomplete="off"
        novalidate
      >

        <!-- Variation type -->

        <div class="cp-field">

          <label
            class="cp-label"
            for="group"
          >
            Variation type
          </label>

          <select
            id="group"
            name="group"
            class="cp-select"
            aria-describedby="group_help"
          >

            <option
              value=""
              disabled
              selected
            >
              Select a variation type
            </option>

          </select>

          <small
            id="group_help"
            class="cp-hint"
          >
            Select the variation type.
          </small>

        </div>

        <!-- Parent variation -->

        <div class="cp-field">

          <label
            class="cp-label"
            for="parent_variations"
          >
            Parent variation
          </label>

          <select
            id="parent_variations"
            name="parent_variation"
            class="cp-select"
            aria-describedby="parent_help"
          >

            <option
              value=""
              disabled
              selected
            >
              Select a parent
            </option>

          </select>

          <small
            id="parent_help"
            class="cp-hint"
          >
            Select one parent variation.
          </small>

          <div
            id="parent_chips"
            class="cp-chips"
            aria-hidden="true"
          ></div>

        </div>

        <!-- Variation name -->

        <div class="cp-field">

          <label
            class="cp-label"
            for="variation_name"
          >
            Variation name
          </label>

          <input
            id="variation_name"
            name="variation_name"
            type="text"
            required
            maxlength="150"
            placeholder="e.g. Polyester 20 mm – Green"
          >

        </div>

        <!-- Empty field for grid alignment -->

        <div
          class="cp-field"
          aria-hidden="true"
        ></div>

        <!-- Variation image -->

        <div class="cp-field cp-field-full">

          <label
            class="cp-label"
            for="variation_image"
          >
            Image

            <small
              style="
                font-weight:400;
                color:var(--muted);
              "
            >
              (icon image)
            </small>

          </label>

          <div class="cp-inline-row">

            <input
              id="variation_image"
              name="variation_image"
              type="file"
              accept="image/*"
            >

            <button
              class="btn btn-ghost"
              id="clear_image"
              type="button"
            >
              Remove
            </button>

          </div>

          <small class="cp-hint">
            An icon-sized image is recommended,
            for example 128 × 128 pixels.
          </small>

          <div
            class="cp-img-preview"
            id="img_preview"
            aria-live="polite"
          ></div>

        </div>

      </form>

      <!-- =========================
           PDF ARTWORK
      ========================== -->

      <div class="cp-pdf-block">

        <div class="cp-form cp-pdf-form">

          <div class="cp-field">

            <label
              class="cp-label"
              for="variation_pdf"
            >
              PDF artwork
            </label>

            <div class="cp-inline-row">

              <input
                id="variation_pdf"
                name="variation_pdf"
                type="file"
                accept="application/pdf,.pdf"
              >

              <button
                class="btn btn-ghost"
                id="clear_pdf"
                type="button"
              >
                Remove
              </button>

            </div>

            <div
              class="cp-file-preview"
              id="pdf_preview"
              aria-live="polite"
            ></div>

          </div>

          <div class="cp-field">

            <label
              class="cp-label"
              for="name_pdf_artwork"
            >
              Artwork file name
            </label>

            <input
              id="name_pdf_artwork"
              name="name_pdf_artwork"
              type="text"
              maxlength="150"
              placeholder="e.g. client-logo-2026.pdf"
            >

            <small class="cp-hint">
              Optional internal name for the artwork file.
            </small>

          </div>

        </div>

      </div>

    </section>

    <!-- =========================
         GROUP MODAL
    ========================== -->

    <div
      id="group_modal"
      class="cp-modal"
      hidden
    >

      <div
        class="cp-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group_modal_title"
      >

        <h3 id="group_modal_title">
          Create group
        </h3>

        <p class="cp-modal-text">
          Enter the name of the new variation group.
        </p>

        <input
          class="cp-modal-input"
          id="group_name_input"
          type="text"
          maxlength="150"
          placeholder="e.g. Width, Material or Colour"
        >

        <div class="cp-modal-actions">

          <button
            class="btn btn-ghost"
            id="group_cancel_btn"
            type="button"
          >
            Cancel
          </button>

          <button
            class="btn btn-primary"
            id="group_create_btn"
            type="button"
          >
            Create
          </button>

        </div>

      </div>

    </div>

    <!-- =========================
         FOOTER ACTIONS
    ========================== -->

    <div
      class="cp-footer"
      id="variation_actions_section"
    >

      <button
        class="btn-back"
        id="btn_back_variations"
        type="button"
        aria-label="Return to product details"
      >
        ← Back
      </button>

      <div class="cp-footer-actions">

        <button
          class="btn btn-danger"
          id="delete_variation"
          type="button"
          aria-label="Delete the selected variation"
        >
          Delete variation
        </button>

        <button
          class="btn"
          id="reset_form"
          type="button"
        >
          Reset
        </button>

        <button
          class="btn btn-primary"
          id="save_variation"
          type="button"
        >
          Save
        </button>

        <button
          class="btn"
          id="next_variations"
          type="button"
        >
          Save &amp; Next
        </button>

      </div>

    </div>

  </main>

  <script
    src="../../view/variations/varia/variations.js<?= $jsVersion ? '?v=' . $jsVersion : '' ?>"
  ></script>

</body>

</html>
