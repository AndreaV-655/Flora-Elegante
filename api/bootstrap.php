<?php
// ============================================================
// BOOTSTRAP: garantiza datos mínimos para que la app funcione.
// ------------------------------------------------------------
// - Crea los roles si no existen.
// - Crea el administrador y el cliente demo con password_hash().
// - Crea el perfil del cliente demo y un par de pedidos demo.
// No toca datos ya existentes (solo crea lo que falta).
// ============================================================
require_once __DIR__ . '/db.php';

function bootstrap(): void {
    $db = db();

    // Roles
    $db->exec("INSERT IGNORE INTO rol (nombre) VALUES ('cliente'), ('administrador')");

    // Asegurar administrador demo
    $admin = $db->query("SELECT id FROM rol WHERE nombre = 'administrador'")->fetch();
    if ($admin) {
        $st = $db->prepare("SELECT id FROM usuario WHERE email = 'admin@floraelegante.mx'");
        $st->execute();
        if (!$st->fetch()) {
            $h = password_hash('Admin2025*', PASSWORD_DEFAULT);
            $db->prepare("INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)")
               ->execute(['Administrador', 'admin@floraelegante.mx', $h, $admin['id']]);
        }
    }

    // Asegurar cliente demo + perfil + pedidos demo
    $rolC = $db->query("SELECT id FROM rol WHERE nombre = 'cliente'")->fetch();
    if ($rolC) {
        $st = $db->prepare("SELECT id FROM usuario WHERE email = 'cliente@demo.mx'");
        $st->execute();
        $cliente = $st->fetch();
        if (!$cliente) {
            $h = password_hash('Cliente123*', PASSWORD_DEFAULT);
            $db->prepare("INSERT INTO usuario (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)")
               ->execute(['Cliente Demo', 'cliente@demo.mx', $h, $rolC['id']]);
            $clienteId = (int)$db->lastInsertId();

            $db->prepare("INSERT INTO cliente_perfil (usuario_id, telefono, direccion, fecha_nacimiento, preferencias_florales, identificacion, metodo_pago)
                          VALUES (?, ?, ?, ?, ?, ?, ?)")
               ->execute([$clienteId, '+52 55 1234 5678', 'Av. Reforma 512, Col. Juárez, CDMX', '1990-04-12', 'rosas', 'GARC850412MGR01', 'tarjeta_credito']);

            seedPedidosDemo($clienteId);
        }
    }
}

// Dos pedidos demo (solo se llama al crear el cliente por primera vez)
function seedPedidosDemo(int $clienteId): void {
    $db = db();

    $db->prepare("INSERT INTO pedido (cliente_id, fecha, estado, total) VALUES (?, ?, ?, ?)")
       ->execute([$clienteId, date('Y-m-d H:i:s', strtotime('-10 days')), 'Confirmado', 177000.00]);
    $p1 = (int)$db->lastInsertId();
    $db->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)")
       ->execute([$p1, 1, 1, 85000.00]);
    $db->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)")
       ->execute([$p1, 3, 1, 72000.00]);

    $db->prepare("INSERT INTO pedido (cliente_id, fecha, estado, total) VALUES (?, ?, ?, ?)")
       ->execute([$clienteId, date('Y-m-d H:i:s', strtotime('-30 days')), 'Entregado', 85000.00]);
    $p2 = (int)$db->lastInsertId();
    $db->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)")
       ->execute([$p2, 1, 1, 85000.00]);
}
