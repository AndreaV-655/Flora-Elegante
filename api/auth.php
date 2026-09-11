<?php
// ============================================================
// AUTENTICACIÓN: login, registro, sesión, perfil
// ============================================================
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/bootstrap.php';

// Garantiza (solo crea lo que falte) roles, admin y cliente demo con sus
// pedidos de ejemplo. Sin esto, con una BD recién importada no habría
// cuentas para iniciar sesión.
bootstrap();

$action = $_GET['action'] ?? ($_POST['action'] ?? 'me');

switch ($action) {

    case 'login': {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $d = body();
        $email = strtolower(trim($d['email'] ?? ''));
        $pass  = $d['password'] ?? '';

        $st = db()->prepare("SELECT u.id, u.nombre, u.email, u.password_hash, r.nombre AS rol
                             FROM usuario u JOIN rol r ON r.id = u.rol_id
                             WHERE u.email = ? AND u.activo = 1");
        $st->execute([$email]);
        $u = $st->fetch();
        if (!$u || !password_verify($pass, $u['password_hash'])) {
            json_error('Correo o contraseña incorrectos.', 401);
        }

        $_SESSION['usuario'] = [
            'id'     => (int)$u['id'],
            'nombre' => $u['nombre'],
            'email'  => $u['email'],
            'rol'    => $u['rol'],
        ];
        db()->prepare("UPDATE usuario SET ultimo_acceso = NOW() WHERE id = ?")->execute([$u['id']]);

        json_out(['ok' => true, 'usuario' => $_SESSION['usuario']]);
    }

    case 'register': {
        $d = body();
        $nombre = trim($d['nombre'] ?? '');
        $email  = strtolower(trim($d['email'] ?? ''));
        $pass   = $d['password'] ?? '';

        if (!$nombre || !$email || !$pass) json_error('Completa todos los campos obligatorios.', 400);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_error('Correo electrónico no válido.', 400);
        if (strlen($pass) < 8 || !preg_match('/[A-Z]/', $pass) || !preg_match('/[a-z]/', $pass) || !preg_match('/\d/', $pass)) {
            json_error('La contraseña debe tener 8+ caracteres con mayúscula, minúscula y número.', 400);
        }

        $db = db();
        $st = $db->prepare("SELECT id FROM usuario WHERE email = ?");
        $st->execute([$email]);
        if ($st->fetch()) json_error('Ya existe una cuenta con ese correo.', 409);

        $st = $db->prepare("SELECT id FROM rol WHERE nombre = 'cliente'");
        $st->execute();
        $rol = $st->fetch();

        $db->prepare("INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)")
           ->execute([$nombre, $email, password_hash($pass, PASSWORD_DEFAULT), $rol['id']]);
        $userId = (int)$db->lastInsertId();

        // Perfil opcional
        $db->prepare("INSERT INTO cliente_perfil (usuario_id, telefono, direccion, fecha_nacimiento, preferencias_florales, identificacion, metodo_pago)
                      VALUES (?, ?, ?, ?, ?, ?, ?)")
           ->execute([
               $userId,
               $d['telefono'] ?? null,
               $d['direccion'] ?? null,
               $d['nacimiento'] ?: null,
               $d['preferencias'] ?? null,
               $d['identificacion'] ?? null,
               $d['pago'] ?? null,
           ]);

        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION['usuario'] = ['id' => $userId, 'nombre' => $nombre, 'email' => $email, 'rol' => 'cliente'];

        json_out(['ok' => true, 'usuario' => $_SESSION['usuario']]);
    }

    case 'me': {
        $u = usuario_actual();
        if (!$u) json_error('Sin sesión.', 401);
        json_out(['ok' => true, 'usuario' => $u]);
    }

    case 'logout': {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
        json_out(['ok' => true]);
    }

    case 'profile': {
        $u = require_auth();
        $db = db();
        $st = $db->prepare("SELECT telefono, direccion, fecha_nacimiento, preferencias_florales, metodo_pago
                            FROM cliente_perfil WHERE usuario_id = ?");
        $st->execute([$u['id']]);
        $perfil = $st->fetch() ?: [];
        json_out(['ok' => true, 'nombre' => $u['nombre'], 'email' => $u['email'], 'perfil' => $perfil]);
    }

    case 'update_perfil': {
        $u = require_auth();
        $d = body();
        $db = db();

        if (!empty($d['nombre'])) {
            $db->prepare("UPDATE usuario SET nombre = ? WHERE id = ?")->execute([trim($d['nombre']), $u['id']]);
            $_SESSION['usuario']['nombre'] = trim($d['nombre']);
        }

        $db->prepare("INSERT INTO cliente_perfil (usuario_id, telefono, direccion, fecha_nacimiento, preferencias_florales, identificacion, metodo_pago)
                      VALUES (?, ?, ?, ?, ?, ?, ?)
                      ON DUPLICATE KEY UPDATE telefono = VALUES(telefono), direccion = VALUES(direccion),
                        fecha_nacimiento = VALUES(fecha_nacimiento), preferencias_florales = VALUES(preferencias_florales),
                        metodo_pago = VALUES(metodo_pago)")
           ->execute([
               $u['id'],
               $d['telefono'] ?? null,
               $d['direccion'] ?? null,
               $d['nacimiento'] ?: null,
               $d['preferencias'] ?? null,
               $d['identificacion'] ?? null,
               $d['pago'] ?? null,
           ]);

        json_out(['ok' => true]);
    }

    case 'update_password': {
        $u = require_auth();
        $d = body();
        $nueva = $d['newPassword'] ?? '';
        if (strlen($nueva) < 8 || !preg_match('/[A-Z]/', $nueva) || !preg_match('/[a-z]/', $nueva) || !preg_match('/\d/', $nueva)) {
            json_error('La nueva contraseña no cumple los requisitos.', 400);
        }
        db()->prepare("UPDATE usuario SET password_hash = ? WHERE id = ?")
           ->execute([password_hash($nueva, PASSWORD_DEFAULT), $u['id']]);
        json_out(['ok' => true]);
    }

    default:
        json_error('Acción no reconocida.', 404);
}
