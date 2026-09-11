# 🌸 Flora Elegante

Sitio web para una florería que comercializa arreglos florales, recopila datos de clientes
clasificados (públicos, semiprivados, privados y sensibles), incluye chatbot de atención,
carrito/pedidos, inventario y panel de administración. Backend **PHP + MySQL** (XAMPP).

## Estructura del proyecto

```
flora-elegante/
├── index.html              → Sitio público (hero, catálogo, carrito, registro, nosotros, chatbot)
├── login.html              → Inicio de sesión (clientes y administradores)
├── admin.html              → Panel de administración (dashboard, productos, pedidos, reporte, CRM)
├── css/
│   └── styles.css          → Estilos personalizados
├── js/
│   ├── tailwind-config.js  → Configuración de Tailwind (colores/fuentes de la marca)
│   ├── data.js             → Catálogo semilla (sincronizado con la BD en tiempo real)
│   ├── api.js              → Capa de datos conectada al backend (api/index.php)
│   ├── ui.js               → Toasts, pétalos, reveal on scroll, menú móvil
│   ├── auth.js             → Login/registro/logout con sesión del backend + roles
│   ├── catalog.js          → Renderizado del catálogo
│   ├── cart.js             → Carrito con validación de stock y creación de pedidos
│   ├── historial.js        → Historial de pedidos del cliente
│   ├── admin.js            → Panel: dashboard, CRUD productos, gestión de pedidos
│   ├── form.js             → Formulario de registro/perfil con clasificación de datos
│   ├── chatbot.js          → Chatbot (conversación → calificación → sugerencia)
│   ├── report.js           → Reporte mensual + CRM de clientes
│   ├── i18n.js             → Traducciones ES/EN
│   └── main.js             → Arranque por página
├── api/                    → Backend PHP (front controller api/index.php)
│   ├── config.php, db.php, helpers.php, bootstrap.php
│   ├── index.php           → `api/index.php?resource=...&action=...`
│   ├── auth.php            → login/register/me/perfil
│   ├── products.php        → CRUD productos + inventario (admin)
│   ├── categories.php      → Categorías
│   ├── orders.php          → Pedidos (cliente y admin) + cambios de estado
│   ├── dashboard.php       → Estadísticas del panel
│   ├── clientes.php        → CRM de clientes (datos sensibles ocultos)
│   └── interactions.php    → Interacciones del chatbot
├── img/                    → Imágenes locales (licencia libre, Unsplash/Openverse)
├── sql/
│   ├── flora_elegante_mysql.sql → Esquema MySQL (importar desde cero en phpMyAdmin)
│   └── migrar_existente.sql     → Migración no destructiva sobre una BD existente
└── README.md
```

## Puesta en marcha (XAMPP)

1. Abre XAMPP y activa **Apache** y **MySQL**.
2. En http://localhost/phpmyadmin crea la base de datos `flora_elegante`
   (cotejamiento `utf8mb4_unicode_ci`).
3. Importa `sql/flora_elegante_mysql.sql` (pestaña *Importar*).
   - Si ya tenías una BD previa, ejecuta `sql/migrar_existente.sql` en su lugar
     (no borra nada, solo añade/actualiza lo necesario).
4. Copia la carpeta `flora-elegante` dentro de `C:\xampp\htdocs\`.
5. Abre en el navegador: `http://localhost/flora-elegante/index.html`

> La base de datos se configura vía `api/config.php` (por defecto `root` sin contraseña,
> típico de XAMPP). El backend crea automáticamente los usuarios demo y pedidos de ejemplo
> la primera vez (`api/bootstrap.php`) usando `password_hash()`.

## Cuentas de demostración

| Rol           | Correo                  | Contraseña   |
|---------------|-------------------------|--------------|
| Administrador | admin@floraelegante.mx  | Admin2025*   |
| Cliente       | cliente@demo.mx         | Cliente123*  |

- El **admin** accede a `admin.html`: dashboard con estadísticas e inventario bajo,
  gestión de productos (CRUD), gestión de pedidos (cambio de estado), reporte mensual
  y CRM de clientes (datos sensibles enmascarados).
- Los **clientes**: catálogo, carrito con validación de stock, creación de pedidos
  (descuenta inventario) e historial. Se registran desde `index.html#registro`; cada
  campo está etiquetado según su clasificación (PÚBLICO / SEMIPRIVADO / PRIVADO / SENSIBLE).
- Textos bilingües ES/EN vía `js/i18n.js`.

## Requisitos cubiertos

- **CRUD de productos** (administrador): alta, edición, baja y listado.
- **Inventario**: stock por producto, alerta de inventario bajo y descuento automático
  al crear un pedido.
- **Carrito / pedidos** (cliente): crear pedido y ver historial.
- **Gestión de pedidos** (administrador): listar todos los pedidos y cambiar su estado
  (Confirmado / En camino / Entregado / Cancelado).
- **Panel administrativo**: estadísticas, productos, pedidos, reporte mensual y CRM.
- **Textos ES/EN** en toda la interfaz.
- **Clasificación de datos** (público/semiprivado/privado/sensible) y enmascarado de
  sensibles en el CRM.

## Reporte mensual

Las calificaciones y sugerencias captadas por el chatbot se guardan en `interaccion`
y alimentan el reporte del panel (personas atendidas, calificación promedio,
distribución de estrellas, sugerencias y recomendaciones automáticas).

## Base de datos MySQL

Tablas: `rol`, `usuario`, `cliente_perfil`, `categoria`, `producto`, `pedido`,
`pedido_detalle`, `interaccion`. El backend usa **PDO** con consultas parametrizadas
y hashes de contraseña con `password_hash()`.

## Imágenes

Las imágenes de `img/` provienen de bancos con licencia libre para uso comercial
(Unsplash License / Openverse CC), sin atribución obligatoria.

## Cuentas de demostración

| Rol           | Correo                  | Contraseña   |
|---------------|-------------------------|--------------|
| Administrador | admin@floraelegante.mx  | Admin2025*   |
| Cliente       | cliente@demo.mx         | Cliente123*  |

- El **admin** accede a `admin.html`: reporte mensual (personas atendidas, calificación
  promedio, satisfacción, distribución de estrellas, sugerencias y recomendaciones
  automáticas para la administración) + CRM de clientes con datos sensibles enmascarados.
- Los **clientes** se registran desde `index.html#registro`; cada campo está etiquetado
  según su clasificación (PÚBLICO / SEMIPRIVADO / PRIVADO / SENSIBLE).

## Reporte mensual (requisitos cubiertos)

a. **Cantidad de personas atendidas** → contador de interacciones del mes.
b. **Calificación de los clientes** → promedio + distribución 1–5 estrellas.
c. **Sugerencias → recomendaciones para la administración** → análisis por palabras
   clave de las sugerencias (entregas, precios, variedad, pagos, suscripciones, etc.).

Las calificaciones y sugerencias captadas por el chatbot se guardan automáticamente
y alimentan el reporte.

## Base de datos PostgreSQL

```bash
createdb -U postgres flora_elegante
psql -U postgres -d flora_elegante -f sql/flora_elegante.sql
```

Incluye: tablas `rol`, `usuario`, `cliente_perfil`, `producto`, `pedido`, `pedido_detalle`,
`interaccion`, vista `reporte_mensual`, triggers, índices, cifrado de sensibles con
`pgcrypto` y datos demo.

Consulta del reporte:

```sql
SELECT * FROM reporte_mensual WHERE mes = TO_CHAR(NOW(), 'YYYY-MM');
```

## Conectar el frontend a un backend real

1. Montar una API (Node/Express, Django, Laravel…) conectada a PostgreSQL.
2. En `js/api.js` cambiar `USE_MOCK: false` y ajustar `BASE_URL`.
3. Endpoints esperados:

| Método | Ruta                 | Descripción                          |
|--------|----------------------|--------------------------------------|
| POST   | /api/auth/register   | `{nombre,email,password}` → crea usuario |
| POST   | /api/auth/login      | `{email,password}` → `{token,user}`  |
| GET    | /api/clientes        | Lista de clientes (solo admin)       |
| POST   | /api/clientes        | Guardar/actualizar perfil            |
| GET    | /api/interacciones   | Interacciones (`?mes=YYYY-MM`)       |
| POST   | /api/interacciones   | Registrar calificación/sugerencia    |
| GET    | /api/reportes/mensual| Métricas desde `reporte_mensual`     |

> ⚠️ Seguridad: en producción el hash de contraseñas debe hacerse en el servidor
> (bcrypt/argon2), las consultas deben ser parametrizadas y el sitio servido por HTTPS.

## Imágenes

Las imágenes de `img/` provienen de bancos con licencia libre para uso comercial
(Unsplash License / Openverse CC), sin atribución obligatoria.

--http://localhost/flora-elegante/index.html