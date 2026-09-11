<?php
// ============================================================
// CATEGORÍAS DE PRODUCTO
// GET list → catálogo de categorías (para formularios / filtros)
// ============================================================
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list': {
        $st = db()->query("SELECT id, nombre, nombre_en FROM categoria ORDER BY id");
        json_out(['ok' => true, 'categorias' => $st->fetchAll()]);
    }
    default:
        json_error('Acción no reconocida.', 404);
}
