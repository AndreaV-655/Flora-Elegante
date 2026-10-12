<?php
// ============================================================
// CONFIGURACIÓN DE LA BASE DE DATOS (MySQL / XAMPP)
// ------------------------------------------------------------
// Valores por defecto de XAMPP: usuario "root", sin contraseña.
// Si configuraste otra clave, cámbiala aquí.
// ============================================================

const DB_HOST = 'localhost';
const DB_NAME = 'flora_elegante';
const DB_USER = 'root';
const DB_PASS = '';
const DB_CHARSET = 'utf8mb4';

// ============================================================
// ZONA HORARIA DEL NEGOCIO
// ------------------------------------------------------------
// PHP y MySQL deben usar la misma zona o las fechas no cuadran
// (por ejemplo, la hora del pedido en la BD contra la del recibo).
// Cámbiala si operas en otra país; el desplazamiento de MySQL se
// calcula solo a partir de esta misma constante.
const TIMEZONE = 'America/Bogota';

// ============================================================
// ASISTENTE CON IA (Google Gemini)
// ------------------------------------------------------------
// La clave real vive en "secretos.php", un archivo LOCAL que NO
// se sube a git (ver .gitignore). Aquí quedan solo los valores por
// defecto por si ese archivo no existe todavía.
//
// Si GEMINI_API_KEY queda vacía, el chatbot funciona igual con su
// lógica local por reglas. Consíguela gratis en
// https://aistudio.google.com/apikey
// ============================================================
if (is_file(__DIR__ . '/secretos.php')) {
    require_once __DIR__ . '/secretos.php';
}
if (!defined('GEMINI_API_KEY')) define('GEMINI_API_KEY', '');
if (!defined('GEMINI_MODEL'))   define('GEMINI_MODEL', 'gemini-3.5-flash');
