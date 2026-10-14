<?php
// ============================================================
// INTEGRACIÓN CON n8n  ·  webhook del pedido
// ------------------------------------------------------------
// Cuando se crea un pedido (orders.php) se envía un POST JSON al
// webhook de n8n configurado en N8N_WEBHOOK_URL (secretos.php).
// n8n se encarga de enviar la factura por correo al cliente.
//
// El envío NUNCA rompe la compra: si el webhook falla o no está
// configurado, el pedido ya quedó guardado y se continúa igual.
// ============================================================
require_once __DIR__ . '/db.php';

// ------------------------------------------------------------
// Envía el pedido al webhook de n8n.
// Devuelve true si n8n respondió 2xx; false en cualquier otro caso.
// Nunca lanza excepciones.
// ------------------------------------------------------------
function n8n_notificar_pedido(array $payload): bool {
    $url = defined('N8N_WEBHOOK_URL') ? trim((string)N8N_WEBHOOK_URL) : '';
    if ($url === '') return false;

    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) return false;

    // Preferimos cURL (viene con XAMPP). Con un timeout corto para no
    // demorar la confirmación de la compra si n8n no está escuchando.
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT        => 4,
        ]);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        if ($code >= 200 && $code < 300) return true;
        error_log("[n8n] el webhook respondió HTTP $code $err");
        return false;
    }

    // Respaldo sin cURL.
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\n",
        'content'       => $body,
        'timeout'       => 4,
        'ignore_errors' => true,
    ]]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) { error_log('[n8n] no se pudo enviar el webhook'); return false; }
    return true;
}