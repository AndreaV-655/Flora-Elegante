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
│   ├── interactions.php    → Interacciones del chatbot
│   ├── intentos_login.php  → Bitácora de intentos de inicio de sesión
│   ├── chat.php            → Asistente del chatbot (Google Gemini; opcional)
│   └── recibo.php          → Recibo con código único
├── img/                    → Imágenes locales (licencia libre, Unsplash/Openverse)
├── sql/
│   └── flora_elegante_mysql.sql → Esquema MySQL (importar desde cero en phpMyAdmin)
└── README.md
```

## Chatbot (con IA opcional)

El chatbot (`js/chatbot.js`) mantiene su lógica local por reglas: entiende texto
con o sin tildes, reconoce productos por nombre (ES/EN), muestra el catálogo por
páginas ("Ver más arreglos" muestra otros arreglos), consulta el carrito, permite
**iniciar sesión** y **finalizar el pedido** con los productos del carrito, y guía
el flujo de calificación y sugerencia.

Para que responda de forma más fluida se conecta a Google Gemini: define
`GEMINI_API_KEY` y `GEMINI_MODEL` (por defecto `gemini-3.5-flash`) en
`api/secretos.php`, un archivo **local que no se sube a git** (ver `.gitignore`).
La IA resuelve los mensajes que no cubre la lógica local y la clave vive solo en
el servidor. Sin clave, el chatbot funciona igual.

## Recibos

Cada compra genera un recibo con **código único** (`FE-AAAAMMDD-XXXX`). El
servidor crea el código y lo guarda en el pedido; el administrador lo ve en el
panel de pedidos (`admin.html`).

El registro solo acepta **cuentas de Gmail** (`@gmail.com`): la factura se
enviará a la cuenta del cliente mediante **n8n**. Al finalizar la compra, la
tienda le indica (en el chat y en pantalla) que su factura está en su cuenta de
Gmail.

## Entrega programada

Todo pedido (desde el carrito o desde el chat) exige una **fecha y hora de
entrega**, validada contra el horario del negocio: **lunes a sábado 8:00–20:00**
y **domingo 9:00–14:00**, y siempre con fecha futura. La ventana se pide en una
modal en el carrito (`js/cart.js`) y en un formulario dentro del chat
(`js/chatbot.js`); el servidor la vuelve a validar en `api/orders.php` antes de
guardarla en la columna `pedido.entrega`.

Al elegir la entrega se piden también los datos extra del pedido:

- **Teléfono de contacto**: obligatorio si la cuenta aún no lo tiene guardado
  (se guarda en `cliente_perfil.telefono`).
- **Dedicatoria**: mensaje opcional para la tarjeta (`pedido.dedicatoria`).
- **¿Es para una ocasión especial?** Al marcarlo se elige el **tipo** (cumpleaños,
  aniversario u otro → `pedido.ocasion`) y la **fecha exacta de la ocasión**
  (`pedido.fecha_evento`). Si no se marca, ambas columnas quedan vacías (`NULL`).

El panel de administración y el historial del cliente señalan la ocasión especial
con su tipo y fecha, además de la dedicatoria.

## Integración con n8n

Al confirmar un pedido, `api/orders.php` envía un `POST` en JSON al webhook de
n8n configurado en `N8N_WEBHOOK_URL` (`api/secretos.php`; en `api/config.php`
queda vacío por defecto). El envío lo hace `api/n8n.php` con `cURL` y **nunca
bloquea la compra**: si n8n no está disponible o la URL está vacía, el pedido ya
quedó guardado y la compra sigue igual. El servidor usa peticiones tolerantes a
fallos (timeout corto) y registra el error en el log de PHP.

El webhook recibe un JSON con:

- `tipo` (`pedido.creado`), `origen` e `idioma`.
- `pedido`: `id`, `codigo` (recibo), `estado`, `fecha`, `total`, `entrega`,
  `evento`, `ocasion`, `fecha_evento` y `dedicatoria`.
- `cliente`: `id`, `nombre`, `email` y `telefono`.
- `flor_solicitada` (resumen de los arreglos), `items` (detalle de cada arreglo)
  y `recibo`.

La URL del webhook vive en `api/secretos.php` (constante `N8N_WEBHOOK_URL`),
junto con la clave de Gemini. Ejemplo: `http://localhost:5678/webhook-test/<id>`.
Para desactivar el envío, deja `N8N_WEBHOOK_URL` vacío (`''`).

## Base de datos

Importa `sql/flora_elegante_mysql.sql` desde phpMyAdmin. Crea las tablas de
categorías, productos, usuarios, pedidos, interacciones e intentos de login.

## Zona horaria

La zona horaria vive en `api/config.php` (`TIMEZONE`, por defecto
`America/Bogota`). Si vendes en otro país, cambia esa constante: la conexión
calcula sola el desplazamiento para MySQL y así las fechas de los pedidos
coinciden con las de los recibos.

---

`http://localhost/flora-elegante/index.html`
