<?php
// ============================================================
// GESTIÓN DE PRODUCTOS (CRUD)
// - GET  list      → catálogo (público, solo activos)
// - GET  adminList → todos incl. inactivos (admin)
// - POST create    → crear (admin)
// - POST update    → editar (admin)
// - POST delete    → eliminar (admin)
// ============================================================
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');
$db     = db();

switch ($action) {

    case 'list': {
        $st = $db->query("SELECT p.id, p.categoria_id, c.nombre AS categoria, c.nombre_en AS categoria_en,
                                 p.nombre, p.nombre_en, p.descripcion, p.descripcion_en,
                                 p.precio, p.imagen_url, p.stock, p.estado
                          FROM producto p
                          JOIN categoria c ON c.id = p.categoria_id
                          WHERE p.estado = 'activo'
                          ORDER BY p.id");
        json_out(['ok' => true, 'productos' => $st->fetchAll()]);
    }

    case 'adminList': {
        require_auth(true);
        $st = $db->query("SELECT p.id, p.categoria_id, c.nombre AS categoria, c.nombre_en AS categoria_en,
                                 p.nombre, p.nombre_en, p.descripcion, p.descripcion_en,
                                 p.precio, p.imagen_url, p.stock, p.estado
                          FROM producto p
                          JOIN categoria c ON c.id = p.categoria_id
                          ORDER BY p.id");
        json_out(['ok' => true, 'productos' => $st->fetchAll()]);
    }

    case 'create': {
        require_auth(true);
        $d = body();
        $nombre = trim($d['nombre'] ?? '');
        if (!$nombre) json_error('El nombre es obligatorio.', 400);

        $db->prepare("INSERT INTO producto (categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, imagen_url, stock, estado)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
           ->execute([
               (int)($d['categoria_id'] ?? 1),
               $nombre,
               trim($d['nombre_en'] ?? ''),
               $d['descripcion'] ?? '',
               $d['descripcion_en'] ?? '',
               (float)($d['precio'] ?? 0),
               $d['imagen_url'] ?? '',
               (int)($d['stock'] ?? 0),
               ($d['estado'] ?? 'activo') === 'inactivo' ? 'inactivo' : 'activo',
           ]);
        json_out(['ok' => true, 'id' => (int)$db->lastInsertId()]);
    }

    case 'update': {
        require_auth(true);
        $d = body();
        $id = (int)($d['id'] ?? 0);
        if (!$id) json_error('ID de producto requerido.', 400);

        $db->prepare("UPDATE producto SET categoria_id = ?, nombre = ?, nombre_en = ?, descripcion = ?,
                       descripcion_en = ?, precio = ?, imagen_url = ?, stock = ?, estado = ? WHERE id = ?")
           ->execute([
               (int)($d['categoria_id'] ?? 1),
               trim($d['nombre'] ?? ''),
               trim($d['nombre_en'] ?? ''),
               $d['descripcion'] ?? '',
               $d['descripcion_en'] ?? '',
               (float)($d['precio'] ?? 0),
               $d['imagen_url'] ?? '',
               (int)($d['stock'] ?? 0),
               ($d['estado'] ?? 'activo') === 'inactivo' ? 'inactivo' : 'activo',
               $id,
           ]);
        json_out(['ok' => true]);
    }

    case 'update_stock': {
        require_auth(true);
        $d = body();
        $id = (int)($d['id'] ?? 0);
        $stock = max(0, (int)($d['stock'] ?? 0));
        $db->prepare("UPDATE producto SET stock = ? WHERE id = ?")->execute([$stock, $id]);
        json_out(['ok' => true]);
    }

    case 'delete': {
        require_auth(true);
        $d = body();
        $id = (int)($d['id'] ?? 0);
        $db->prepare("DELETE FROM producto WHERE id = ?")->execute([$id]);
        json_out(['ok' => true]);
    }

    default:
        json_error('Acción no reconocida.', 404);
}
