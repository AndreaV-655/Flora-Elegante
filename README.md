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


--http://localhost/flora-elegante/index.html
