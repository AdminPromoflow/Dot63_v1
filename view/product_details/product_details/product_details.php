<?php
$cssFs = __DIR__ . '/product_details.css';
$jsFs  = __DIR__ . '/product_details.js';

$cssTime = is_file($cssFs) ? filemtime($cssFs) : time();
$jsTime  = is_file($jsFs)  ? filemtime($jsFs)  : time();
?>

<link
  rel="stylesheet"
  href="../../view/product_details/product_details/product_details.css?v=<?= $cssTime ?>"
>

<!-- =============== Create Product: Product Details Tab =============== -->
<main class="create_product" aria-labelledby="pd-title">

  <h1 id="pd-title" class="sr-only">
    Create Product — Product Details
  </h1>

  <!-- Product creation tabs -->
  <?php include "../../view/global/header_add_product/header_add_product.php"; ?>

  <!-- Product details content -->
  <section class="cp-card" aria-labelledby="cp-pd-title">

    <header class="cp-card-header">
      <h2 id="cp-pd-title">Product details</h2>
    </header>

    <!-- Product details form -->
    <form
      id="productDetailsForm"
      class="cp-form"
      autocomplete="off"
      novalidate
    >

      <!-- Product name -->
      <div class="cp-field">

        <label class="cp-label" for="pd_name">
          Name
        </label>

        <input
          id="pd_name"
          name="name"
          type="text"
          maxlength="150"
          placeholder="e.g., Premium Polyester Lanyard"
          aria-describedby="pd_name_help"
        >

        <small id="pd_name_help" class="cp-hint">
          Up to 150 characters.
        </small>

      </div>

      <!-- Product status -->
      <div class="cp-field">

        <label class="cp-label" for="pd_status">
          Status
        </label>

        <select
          id="pd_status"
          name="status"
          aria-describedby="pd_status_help"
        >
          <option value="0">Draft</option>
          <option value="1">Published</option>
          <option value="2">Configurable product</option>
          <option value="3">Separate combinations</option>
        </select>

        <small id="pd_status_help" class="cp-hint">
          Changes are sent to Promoflow for approval. The current status stays in effect until approved.
        </small>

      </div>

      <!-- Descriptive tagline -->
      <div class="cp-field cp-field-full">

        <label class="cp-label" for="pd_tagline">
          Descriptive tagline
        </label>

        <input
          id="pd_tagline"
          name="descriptive_tagline"
          type="text"
          maxlength="160"
          placeholder="e.g., Ideal for events, offices and schools with full colour printing."
          aria-describedby="pd_tagline_help"
        >

        <small id="pd_tagline_help" class="cp-hint">
          Short tagline shown in product cards and listings.
          Up to 160 characters.
        </small>

      </div>

      <!-- Product description -->
      <div class="cp-field cp-field-full">

        <label class="cp-label" for="pd_desc">
          Description
        </label>

        <textarea
          id="pd_desc"
          name="description"
          rows="6"
          placeholder="Short, compelling summary of the product features and materials…"
          aria-describedby="pd_desc_help pd_desc_count"
        ></textarea>

      </div>

      <div id="pd_approval_state" class="cp-field cp-field-full cp-hint" aria-live="polite"></div>
    </form>

  </section>

  <!-- Footer buttons -->
  <div class="cp-footer">

    <div id="pd_feedback" class="pd-feedback" role="status" aria-live="polite" aria-atomic="true" hidden></div>

    <!-- Left footer section -->
    <div class="cp-footer-left">

      <button
        id="btn_back_product_details"
        class="btn-back"
        type="button"
        aria-label="Back to Groups"
      >
        ← Back
      </button>

      <button
        id="delete_product"
        class="btn btn-delete-product"
        type="button"
      >
        Delete product
      </button>

    </div>

    <!-- Right footer section -->
    <div class="cp-footer-actions">

      <button
        id="reset"
        class="btn btn-danger"
        type="button"
      >
        Reset
      </button>

      <button
        id="save"
        class="btn btn-primary"
        type="button"
      >
        Save
      </button>

      <button
        id="next_product_details"
        class="btn"
        type="button"
      >
        Save &amp; Next
      </button>

    </div>

  </div>

</main>

<script
  src="../../view/product_details/product_details/product_details.js?v=<?= $jsTime ?>"
></script>
