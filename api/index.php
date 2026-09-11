<?php
// ============================================================
// FRONT CONTROLLER · api/index.php?resource=xxx&action=yyy
// ------------------------------------------------------------
// Recibe peticiones JSON en /api/index.php y las delega a los
// controladores según el recurso solicitado.
//
// Ejemplos:
//   GET  api/index.php?resource=products&action=list
//   POST api/index.php?resource=auth&action=login
// ============================================================

declare(strict_types=1);
error_reporting(E_ALL);
// No mostrar errores inline para no corromper las respuestas JSON.
// Los errores sí se registran en el log de PHP de XAMPP.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Los archivos del frontend requieren que la sesión viaje por cookie.
if (session_status() === PHP_SESSION_NONE) {
    session_name('fe_session');
    session_start();
}

// Para servir el frontend desde el mismo origen (XAMPP) no se requiere
// CORS; se deja preparado por si se accede desde otro puerto/origen.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$resource = $_GET['resource'] ?? '';

// Mapa de recursos → archivo controlador
$rutas = [
    'auth'         => 'auth.php',
    'products'     => 'products.php',
    'categories'   => 'categories.php',
    'orders'       => 'orders.php',
    'dashboard'    => 'dashboard.php',
    'clientes'     => 'clientes.php',
    'interactions' => 'interactions.php',
];

if (!isset($rutas[$resource])) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'msg' => 'Recurso no encontrado.']);
    exit;
}

require_once __DIR__ . '/' . $rutas[$resource];
