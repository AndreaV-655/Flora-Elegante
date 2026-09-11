<?php
// ============================================================
// INTERACCIONES (chatbot) · base del reporte mensual
// - GET list      → todas (admin)
// - POST save     → guardar una interacción (público/anónimo)
// ============================================================
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');
$db     = db();

switch ($action) {

    case 'list': {
        require_auth(true);
        $st = $db->query("SELECT id, usuario_id, canal, fecha, calificacion, sugerencia
                          FROM interaccion ORDER BY id DESC");
        json_out(['ok' => true, 'interacciones' => $st->fetchAll()]);
    }

    case 'save': {
        $d = body();
        $u = usuario_actual();
        $cal = (int)($d['calificacion'] ?? 0);
        $sug = trim($d['sugerencia'] ?? '');
        if ($cal < 1 || $cal > 5) $cal = null;

        $db->prepare("INSERT INTO interaccion (usuario_id, canal, calificacion, sugerencia) VALUES (?, 'chatbot', ?, ?)")
           ->execute([$u['id'] ?? null, $cal, $sug !== '' ? $sug : null]);
        json_out(['ok' => true, 'id' => (int)$db->lastInsertId()]);
    }

    default:
        json_error('Acción no reconocida.', 404);
}
