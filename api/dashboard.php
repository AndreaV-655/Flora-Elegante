<?php
// ============================================================
// PANEL ADMINISTRATIVO · estadísticas del negocio
// - Cantidad de usuarios
// - Cantidad de productos
// - Productos con inventario bajo (alerta)
// - Cantidad de pedidos
// - Últimos pedidos registrados
// - Estado de los pedidos
// ============================================================
require_once __DIR__ . '/helpers.php';
require_auth(true);
$db = db();

// Umbral para considerar inventario "bajo"
$UMBRAL = 5;

$usuarios        = (int)$db->query("SELECT COUNT(*) FROM usuario WHERE rol_id = (SELECT id FROM rol WHERE nombre = 'cliente')")->fetchColumn();
$productosTotal  = (int)$db->query("SELECT COUNT(*) FROM producto")->fetchColumn();
$productosActivos= (int)$db->query("SELECT COUNT(*) FROM producto WHERE estado = 'activo'")->fetchColumn();
$pedidosTotal    = (int)$db->query("SELECT COUNT(*) FROM pedido")->fetchColumn();

// Productos con inventario bajo
$st = $db->prepare("SELECT id, nombre, nombre_en, stock, imagen_url, precio FROM producto
                    WHERE stock <= ? AND estado = 'activo' ORDER BY stock ASC");
$st->execute([$UMBRAL]);
$inventarioBajo = $st->fetchAll();

// Estado de los pedidos (conteo por estado)
$st = $db->query("SELECT estado, COUNT(*) AS total FROM pedido GROUP BY estado");
$estados = [];
foreach ($st->fetchAll() as $e) $estados[$e['estado']] = (int)$e['total'];

// Últimos pedidos registrados (los 5 más recientes)
$st = $db->query("SELECT pe.id, pe.fecha, pe.estado, pe.total, u.nombre, u.email
                  FROM pedido pe JOIN usuario u ON u.id = pe.cliente_id
                  ORDER BY pe.id DESC LIMIT 5");
$ultimos = $st->fetchAll();

json_out([
    'ok' => true,
    'usuarios'         => $usuarios,
    'productos_total'  => $productosTotal,
    'productos_activos'=> $productosActivos,
    'pedidos_total'    => $pedidosTotal,
    'inventario_bajo'  => $inventarioBajo,
    'umbral_inventario'=> $UMBRAL,
    'estados'          => $estados,
    'ultimos_pedidos'  => $ultimos,
]);
