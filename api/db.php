<?php
// ============================================================
// CONEXIÓN PDO A MYSQL
// ============================================================
require_once __DIR__ . '/config.php';

// Una sola zona horaria para todo: la de TIMEZONE (api/config.php).
date_default_timezone_set(TIMEZONE);

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        // CURRENT_TIMESTAMP usa la zona del servidor, que en XAMPP suele
        // ser UTC: sin esto, pedido.fecha y date() se diferencian horas.
        try {
            $offset = (new DateTimeZone(TIMEZONE))->getOffset(new DateTime('now', new DateTimeZone('UTC')));
            $sign   = $offset < 0 ? '-' : '+';
            $abs    = abs($offset);
            $pdo->exec(sprintf(
                "SET time_zone = '%s%02d:%02d'",
                $sign,
                intdiv($abs, 3600),
                intdiv($abs % 3600, 60)
            ));
        } catch (Throwable $e) {
            // Sin zona horaria en la BD no se rompe nada, solo queda la
            // diferencia de horas en las fechas.
        }
    }
    return $pdo;
}
