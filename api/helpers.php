<?php
// ============================================================
// FUNCIONES AUXILIARES: JSON, sesión y autorización
// ============================================================
require_once __DIR__ . '/db.php';

// Responde JSON y termina
function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $msg, int $code = 400): void {
    json_out(['ok' => false, 'msg' => $msg], $code);
}

// Lee el cuerpo JSON de la petición
function body(): array {
    $raw = file_get_contents('php://input');
    $d = json_decode($raw, true);
    return is_array($d) ? $d : $_POST;
}

// Lee el usuario autenticado desde la sesión PHP
function usuario_actual(): ?array {
    if (session_status() === PHP_SESSION_NONE) session_start();
    return $_SESSION['usuario'] ?? null;
}

// Requiere estar autenticado; si no, responde 401
function require_auth(bool $admin = false): array {
    $u = usuario_actual();
    if (!$u) json_error('No autorizado. Inicia sesión.', 401);
    if ($admin && $u['rol'] !== 'administrador') json_error('Acceso restringido a administradores.', 403);
    return $u;
}
