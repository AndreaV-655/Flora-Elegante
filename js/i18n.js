// ===================================================================
// IDIOMA (ES/EN) Y MONEDA (COP/USD)
// - I18n.aplicar() traduce el HTML estático usando un diccionario
//   de coincidencia exacta (funciona en ambas direcciones).
// - Los módulos dinámicos usan I18n.te('Español','English') y se
//   re-renderizan escuchando los eventos 'fe:idioma' / 'fe:moneda'.
// ===================================================================
const I18n = (() => {

    const LANG_KEY = 'fe_lang';
    const MONEDA_KEY = 'fe_moneda';
    const RATE = 4000; // 1 USD = 4.000 COP

    // ---------- Diccionario texto estático (ES -> EN) ----------
    const TEXTO = {
        'Inicio': 'Home',
        'Catálogo': 'Catalog',
        'Registro': 'Registration',
        'Nosotros': 'About Us',
        'Mis datos': 'My details',
        'Historial': 'Order history',
        'Ver Colección': 'View Collection',
        'Registrarse': 'Sign up',
        'Únete a nosotros': 'Join us',
        'Registro de Cliente': 'Customer Registration',
        'Nuestra colección': 'Our collection',
        'Arreglos Exclusivos': 'Exclusive Arrangements',
        'Nombre completo': 'Full name',
        'Correo electrónico': 'Email address',
        'Contraseña': 'Password',
        'Confirmar contraseña': 'Confirm password',
        'Teléfono': 'Phone',
        'Dirección de entrega': 'Delivery address',
        'Fecha de nacimiento': 'Date of birth',
        'Preferencias florales': 'Flower preferences',
        'Número de identificación': 'ID number',
        'Método de pago preferido': 'Preferred payment method',
        'Selecciona tus favoritas': 'Pick your favorites',
        'Rosas': 'Roses',
        'Lirios': 'Lilies',
        'Girasoles': 'Sunflowers',
        'Tulipanes': 'Tulips',
        'Orquídeas': 'Orchids',
        'Flores tropicales': 'Tropical flowers',
        'Mixtas': 'Mixed',
        'Selecciona un método': 'Select a method',
        'Tarjeta de crédito': 'Credit card',
        'Tarjeta de débito': 'Debit card',
        'Transferencia bancaria': 'Bank transfer',
        'Efectivo contra entrega': 'Cash on delivery',
        'Crear Cuenta': 'Create Account',
        'Actualizar mi perfil': 'Update my profile',
        'Guardar cambios': 'Save changes',
        'Acepto el aviso de privacidad': 'I accept the privacy notice',
        'Quiero cambiar mi contraseña': 'I want to change my password',
        'PÚBLICO': 'PUBLIC',
        'SEMIPRIVADO': 'SEMIPRIVATE',
        'PRIVADO': 'PRIVATE',
        'SENSIBLE': 'SENSITIVE',
        'Tu carrito': 'Your cart',
        'Total': 'Total',
        'Finalizar compra': 'Checkout',
        'Entrega gratuita en la zona metropolitana.': 'Free delivery in the metropolitan area.',
        'Iniciar sesión': 'Log in',
        'Cerrar sesión': 'Log out',
        'Salir': 'Log out',
        'Crear cuenta': 'Create account',
        'Panel': 'Dashboard',
        'Mi cuenta': 'My account',
        'Clientes Registrados': 'Registered Customers',
        'Sugerencias de Clientes': 'Customer Feedback',
        'Cliente': 'Customer',
        'Email': 'Email',
        'Edad': 'Age',
        'Preferencias': 'Preferences',
        'Pago': 'Payment',
        'Protegido': 'Protected',
        'Mostrar datos semiprivados': 'Show semiprivate data',
        'Ocultar datos semiprivados': 'Hide semiprivate data',
        'Generar Reporte': 'Generate Report',
        'Generando...': 'Generating...',

        // ---- Hero / catálogo ----
        'Artesanía floral desde 2015': 'Floral craftsmanship since 2015',
        'Flores que': 'Flowers that',
        'dicen todo': 'say it all',
        'Cada arreglo es una composición única, creada con flores frescas seleccionadas a mano para transformar tus momentos en recuerdos inolvidables.': 'Each arrangement is a unique composition, created with fresh flowers selected by hand to turn your moments into unforgettable memories.',
        'Crea tu cuenta para recibir ofertas personalizadas, seguimiento de pedidos y una experiencia de compra optimizada.': 'Create your account to receive personalized offers, order tracking and an optimized shopping experience.',

        // ---- Aviso de privacidad (nodos separados por <strong>) ----
        'Tus datos son tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Los datos': 'Your data is processed in accordance with the Federal Law on Protection of Personal Data Held by Private Parties. The',
        'públicos': 'public',
        'pueden mostrarse en tu perfil visible, los': 'data may be shown on your visible profile, the',
        'semiprivados': 'semi-private',
        'se comparten solo con el equipo de entregas, los': 'data is shared only with the delivery team, the',
        'privados': 'private',
        'se usan para personalizar tu experiencia, las': 'data is used to personalize your experience,',
        'contraseñas': 'passwords',
        'se almacenan únicamente como hash criptográfico (nunca en texto plano) y los': 'are stored only as a cryptographic hash (never in plain text) and the',
        'sensibles': 'sensitive',
        'se almacenan cifrados de extremo a extremo.': 'data is stored end-to-end encrypted.',

        // ---- Nosotros ----
        'Nuestra historia': 'Our story',
        'Diez años cultivando emociones': 'Ten years growing emotions',
        'Flora Elegante nació en 2015 como un pequeño taller floral en el centro de la ciudad. Hoy, somos el referente en arreglos boutique, con un equipo de 25 floristas apasionados que transforman cada encargo en una obra de arte efímera.': 'Flora Elegante was born in 2015 as a small floral workshop downtown. Today, we are the benchmark in boutique arrangements, with a team of 25 passionate florists who turn every order into a fleeting work of art.',
        'Trabajamos directamente con productores locales y fincas certificadas, garantizando frescura, sostenibilidad y un impacto positivo en nuestra comunidad.': 'We work directly with local growers and certified farms, guaranteeing freshness, sustainability and a positive impact on our community.',
        'Años de experiencia': 'Years of experience',
        'Pedidos entregados': 'Orders delivered',
        'Clientes satisfechos': 'Satisfied customers',
        'Floristas expertos': 'Expert florists',

        // ---- Footer ----
        'Transformamos flores en emociones desde 2015. Entregas en toda la ciudad metropolitana.': 'We turn flowers into emotions since 2015. Deliveries throughout the metropolitan area.',
        'Navegación': 'Navigation',
        'Contacto': 'Contact',
        'Síguenos': 'Follow us',
        'Av. Reforma 512, Col. Juárez': '512 Reforma Ave., Juárez Dist.',
        'Lun-Sáb: 8:00 - 20:00': 'Mon-Sat: 8:00 am - 8:00 pm',
        'Aviso de privacidad | Términos y condiciones | Política de cookies': 'Privacy notice | Terms and conditions | Cookie policy',
        '2025 Flora Elegante. Todos los derechos reservados.': '2025 Flora Elegante. All rights reserved.',

        // ---- Chat / carrito (estáticos) ----
        'Asistente Flora': 'Flora Assistant',
        'En línea': 'Online',
        'Tu carrito está vacío.': 'Your cart is empty.',
        'Agrega un arreglo de nuestra colección.': 'Add an arrangement from our collection.',

        // ---- Login ----
        'Iniciar Sesión': 'Sign In',
        'Accede a tu cuenta de Flora Elegante': 'Access your Flora Elegante account',
        'Entrar': 'Enter',
        'Cuentas de demostración': 'Demo accounts',
        'Usar': 'Use',
        'Cliente:': 'Customer:',
        'Tienda': 'Store',
        'Tus credenciales se transmiten cifradas y se almacenan solo como hash.': 'Your credentials are transmitted encrypted and stored only as a hash.',

        // ---- Admin (estáticos fuera de zonas dinámicas) ----
        'Panel de Administración': 'Administration Panel',
        'Administrador': 'Administrator',
        'Ver sitio': 'View site',
        'Atención al cliente': 'Customer service',
        'Reporte Mensual': 'Monthly Report',
        'SEMIPRIVADO (visible con botón)': 'SEMIPRIVATE (visible via button)',
        'PRIVADO (protegido)': 'PRIVATE (protected)',
        'SENSIBLE (nunca visible)': 'SENSITIVE (never shown)',
        'Personas Atendidas': 'Customers Served',
        'Calificación Promedio': 'Average Rating',
        'Satisfacción': 'Satisfaction',
        'Distribución de Calificaciones': 'Rating Distribution',
        'Recomendaciones para la Administración': 'Recommendations for Management',
        'Sin datos este mes': 'No data this month',
        'No hay interacciones registradas en': 'No interactions recorded in',
        'Selecciona otro mes o genera calificaciones y sugerencias desde el chatbot de la tienda.': 'Pick another month or generate ratings and suggestions from the store chatbot.',
        'Panel exclusivo para personal autorizado · Flora Elegante 2025': 'Panel restricted to authorized personnel · Flora Elegante 2025',

        // ---- Panel del negocio (dashboard) ----
        'Panel del negocio': 'Business panel',
        'Información General': 'General Information',
        'Clientes': 'Customers',
        'Productos': 'Products',
        'Pedidos': 'Orders',
        'Inventario bajo': 'Low stock',
        'Estado de los pedidos': 'Order statuses',
        'Últimos pedidos': 'Latest orders',
        'Gestión de Productos': 'Product Management',
        'Los productos se guardan en la base de datos.': 'Products are stored in the database.',
        'Nuevo producto': 'New product',
        'Consulta los pedidos y cambia su estado.': 'Review orders and change their status.',
        'Detalle del pedido': 'Order details',

        // ---- Cliente ----
        'Tu espacio personal': 'Your personal space',
        'Mi Cuenta': 'My Account',
        'Explora la colección, mantén tus datos al día y consulta el historial de tus compras.': 'Explore the collection, keep your details up to date and check your purchase history.',
        'Información de registro': 'Registration information',
        'Mi Perfil': 'My Profile',
        'Actualiza tu información cuando lo necesites. Tu correo no puede modificarse.': 'Update your information whenever you need. Your email cannot be changed.',
        'Nueva contraseña': 'New password',
        'Tus pedidos': 'Your orders',
        'Historial de Compras': 'Purchase History',
        'Pedidos realizados:': 'Orders placed:',
        'Aún no tienes pedidos. ¡Explora el catálogo y sorprende a alguien especial!': 'You have no orders yet. Explore the catalog and surprise someone special!',
        '© 2026 Flora Elegante · Flores que hablan por ti': '© 2026 Flora Elegante · Flowers that speak for you',
    };

    // ---------- Placeholders / títulos / aria ----------
    const ATR = {
        'Ej: María García López': 'e.g. Maria Garcia Lopez',
        'maria@correo.com': 'maria@correo.com',
        'tu@correo.com': 'you@email.com',
        'Crea una contraseña segura': 'Create a strong password',
        'Repite tu contraseña': 'Repeat your password',
        'Tu contraseña': 'Your password',
        '+57 300 123 4567': '+57 300 123 4567',
        'Calle, número, colonia, ciudad': 'Street, number, neighborhood, city',
        'INE / Pasaporte (opcional)': 'ID / Passport (optional)',
        'Escribe tu mensaje...': 'Type your message...',
        'Cambiar idioma': 'Change language',
        'Cambiar moneda': 'Change currency',
        'Abrir carrito': 'Open cart',
        'Cerrar carrito': 'Close cart',
        'Abrir menú': 'Open menu',
        'Abrir chat de atención': 'Open support chat',
        'Cerrar chat': 'Close chat',
        'Enviar mensaje': 'Send message',
        'Anterior': 'Previous',
        'Siguiente': 'Next',
    };

    function lang() { return localStorage.getItem(LANG_KEY) || 'es'; }
    function moneda() { return localStorage.getItem(MONEDA_KEY) || 'COP'; }

    // Helper para textos dinámicos en los módulos
    function te(es, en) { return lang() === 'en' ? en : es; }

    function aplicar(root) {
        root = root || document;
        try {
            const mapa = lang() === 'en' ? TEXTO : invertir(TEXTO);
            const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (w.nextNode()) {
                const n = w.currentNode;
                if (!n.nodeValue || !n.nodeValue.trim()) continue;
                if (n.parentElement && n.parentElement.closest('[data-no-i18n],script,style')) continue;
                const v = n.nodeValue.trim();
                const m = mapa[v];
                if (m !== undefined && m !== v) n.nodeValue = n.nodeValue.replace(v, m);
            }
            root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el => {
                ['placeholder', 'title', 'aria-label'].forEach(a => {
                    const val = el.getAttribute(a);
                    if (!val) return;
                    const inv = lang() === 'en' ? ATR[val] : clavePorValor(ATR, val);
                    if (inv !== undefined) el.setAttribute(a, inv);
                });
            });
            document.documentElement.lang = lang() === 'en' ? 'en' : 'es';
        } catch (e) { console.error(e); }
    }

    function invertir(obj) {
        const r = {};
        Object.keys(obj).forEach(k => { r[obj[k]] = k; });
        return r;
    }
    function clavePorValor(obj, val) {
        for (const k of Object.keys(obj)) if (obj[k] === val) return k;
        return undefined;
    }

    function refrescarBotones() {
        const l = lang() === 'es' ? 'EN' : 'ES';
        const c = moneda() === 'COP' ? 'USD' : 'COP';
        ['langToggle', 'langToggleMv'].forEach(id => { const b = document.getElementById(id); if (b) b.textContent = l; });
        ['curToggle', 'curToggleMv'].forEach(id => { const b = document.getElementById(id); if (b) b.textContent = c; });
    }

    function setLang(l) {
        localStorage.setItem(LANG_KEY, l);
        aplicar();
        refrescarBotones();
        document.dispatchEvent(new Event('fe:idioma'));
    }

    function setMoneda(m) {
        localStorage.setItem(MONEDA_KEY, m);
        refrescarBotones();
        document.dispatchEvent(new Event('fe:moneda'));
    }

    // ---------- Moneda ----------
    function precio(cop) {
        const n = Number(cop) || 0;
        if (moneda() === 'USD') {
            const usd = n / RATE;
            return '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
        }
        return '$' + Math.round(n).toLocaleString('es-CO') + ' COP';
    }

    function init() {
        aplicar();
        refrescarBotones();
        document.getElementById('langToggle')?.addEventListener('click', () => setLang(lang() === 'es' ? 'en' : 'es'));
        document.getElementById('langToggleMv')?.addEventListener('click', () => setLang(lang() === 'es' ? 'en' : 'es'));
        document.getElementById('curToggle')?.addEventListener('click', () => setMoneda(moneda() === 'COP' ? 'USD' : 'COP'));
        document.getElementById('curToggleMv')?.addEventListener('click', () => setMoneda(moneda() === 'COP' ? 'USD' : 'COP'));
    }

    return { lang, moneda, te, t: te, aplicar, precio, RATE, init, setLang, setMoneda };
})();

// Exponer en window: los módulos comprueban window.I18n y las
// declaraciones const no crean propiedades globales por sí solas.
window.I18n = I18n;
