<?php
$supplierAuthCss = __DIR__ . '/supplier_auth.css';
$supplierAuthVersion = is_file($supplierAuthCss) ? filemtime($supplierAuthCss) : time();
?>
<link rel="stylesheet" href="../../view/global/supplier_auth/supplier_auth.css?v=<?= $supplierAuthVersion ?>">
