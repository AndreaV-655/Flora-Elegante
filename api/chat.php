<?php
// ============================================================
// ASISTENTE DEL CHATBOT (Google Gemini)
// ------------------------------------------------------------
// Recibe la conversación del navegador y devuelve la respuesta
// del modelo configurado (api/config.php, por defecto un "flash").
//
// La clave vive SOLO en el servidor; el navegador nunca la ve.
// Si no hay clave o la API falla, el error llega al navegador y
// el chatbot continúa con su lógica local por reglas.
// ============================================================
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? 'message';

switch ($action) {

    case 'message': {
        $d = body();

        $historial = $d['mensajes'] ?? [];
        if (!is_array($historial) || !$historial) json_error('Falta la conversación.', 400);

        $contexto = trim((string)($d['contexto'] ?? ''));

        if (GEMINI_API_KEY === '') {
            json_error('El asistente con IA no está configurado.', 503);
        }

        // Gemini solo admite los roles "user" y "model".
        $contents = [];
        foreach (array_slice($historial, -10) as $m) {
            $rol = (($m['role'] ?? '') === 'assistant') ? 'model' : 'user';
            $txt = trim((string)($m['content'] ?? ''));
            if (function_exists('mb_substr')) $txt = mb_substr($txt, 0, 2000);
            else $txt = substr($txt, 0, 2000);
            if ($txt !== '') $contents[] = ['role' => $rol, 'parts' => [['text' => $txt]]];
        }

        // Modelo principal + respaldos por si alguno está saturado (503).
        $modelos = array_values(array_unique(array_filter([
            GEMINI_MODEL,
            'gemini-3.5-flash',
            'gemini-3.6-flash',
            'gemini-flash-latest',
        ])));

        $resp = gemini_generate($contents, system_prompt($contexto), $modelos);
        if ($resp === null) json_error('El asistente no está disponible en este momento.', 502);

        json_out(['ok' => true, 'respuesta' => $resp]);
    }

    default:
        json_error('Acción no reconocida.', 404);
}

// ------------------------------------------------------------
// Prompt del sistema: mantiene el objetivo del chatbot
// ------------------------------------------------------------
function system_prompt(string $contexto): string {
    $base = 'Eres Flora, la asistente virtual de Flora Elegante, una florería. '
          . 'Responde siempre en el mismo idioma del cliente (español o inglés), con un tono cálido, breve y profesional. '
          . 'Ayuda con información de arreglos, precios, entregas, pagos, horarios y cuidado de las flores. '
          . 'No inventes productos, precios, descuentos ni plazos: usa solo los datos que aparecen abajo. '
          . 'Si el cliente quiere comprar, añadir al carrito, iniciar sesión o finalizar su pedido, recuérdale que puede hacerlo con los botones del chat. '
          . 'Devuelve texto plano (sin Markdown ni etiquetas HTML).';
    if ($contexto !== '') {
        $base .= "\n\nDatos del negocio y catálogo:\n" . $contexto;
    }
    return $base;
}

// ------------------------------------------------------------
// Intenta cada modelo hasta obtener una respuesta.
// ------------------------------------------------------------
function gemini_generate(array $contents, string $system, array $modelos): ?string {
    foreach ($modelos as $modelo) {
        $txt = gemini_chat($contents, $system, $modelo);
        if ($txt !== null) return $txt;
    }
    return null;
}

// ------------------------------------------------------------
// Llamada a la API de Google Gemini (generateContent)
// ------------------------------------------------------------
function gemini_chat(array $contents, string $system, string $model): ?string {
    $payload = json_encode([
        'system_instruction' => ['parts' => [['text' => $system]]],
        'contents'           => $contents,
        'generationConfig'   => [
            'temperature'     => 0.7,
            'maxOutputTokens' => 1024,
            // Desactiva el "pensamiento": respuestas más rápidas y baratas.
            'thinkingConfig'  => ['thinkingBudget' => 0],
        ],
    ], JSON_UNESCAPED_UNICODE);

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
         . rawurlencode($model) . ':generateContent?key=' . urlencode(GEMINI_API_KEY);

    $headers = ['Content-Type: application/json'];

    // Preferimos cURL (viene con XAMPP) y caemos a streams si no está.
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        $raw  = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $code < 200 || $code >= 300) {
            error_log('[chat] Gemini ' . $model . ' HTTP ' . $code . ' ' . $err . ' ' . (string)$raw);
            return null;
        }
    } else {
        $ctx = stream_context_create(['http' => [
            'method'        => 'POST',
            'header'        => implode("\r\n", $headers),
            'content'       => $payload,
            'timeout'       => 30,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false) {
            error_log('[chat] Gemini ' . $model . ' sin respuesta (streams)');
            return null;
        }
    }

    $data  = json_decode($raw, true);
    $parts = $data['candidates'][0]['content']['parts'] ?? [];

    $txt = '';
    foreach ((array)$parts as $p) {
        if (isset($p['text'])) $txt .= $p['text'];
    }
    $txt = trim($txt);

    if ($txt === '') {
        error_log('[chat] Gemini ' . $model . ' respuesta inesperada: ' . (string)$raw);
        return null;
    }
    return $txt;
}
