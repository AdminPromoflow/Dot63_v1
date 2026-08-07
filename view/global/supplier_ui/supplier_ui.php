<?php
$supplierUiCss = __DIR__ . '/supplier_ui.css';
$supplierUiVersion = is_file($supplierUiCss) ? filemtime($supplierUiCss) : time();
?>
<link rel="stylesheet" href="../../view/global/supplier_ui/supplier_ui.css?v=<?= $supplierUiVersion ?>">
