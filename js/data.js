// ===================================================================
// DATOS ESTÁTICOS Y SEMILLA (Flora Elegante)
// ===================================================================
const Data = (() => {

    // Catálogo de productos (precios en COP; textos ES/EN)
    const productos = [
        { id: 1, nombre: 'Ramo de Rosas Rojas', desc: '12 rosas rojas premium con follaje verde y lazo de satén.', nombreEn: 'Red Roses Bouquet', descEn: '12 premium red roses with green foliage and a satin ribbon.', precio: 85000, img: 'img/rosas-rojas.jpg' },
        { id: 2, nombre: 'Arreglo de Lirios Blancos', desc: 'Elegante composición de lirios blancos con eucalipto y baby breath.', nombreEn: 'White Lilies Arrangement', descEn: 'Elegant arrangement of white lilies with eucalyptus and baby’s breath.', precio: 98000, img: 'img/lirios-blancos.jpg' },
        { id: 3, nombre: 'Canasta de Girasoles', desc: 'Vibrante canasta de girasoles frescos con flores de campo.', nombreEn: 'Sunflower Basket', descEn: 'Vibrant basket of fresh sunflowers with wildflowers.', precio: 72000, img: 'img/girasoles.jpg' },
        { id: 4, nombre: 'Tulipanes Mixtos', desc: '20 tulipanes en tonos pastel: rosa, amarillo, lila y naranja.', nombreEn: 'Mixed Tulips', descEn: '20 tulips in pastel tones: pink, yellow, lilac and orange.', precio: 92000, img: 'img/tulipanes.jpg' },
        { id: 5, nombre: 'Centro de Mesa Tropical', desc: 'Composición exótica con anturios, heliconias y hojas de palma.', nombreEn: 'Tropical Centerpiece', descEn: 'Exotic composition with anthuriums, heliconias and palm leaves.', precio: 118000, img: 'img/tropical.jpg' },
        { id: 6, nombre: 'Caja de Orquídeas', desc: 'Tres orquídeas phalaenopsis en caja de madera premium con musgo.', nombreEn: 'Orchid Box', descEn: 'Three phalaenopsis orchids in a premium wooden box with moss.', precio: 145000, img: 'img/orquideas.jpg' },
    ];

    // Nombre/descripción según idioma activo
    function nombre(p) { return I18n ? I18n.te(p.nombre, p.nombreEn) : p.nombre; }
    function desc(p) { return I18n ? I18n.te(p.desc, p.descEn) : p.desc; }

    // Formateo según moneda seleccionada (COP/USD)
    function formatPrecio(n) {
        if (window.I18n && I18n.precio) return I18n.precio(n);
        const nfCOP = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
        return '$' + nfCOP.format(n) + ' COP';
    }

    // Respuestas del chatbot (ES/EN; los precios se formatean al vuelo)
    const botResponses = [
        { keywords: ['rosa', 'rosas', 'rose', 'roses'], resp: () => I18n.te(
            `Tenemos hermosos ramos de rosas en rojo, blanco, rosa y amarillo. Nuestro ramo estelar de 12 rosas rojas cuesta ${formatPrecio(85000)}. ¿Te gustaría ver más opciones?`,
            `We have beautiful rose bouquets in red, white, pink and yellow. Our signature bouquet of 12 red roses costs ${formatPrecio(85000)}. Would you like to see more options?`) },
        { keywords: ['lirio', 'lirios', 'lily', 'lilies'], resp: () => I18n.te(
            `Nuestros arreglos de lirios blancos son una de las opciones más elegantes. Incluyen eucalipto y baby breath por ${formatPrecio(98000)}. Ideales para ocasiones especiales.`,
            `Our white lily arrangements are among the most elegant options. They include eucalyptus and baby’s breath for ${formatPrecio(98000)}. Ideal for special occasions.`) },
        { keywords: ['girasol', 'girasoles', 'sunflower', 'sunflowers'], resp: () => I18n.te(
            `Las canastas de girasoles son perfectas para alegrar cualquier espacio. La nuestra incluye girasoles frescos con flores de campo por ${formatPrecio(72000)}.`,
            `Sunflower baskets are perfect to brighten any space. Ours includes fresh sunflowers with wildflowers for ${formatPrecio(72000)}.`) },
        { keywords: ['tulipan', 'tulipanes', 'tulip', 'tulips'], resp: () => I18n.te(
            `Los tulipanes mixtos incluyen 20 unidades en tonos pastel (rosa, amarillo, lila y naranja) por ${formatPrecio(92000)}. Son una opción encantadora.`,
            `Mixed tulips include 20 stems in pastel tones (pink, yellow, lilac and orange) for ${formatPrecio(92000)}. A charming choice.`) },
        { keywords: ['orquidea', 'orquideas', 'orchid', 'orchids'], resp: () => I18n.te(
            `Nuestra caja de orquídeas phalaenopsis es premium: tres plantas en caja de madera con musgo por ${formatPrecio(145000)}. Son un regalo duradero y sofisticado.`,
            `Our phalaenopsis orchid box is premium: three plants in a wooden box with moss for ${formatPrecio(145000)}. A lasting, sophisticated gift.`) },
        { keywords: ['tropical', 'exotico', 'exoticas', 'exotic', 'tropicais'], resp: () => I18n.te(
            `El centro de mesa tropical incluye anturios, heliconias y hojas de palma por ${formatPrecio(118000)}. Perfecto para eventos y decoración moderna.`,
            `The tropical centerpiece includes anthuriums, heliconias and palm leaves for ${formatPrecio(118000)}. Perfect for events and modern décor.`) },
        { keywords: ['precio', 'cuesta', 'cuanto', 'costo', 'barato', 'caro', 'price', 'cost', 'how much', 'cheap', 'expensive'], resp: () => I18n.te(
            `Nuestros precios van desde ${formatPrecio(72000)} (canasta de girasoles) hasta ${formatPrecio(145000)} (caja de orquídeas). Todos incluyen entrega gratuita en la zona metropolitana.`,
            `Our prices range from ${formatPrecio(72000)} (sunflower basket) to ${formatPrecio(145000)} (orchid box). All include free delivery in the metropolitan area.`) },
        { keywords: ['entrega', 'envio', 'domicilio', 'llega', 'tiempo', 'delivery', 'shipping', 'arrive', 'time'], resp: () => I18n.te(
            `Realizamos entregas de lunes a sábado de 8:00 a 20:00 hrs. La entrega estándar toma de 2 a 4 horas. Para entregas express (1 hora) hay un costo adicional de ${formatPrecio(15000)}.`,
            `We deliver Monday through Saturday from 8:00 am to 8:00 pm. Standard delivery takes 2 to 4 hours. Express delivery (1 hour) costs an extra ${formatPrecio(15000)}.`) },
        { keywords: ['horario', 'hora', 'abierto', 'abren', 'cierran', 'hours', 'open', 'closing'], resp: () => I18n.te(
            'Estamos abiertos de lunes a sábado de 8:00 a 20:00 hrs y domingos de 9:00 a 14:00 hrs. Nuestro chat atiende las 24 horas.',
            'We are open Monday through Saturday from 8:00 am to 8:00 pm and Sundays from 9:00 am to 2:00 pm. Our chat is available 24/7.') },
        { keywords: ['pago', 'tarjeta', 'efectivo', 'pagar', 'transferencia', 'payment', 'card', 'cash', 'pay', 'transfer'], resp: () => I18n.te(
            'Aceptamos tarjeta de crédito/débito, transferencia bancaria, OXXO Pay y efectivo contra entrega. Todas las transacciones son seguras y cifradas.',
            'We accept credit/debit cards, bank transfer, OXXO Pay and cash on delivery. All transactions are secure and encrypted.') },
        { keywords: ['devolucion', 'garantia', 'cambiar', 'reclamo', 'queja', 'refund', 'warranty', 'guarantee', 'return', 'complaint'], resp: () => I18n.te(
            'Ofrecemos garantía de frescura de 48 horas. Si las flores llegan en mal estado, las reemplazamos sin costo. Contáctanos inmediatamente con tu número de pedido.',
            'We offer a 48-hour freshness guarantee. If your flowers arrive in poor condition, we replace them at no cost. Contact us immediately with your order number.') },
        { keywords: ['pedido', 'ordenar', 'comprar', 'hacer', 'order', 'buy', 'purchase'], resp: () => I18n.te(
            'Puedes hacer tu pedido por este chat, llamando al +52 55 9876 5432, o visitándonos en Av. Reforma 512. ¿Qué arreglo te interesa?',
            'You can place your order through this chat, by calling +52 55 9876 5432, or visiting us at 512 Reforma Ave. Which arrangement interests you?') },
        { keywords: ['ubicacion', 'donde estan', 'donde quedan', 'direccion de la tienda', 'tienda fisica', 'local', 'contacto', 'contactar', 'telefono', 'whatsapp', 'location', 'where are you', 'address', 'contact', 'store', 'visit'], resp: () => I18n.te(
            'Estamos en Av. Reforma 512, Col. Juárez. Atiende: +52 55 9876 5432 y contacto@floraelegante.mx, de lunes a sábado de 8:00 a 20:00 hrs y domingos de 9:00 a 14:00 hrs.',
            'You can find us at 512 Reforma Ave., Juárez District. Reach us at +52 55 9876 5432 or contacto@floraelegante.mx, Monday to Saturday 8:00 am - 8:00 pm and Sundays 9:00 am - 2:00 pm.') },
        { keywords: ['personaliz', 'a medida', 'custom', 'tailor'], resp: () => I18n.te(
            '¡Claro! Armamos arreglos personalizados: eliges flores, colores, tamaño y tarjeta con dedicatoria. Cuéntanos tu idea (por ejemplo “rosas rojas para aniversario”) y te cotizamos sin compromiso.',
            'Of course! We build custom arrangements: you choose flowers, colors, size and a card with your message. Tell us your idea (e.g. “red roses for an anniversary”) and we\'ll quote it for free.') },
        { keywords: ['cuidado', 'cuidar', 'conservar', 'duracion', 'duran', 'frescura', 'tips', 'care', 'last longer', 'fresh', 'maintain'], resp: () => I18n.te(
            'Para que duren más: corta los tallos en diagonal cada 2 días, cambia el agua a diario, evita luz directa del sol y corrientes de aire, y aléjalas de frutas (el etileno las marchita). Con estos cuidados duran de 7 a 14 días.',
            'To make them last: trim stems diagonally every 2 days, change the water daily, avoid direct sunlight and drafts, and keep them away from fruit (ethylene wilts flowers). With this care they last 7 to 14 days.') },
        { keywords: ['descuento', 'promocion', 'promo', 'cupon', 'oferta', 'rebaja', 'discount', 'coupon', 'deal', 'offer', 'sale'], resp: () => I18n.te(
            `Tenemos promociones vigentes: 10% en tu primera compra registrándote en el sitio, envío express gratis en compras mayores a ${formatPrecio(120000)} y 15% para clientes frecuentes desde el tercer pedido.`,
            `We have current promotions: 10% off your first purchase by signing up on the site, free express delivery on orders over ${formatPrecio(120000)}, and 15% for frequent customers from the third order on.`) },
        { keywords: ['evento', 'boda', 'matrimonio', 'fiesta', 'empresa', 'corporativo', 'decoracion de eventos', 'wedding', 'event', 'party', 'bulk'], resp: () => I18n.te(
            'Cubrimos bodas, XV años y eventos corporativos: centros de mesa, arcos florales, boutonieres y decoración integral. Para eventos cotizamos por volumen con descuentos desde 10 piezas; agendamos una llamada con nuestro florista principal.',
            'We cover weddings, quinceañeras and corporate events: centerpieces, floral arches, boutonnieres and full decoration. Event pricing is volume-based with discounts from 10 pieces; we schedule a call with our head florist.') },
        { keywords: ['rastrear', 'rastreo', 'seguimiento', 'estado de mi pedido', 'donde va mi pedido', 'track', 'status', 'where is my order'], resp: () => I18n.te(
            'Al confirmar tu compra recibes un número de pedido. Con él puedes consultar el estado aquí mismo o al +52 55 9876 5432; la entrega estándar tarda de 2 a 4 horas y la express 1 hora.',
            'When you check out you get an order number. Use it to check the status right here or at +52 55 9876 5432; standard delivery takes 2 to 4 hours and express delivery 1 hour.') },
        { keywords: ['humano', 'persona real', 'agente', 'asesor', 'hablar con alguien', 'human', 'real person', 'agent', 'someone'], resp: () => I18n.te(
            'Te conecto con el equipo humano: llama al +52 55 9876 5432 o escribe a contacto@floraelegante.mx (respondemos en menos de 1 hora en horario de atención). Mientras tanto, yo puedo ayudarte con casi todo.',
            'Let me connect you with our human team: call +52 55 9876 5432 or email contacto@floraelegante.mx (we reply within 1 hour during business hours). Meanwhile, I can help you with almost everything.') },
        { keywords: ['gracias', 'genial', 'perfecto', 'excelente', 'ok', 'thanks', 'thank you', 'great', 'perfect', 'awesome'], resp: null },
        { keywords: ['hola', 'buenos', 'buenas', 'saludos', 'hello', 'hi', 'hey', 'good morning', 'good afternoon'], resp: () => I18n.te(
            '¡Hola! Bienvenido a Flora Elegante. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre nuestros arreglos, precios, entregas o métodos de pago.',
            'Hello! Welcome to Flora Elegante. How can I help you today? You can ask me about our arrangements, prices, deliveries or payment methods.') },
    ];

    function defaultResp() {
        return I18n.te(
            'Gracias por tu mensaje. Puedo ayudarte con información sobre nuestros arreglos florales, precios, entregas, métodos de pago y más. ¿Sobre qué te gustaría saber?',
            'Thanks for your message. I can help you with information about our floral arrangements, prices, deliveries, payment methods and more. What would you like to know?');
    }

    // Semilla de interacciones: [díasAtras, calificación, sugerencia]
    // Se generan de forma relativa a la fecha actual para que el reporte mensual siempre tenga datos.
    const _seedInteracciones = [
        [0, 5, 'Excelente servicio, las flores llegaron perfectas.'],
        [1, 4, 'Podrían tener más variedades de rosas en el catálogo.'],
        [2, 5, ''],
        [4, 3, 'La entrega tardó 40 minutos más de lo prometido.'],
        [5, 5, 'Me encantó el arreglo de girasoles, lo recomiendo.'],
        [7, 4, 'Sería útil poder rastrear el pedido en tiempo real.'],
        [9, 5, ''],
        [10, 2, 'El precio de las orquídeas me pareció muy elevado.'],
        [12, 4, 'Agreguen opciones de arreglos para cumpleaños infantiles.'],
        [15, 5, 'Muy buena atención por chat, respondieron rápido.'],
        [18, 4, 'Podrían ofrecer suscripciones mensuales de flores.'],
        [21, 5, ''],
        [25, 3, 'El florista no siguió exactamente las instrucciones del pedido.'],
        [28, 5, 'Increíble calidad, las flores duraron más de dos semanas.'],
        [33, 4, 'Acepten pagos con más métodos digitales como PayPal.'],
        [38, 5, ''],
        [44, 4, 'Me gustaría ver fotos de los arreglos antes de confirmar.'],
        [50, 5, 'Perfecto para el aniversario de mis padres.'],
        [57, 4, 'Las flores llegaron frescas y el empaque muy elegante.'],
        [63, 3, 'El horario de entrega podría extenderse los fines de semana.'],
        [70, 5, 'El centro tropical fue la estrella de la fiesta.'],
        [78, 4, 'Consideren un programa de puntos para clientes frecuentes.'],
        [85, 5, ''],
        [95, 4, 'Me encantaría poder agendar recordatorios de aniversarios.'],
        [105, 5, 'Atención impecable, resolvieron mi cambio sin problema.'],
        [118, 3, 'Faltaban opciones de flores preservadas de larga duración.'],
        [130, 5, 'Los tulipanes llegaron en perfecto estado, muy recomendables.'],
        [145, 4, 'El proceso de compra por chat es muy práctico.'],
        [160, 5, ''],
    ];

    function seedInteracciones() {
        const hoy = new Date();
        return _seedInteracciones.map(([dias, rating, sugerencia]) => {
            const d = new Date(hoy);
            d.setDate(d.getDate() - dias);
            return { fecha: d.toISOString().split('T')[0], rating, sugerencia, canal: 'chatbot' };
        });
    }

    // Semilla de clientes (CRM demo)
    const seedClientes = [
        { nombre: 'María García López', email: 'maria.garcia@correo.com', telefono: '+52 55 1234 5678', direccion: 'Av. Reforma 512, Col. Juárez, CDMX', nacimiento: '1990-04-12', preferencias: 'Rosas', identificacion: 'GARC850412MGR01', pago: 'Tarjeta de crédito' },
        { nombre: 'Carlos Hernández Ruiz', email: 'carlos.hr@correo.com', telefono: '+52 55 8765 4321', direccion: 'Calle Amsterdam 120, Condesa, CDMX', nacimiento: '1985-11-03', preferencias: 'Orquídeas', identificacion: 'HERH851103XYZ02', pago: 'Transferencia bancaria' },
        { nombre: 'Lucía Fernández Solís', email: 'lucia.fs@correo.com', telefono: '+52 55 2233 4455', direccion: 'Polanco 345, Miguel Hidalgo, CDMX', nacimiento: '1996-07-25', preferencias: 'Tulipanes', identificacion: 'FERL960725ABC03', pago: 'Efectivo contra entrega' },
        { nombre: 'Jorge Ramírez Vega', email: 'jorge.rv@correo.com', telefono: '+52 55 9988 7766', direccion: 'Insurgentes Sur 1800, CDMX', nacimiento: '1979-01-30', preferencias: 'Girasoles', identificacion: 'RAMJ790130DEF04', pago: 'Tarjeta de débito' },
    ];

    return { productos, botResponses, defaultResp, nombre, desc, seedInteracciones, seedClientes, formatPrecio };
})();
