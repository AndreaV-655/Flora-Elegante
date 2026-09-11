<?php
// ============================================================
// PEDIDOS
// - POST create      → crear pedido (cliente): valida inventario y
//                      actualiza stock del producto para el que se compró.
// - GET  list        → historial del cliente autenticado.
// - GET  adminList   → todos los pedidos (admin) con detalle y cliente.
// - POST updateEstado→ cambiar estado (admin).
// ============================================================
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');
$db     = db();

function detalle_pedido(int $id, PDO $db): array {
    $st = $db->prepare("SELECT pd.producto_id, p.nombre, p.nombre_en, p.imagen_url,
                               pd.cantidad, pd.precio_unitario
                        FROM pedido_detalle pd
                        JOIN producto p ON p.id = pd.producto_id
                        WHERE pd.pedido_id = ?");
    $st->execute([$id]);
    return $st->fetchAll();
}

switch ($action) {

    case 'create': {
        $u = require_auth();
        $d  = body();
        $items = $d['items'] ?? [];
        if (!$items || !is_array($items)) json_error('El pedido no tiene productos.', 400);

        try {
            $db->beginTransaction();

            // Validar stock de cada producto y calcular el total
            $total = 0.0;
            $productos = [];
            foreach ($items as $it) {
                $pid  = (int)($it['id'] ?? 0);
                $qty  = (int)($it['qty'] ?? 0);
                if ($pid <= 0 || $qty <= 0) json_error('Producto o cantidad no válido.', 400);

                $st = $db->prepare("SELECT id, precio, stock FROM producto WHERE id = ? FOR UPDATE");
                $st->execute([$pid]);
                $p = $st->fetch();
                if (!$p) json_error('Producto no encontrado.', 400);
                if ($p['stock'] < $qty) {
                    $db->rollBack();
                    json_error('Stock insuficiente para uno de los productos. Verifica tu carrito.', 400);
                }
                $total += (float)$p['precio'] * $qty;
                $productos[] = ['p' => $p, 'qty' => $qty];
            }

            // Crear el pedido
            $db->prepare("INSERT INTO pedido (cliente_id, estado, total) VALUES (?, 'Confirmado', ?)")
               ->execute([$u['id'], $total]);
            $pedidoId = (int)$db->lastInsertId();

            // Detalles + actualizar inventario
            $stDet = $db->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
            $stUpd = $db->prepare("UPDATE producto SET stock = stock - ? WHERE id = ?");
            foreach ($productos as $it) {
                $stDet->execute([$pedidoId, $it['p']['id'], $it['qty'], $it['p']['precio']]);
                $stUpd->execute([$it['qty'], $it['p']['id']]);
            }

            $db->commit();
            json_out(['ok' => true, 'pedido' => ['id' => $pedidoId, 'total' => $total, 'estado' => 'Confirmado']]);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
    }

    case 'list': {
        $u = require_auth();
        $st = $db->prepare("SELECT id, fecha, estado, total FROM pedido WHERE cliente_id = ? ORDER BY id DESC");
        $st->execute([$u['id']]);
        $pedidos = [];
        foreach ($st->fetchAll() as $ped) {
            $ped['items'] = detalle_pedido((int)$ped['id'], $db);
            $ped['email'] = $u['email'];
            $pedidos[] = $ped;
        }
        json_out(['ok' => true, 'pedidos' => $pedidos]);
    }

    case 'adminList': {
        require_auth(true);
        $st = $db->query("SELECT pe.id, pe.cliente_id, pe.fecha, pe.estado, pe.total,
                                 u.nombre, u.email
                          FROM pedido pe
                          JOIN usuario u ON u.id = pe.cliente_id
                          ORDER BY pe.id DESC");
        $pedidos = [];
        foreach ($st->fetchAll() as $ped) {
            $ped['items'] = detalle_pedido((int)$ped['id'], $db);
            $pedidos[] = $ped;
        }
        json_out(['ok' => true, 'pedidos' => $pedidos]);
    }

    case 'updateEstado': {
        require_auth(true);
        $d = body();
        $id = (int)($d['id'] ?? 0);
        $estado = trim($d['estado'] ?? '');
        $permitidos = ['Confirmado', 'En camino', 'Entregado', 'Cancelado'];
        if (!in_array($estado, $permitidos, true)) json_error('Estado no válido.', 400);
        $db->prepare("UPDATE pedido SET estado = ? WHERE id = ?")->execute([$estado, $id]);
        json_out(['ok' => true]);
    }

    default:
        json_error('Acción no reconocida.', 404);
}
