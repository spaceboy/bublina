<?php
/**
 * Náhražka plnokrevného REST API;
 * pro naše účely na dané platformě postačí
 */
error_reporting(0);

require_once('CImageURL.php');

$image  = new ImageURL();

// Místo front-controlleru:
if (array_key_exists('url', $_GET)) {
    // Pokud máme v GET parametru URL obrázku:
    if (array_key_exists('full', $_GET) && $_GET['full'] == '1') {
        $image->setFull(TRUE);
    }
    $image->setImageUrl($_GET['url']);
} elseif (array_key_exists('dataUrl', $_POST)) {
    // Pokud máme v POST parametru dataURL obrázku:
    $image->setImageDataUrl($_POST['dataUrl']);
}

// Vrátíme výsledek:
$image->writeJSON();
