<?php
// ============================================================
// INTENTOS DE INICIO DE SESIÓN
// ------------------------------------------------------------
// Cada intento (éxito o fallo) queda registrado en la tabla
// `intento_login` como bitácora de seguridad.
//
// Todo es defensivo: si la tabla no existe, el login sigue
// funcionando con normalidad.
// ============================================================
require_once __DIR__ . '/db.php';

// ------------------------------------------------------------
// Registro de intentos
// ------------------------------------------------------------
function login_registrar(string $email, bool $exito): void {
    try {
        db()->prepare("INSERT INTO intento_login (email, ip, exito, user_agent) VALUES (?, ?, ?, ?)")
            ->execute([
                mb_substr($email !== '' ? $email : '(vacío)', 0, 150),
                login_ip(),
                $exito ? 1 : 0,
                login_agente(),
            ]);
    } catch (Throwable $e) {
        // Sin tabla intento_login: no se registra y el login no falla.
    }
}

// ------------------------------------------------------------
// Datos de la petición (solo lo que cabe en la tabla)
// ------------------------------------------------------------
function login_ip(): string {
    return mb_substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

function login_agente(): string {
    return mb_substr((string)($_SERVER['USER_AGENT'] ?? $_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
}