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
// NOTA
// ------------------------------------------------------------
// El envío de correo del recibo se retiró: el recibo solo genera su
// código único y se muestra al cliente en pantalla.
// ============================================================
