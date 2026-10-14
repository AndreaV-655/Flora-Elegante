<?php
// ============================================================
// PEDIDOS
// - POST create      → crear pedido (cliente): valida inventario y
//                      actualiza stock del producto para el que se compró.
//                      Luego genera el recibo con su código único.
// - GET  list        → historial del cliente autenticado.
// - GET  adminList   → todos los pedidos (admin) con detalle y cliente.
// - POST updateEstado→ cambiar estado (admin).
// ============================================================
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/recibo.php';
require_once __DIR__ . '/n8n.php';

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

// Valida la fecha/hora de entrega contra el horario del negocio:
// lunes a sábado 8:00-20:00 y domingo 9:00-14:00. Debe ser futura.
// Devuelve el valor normalizado ('Y-m-d H:i:s') o null si no es válida.
function entrega_normalizar(?string $valor): ?string {
    $valor = trim((string)$valor);
    if ($valor === '') return null;

    $dt = DateTime::createFromFormat('Y-m-d H:i', $valor)
        ?: DateTime::createFromFormat('Y-m-d\TH:i', $valor)
        ?: DateTime::createFromFormat('Y-m-d H:i:s', $valor);
    if (!$dt) return null;

    $dow    = (int)$dt->format('w');           // 0 = domingo
    $abre   = $dow === 0 ? 9 : 8;              // dom 9:00 · lun-sáb 8:00
    $cierra = $dow === 0 ? 14 : 20;            // dom 14:00 · lun-sáb 20:00
    $hora   = (int)$dt->format('G');

    if ($hora < $abre || $hora >= $cierra) return null;
    if ($dt <= new DateTime()) return null;

    return $dt->format('Y-m-d H:i:s');
}

// Tipo de ocasión especial: se normaliza a un identificador corto
// ('cumpleanos', 'aniversario', 'otro') para guardarlo y enviarlo a n8n.
function ocasion_normalizar(?string $valor): ?string {
    $v = strtolower(trim((string)$valor));
    if ($v === '') return null;
    $v = strtr($v, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n']);
    $map = [
        'cumpleanos' => 'cumpleanos', 'cumple' => 'cumpleanos', 'birthday' => 'cumpleanos',
        'aniversario' => 'aniversario', 'anniversary' => 'aniversario',
        'otro' => 'otro', 'otra' => 'otro', 'other' => 'otro',
    ];
    if (isset($map[$v])) return $map[$v];
    return mb_substr(trim((string)$valor), 0, 40) ?: null;
}

// Fecha exacta de la ocasión (fecha sola o con hora). Devuelve 'Y-m-d H:i:s'
// o null. Se guarda a medianoche cuando el cliente solo elige el día.
// Nota: se usa el prefijo '!' para que los campos no indicados (hora) NO se
// rellenen con la hora actual, y se exige que el formato coincida del todo.
function fecha_ocasion_normalizar(?string $valor): ?string {
    $valor = trim((string)$valor);
    if ($valor === '') return null;

    foreach (['Y-m-d H:i:s', 'Y-m-d\TH:i:s', 'Y-m-d H:i', 'Y-m-d\TH:i', 'Y-m-d'] as $fmt) {
        $dt  = DateTime::createFromFormat('!' . $fmt, $valor);
        $err = DateTime::getLastErrors();
        $limpio = ($err === false) || ($err['warning_count'] === 0 && $err['error_count'] === 0);
        if ($dt instanceof DateTime && $limpio) {
            return $dt->format('Y-m-d H:i:s');
        }
    }
    return null;
}

// Teléfono: se conserva el formato escrito; se exige entre 7 y 15 dígitos.
// Devuelve '' si viene vacío; null si es inválido (lo decide el llamador).
function telefono_normalizar(?string $valor): ?string {
    $v = trim((string)$valor);
    if ($v === '') return '';
    $digitos = preg_replace('/\D/', '', $v);
    if (strlen($digitos) < 7 || strlen($digitos) > 15) return null;
    return $v;
}

switch ($action) {

    case 'create': {
        $u = require_auth();
        $d  = body();
        $items = $d['items'] ?? [];
        if (!$items || !is_array($items)) json_error('El pedido no tiene productos.', 400);

        // Fecha y hora de entrega: obligatoria y dentro del horario del negocio.
        $entrega = entrega_normalizar($d['entrega'] ?? null);
        if (!$entrega) {
            json_error('Elige una fecha y hora de entrega válidas (lun-sáb 8:00-20:00, dom 9:00-14:00).', 400);
        }

        // ¿Es para una ocasión especial (cumpleaños, aniversario...)?
        // Si sí: se guarda el tipo y la fecha exacta de la ocasión (si no la
        // envían, se usa el día de la entrega). Si no: todo queda NULL.
        $evento      = !empty($d['evento']);
        $ocasion     = $evento ? ocasion_normalizar($d['ocasion'] ?? null) : null;
        $fechaOc     = $evento ? fecha_ocasion_normalizar($d['fechaOcasion'] ?? null) : null;
        $fechaEvento = $evento ? ($fechaOc ?: substr($entrega, 0, 10) . ' 00:00:00') : null;

        // Dedicatoria para la tarjeta (opcional).
        $dedicatoria = mb_substr(trim((string)($d['dedicatoria'] ?? '')), 0, 500);

        // Teléfono de contacto: el del pedido o, si no lo envían, el del perfil.
        $telefono = telefono_normalizar($d['telefono'] ?? null);
        if ($telefono === null) {
            json_error('Ingresa un teléfono válido (entre 7 y 15 dígitos).', 400);
        }
        if ($telefono === '') {
            $stTel = $db->prepare("SELECT telefono FROM cliente_perfil WHERE usuario_id = ?");
            $stTel->execute([$u['id']]);
            $telefono = (string)($stTel->fetchColumn() ?: '');
        }

        try {
            $db->beginTransaction();

            // Validar stock de cada producto y calcular el total
            $total = 0.0;
            $productos = [];
            foreach ($items as $it) {
                $pid  = (int)($it['id'] ?? 0);
                $qty  = (int)($it['qty'] ?? 0);
                if ($pid <= 0 || $qty <= 0) json_error('Producto o cantidad no válido.', 400);

                $st = $db->prepare("SELECT id, nombre, nombre_en, precio, stock FROM producto WHERE id = ? FOR UPDATE");
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
            $db->prepare("INSERT INTO pedido (cliente_id, estado, total, entrega, fecha_evento, dedicatoria, ocasion) VALUES (?, 'Confirmado', ?, ?, ?, ?, ?)")
               ->execute([$u['id'], $total, $entrega, $fechaEvento, $dedicatoria !== '' ? $dedicatoria : null, $ocasion]);
            $pedidoId = (int)$db->lastInsertId();

            // Detalles + actualizar inventario
            $stDet = $db->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
            $stUpd = $db->prepare("UPDATE producto SET stock = stock - ? WHERE id = ?");
            foreach ($productos as $it) {
                $stDet->execute([$pedidoId, $it['p']['id'], $it['qty'], $it['p']['precio']]);
                $stUpd->execute([$it['qty'], $it['p']['id']]);
            }

            $db->commit();

            // ----- Recibo con código único -----
            // Se hace fuera de la transacción: el pedido ya está guardado.
            $lineas = [];
            foreach ($productos as $it) {
                $lineas[] = [
                    'productoId'     => (int)$it['p']['id'],
                    'nombre'         => (string)$it['p']['nombre'],
                    'nombreEn'       => (string)$it['p']['nombre_en'],
                    'cantidad'       => (int)$it['qty'],
                    'precioUnitario' => (float)$it['p']['precio'],
                    'subtotal'       => (float)$it['p']['precio'] * (int)$it['qty'],
                ];
            }

            $recibo = recibo_generar($pedidoId, $lineas);

            // Guardar el teléfono en el perfil del cliente (best-effort).
            if ($telefono !== '') {
                try {
                    $db->prepare("INSERT INTO cliente_perfil (usuario_id, telefono) VALUES (?, ?)
                                  ON DUPLICATE KEY UPDATE telefono = VALUES(telefono)")
                       ->execute([$u['id'], $telefono]);
                } catch (Throwable $e) {
                    error_log('[pedido] no se pudo guardar el teléfono del perfil: ' . $e->getMessage());
                }
            }

            // Notificar a n8n (envío de la factura por correo). El pedido ya
            // está guardado: si n8n falla, la compra no se ve afectada.
            n8n_notificar_pedido([
                'tipo'            => 'pedido.creado',
                'origen'          => 'flora-elegante',
                'idioma'          => (string)($d['lang'] ?? 'es'),
                'pedido'          => [
                    'id'           => $pedidoId,
                    'codigo'       => $recibo['codigo'],
                    'estado'       => 'Confirmado',
                    'fecha'        => date('Y-m-d H:i:s'),
                    'total'        => $total,
                    'entrega'      => $entrega,
                    'evento'       => $evento,
                    'ocasion'      => $ocasion,
                    'fecha_evento' => $fechaEvento,
                    'dedicatoria'  => $dedicatoria !== '' ? $dedicatoria : null,
                ],
                'cliente'         => [
                    'id'       => (int)$u['id'],
                    'nombre'   => (string)$u['nombre'],
                    'email'    => (string)$u['email'],
                    'telefono' => $telefono !== '' ? $telefono : null,
                ],
                'flor_solicitada' => implode(', ', array_map(fn($l) => $l['nombre'], $lineas)),
                'items'           => array_map(fn($l) => [
                    'producto_id'     => $l['productoId'],
                    'nombre'          => $l['nombre'],
                    'nombre_en'       => $l['nombreEn'],
                    'cantidad'        => $l['cantidad'],
                    'precio_unitario' => $l['precioUnitario'],
                    'subtotal'        => $l['subtotal'],
                ], $lineas),
                'recibo'          => $recibo,
            ]);

            json_out([
                'ok' => true,
                'pedido' => [
                    'id'     => $pedidoId,
                    'total'  => $total,
                    'estado' => 'Confirmado',
                    'codigo' => $recibo['codigo'],
                    'entrega'=> $entrega,
                    'fecha_evento' => $fechaEvento,
                    'ocasion' => $ocasion,
                    'dedicatoria' => $dedicatoria !== '' ? $dedicatoria : null,
                ],
                'recibo' => $recibo,
            ]);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
    }

    case 'list': {
        $u = require_auth();
        $st = $db->prepare("SELECT id, fecha, estado, total, codigo, entrega, fecha_evento, dedicatoria, ocasion
                            FROM pedido WHERE cliente_id = ? ORDER BY id DESC");
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
                                 pe.codigo, pe.entrega, pe.fecha_evento, pe.dedicatoria, pe.ocasion,
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
