<?php
// ============================================================
// CLIENTES (CRM del panel admin)
// - GET list → clientes con perfil. Datos SENSIBLES (identificación,
//   método de pago) quedan excluidos; solo se expone edad derivada.
// ============================================================
require_once __DIR__ . '/helpers.php';
require_auth(true);
$db = db();

$st = $db->query("SELECT u.nombre, u.email, u.fecha_registro,
                         cp.telefono, cp.direccion, cp.fecha_nacimiento,
                         cp.preferencias_florales
                  FROM usuario u
                  LEFT JOIN cliente_perfil cp ON cp.usuario_id = u.id
                  WHERE u.rol_id = (SELECT id FROM rol WHERE nombre = 'cliente')
                  ORDER BY u.fecha_registro DESC");

$clientes = [];
foreach ($st->fetchAll() as $c) {
    // La fecha de nacimiento (PRIVADO) nunca sale sin procesar: solo edad.
    $nacimiento = $c['fecha_nacimiento'];
    $clientes[] = [
        'nombre'        => $c['nombre'],
        'email'         => $c['email'],
        'telefono'      => $c['telefono'],
        'direccion'     => $c['direccion'],
        'nacimiento'    => $nacimiento, // el front calcula la edad; nunca se muestra fecha cruda
        'preferencias'  => $c['preferencias_florales'],
        // identificacion y metodo_pago: NO se incluyen (SENSIBLES)
    ];
}

json_out(['ok' => true, 'clientes' => $clientes]);
