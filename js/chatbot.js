// ===================================================================
// CHATBOT DE ATENCIÓN AL CLIENTE ("Flora") · Bilingüe ES/EN
// - Entiende texto con o sin tildes (normalización)
// - Reconoce productos por nombre en español e inglés
// - Consulta de carrito con total según moneda activa (COP/USD)
// - Flujo de calificación y sugerencia (alimenta el reporte admin)
// ===================================================================
const Chat = (() => {

    const chatState = {
        isOpen: false,
        phase: 'greeting', // greeting | conversation | rating | suggestion | complete
        messageCount: 0,
        currentRating: 0,
        lastProduct: null, // último arreglo mostrado, para seguimientos tipo "sí, agrégalo"
        carouselPage: 0, // página actual del carrusel de arreglos
        carouselVisited: false, // ya se mostró algún carrusel
    };

    const ARREGLOS_POR_PAGINA = 3; // cuántos arreglos distintos por carrusel
    const totalPaginas = () => Math.max(1, Math.ceil(Data.productos.length / ARREGLOS_POR_PAGINA));
    const paginaActual = () => {
        const p = Math.min(chatState.carouselPage, totalPaginas() - 1);
        return Data.productos.slice(p * ARREGLOS_POR_PAGINA, (p + 1) * ARREGLOS_POR_PAGINA);
    };

    // Normaliza: minúsculas y sin tildes → "Tulipán" == "tulipan"
    function norm(s) {
        return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Busca un producto mencionado por nombre (ES o EN, completo o palabras clave)
    function findProducto(text) {
        const t = norm(text);
        let p = Data.productos.find(p => t.includes(norm(p.nombre)) || t.includes(norm(p.nombreEn)));
        if (p) return p;
        const matchPorPalabras = p => {
            const palabras = norm(p.nombre).split(' ').concat(norm(p.nombreEn).split(' '))
                .filter(w => w.length > 3);
            return palabras.some(w => t.includes(w));
        };
        return Data.productos.find(matchPorPalabras) || null;
    }

    // Permite a los botones dentro del chat enviar mensajes / acciones
    function ask(text) {
        const inp = document.getElementById('chatInput');
        inp.value = text;
        document.getElementById('chatSend').click();
    }
    window.ChatAsk = ask;

    // Ocasiones especiales → arreglos sugeridos (ids de Data.productos)
    const OCASIONES = [
        { re: /cumplean|birthday|\banos\b|bday/, ids: [3, 5],
          intro: () => I18n.te('¡Buena ocasión! Para un cumpleaños recomendamos estos arreglos alegres:', 'Great occasion! For a birthday we recommend these cheerful arrangements:') },
        { re: /aniversario|romantic|enamora|novio|novia|anniversary|love|valentine|propuesta/, ids: [1, 6],
          intro: () => I18n.te('Para celebrar el amor, estos clásicos nunca fallan:', 'To celebrate love, these classics never fail:') },
        { re: /pesame|condolenc|funeral|fallec|difunt|sympathy|condolence|passed away/, ids: [2],
          intro: () => I18n.te('En momentos difíciles, nuestros lirios blancos transmiten serenidad y respeto:', 'In difficult moments, our white lilies convey serenity and respect:') },
        { re: /\bbebe\b|nacimiento|recien nacido|newborn|baby/, ids: [4],
          intro: () => I18n.te('¡Felicidades! Para dar la bienvenida al bebé, estos tonos suaves son perfectos:', 'Congratulations! To welcome the baby, these soft tones are perfect:') },
        { re: /\bmama\b|madre|mother|mom/, ids: [6, 1],
          intro: () => I18n.te('Para mamá, lo más elegante y duradero:', 'For mom, the most elegant and lasting options:') },
        { re: /graduacion|examen|\blogro\b|graduation|achievement/, ids: [3, 2],
          intro: () => I18n.te('¡Por los logros! Estos arreglos celebran a lo grande:', 'For achievements! These arrangements celebrate in style:') },
        { re: /perdon|disculpa|lo siento|apolog|sorry|forgive/, ids: [1, 4],
          intro: () => I18n.te('Para pedir una disculpa con elegancia:', 'To apologize with elegance:') },
    ];

    // ---------- Textos según idioma ----------
    const T = {
        saludo1: () => I18n.te('¡Hola! Bienvenido a Flora Elegante. Soy <strong>Flora</strong>, tu asistente virtual.',
            'Hello! Welcome to Flora Elegante. I\'m <strong>Flora</strong>, your virtual assistant.'),
        saludo2: () => I18n.te('Puedo mostrarte el catálogo, darte precios y tiempos de entrega, consultar tu carrito y <strong>agregar arreglos al carrito desde aquí</strong>. ¿Qué te gustaría hacer?',
            'I can show you the catalog, give you prices and delivery times, check your cart and <strong>add arrangements to the cart right from here</strong>. What would you like to do?'),
        qrArreglos: () => I18n.te('Ver arreglos', 'View arrangements'),
        qrCarrito: () => I18n.te('Mi carrito', 'My cart'),
        qrPrecios: () => I18n.te('Precios', 'Prices'),
        qrEntregas: () => I18n.te('Entregas', 'Deliveries'),
        qrPago: () => I18n.te('Métodos de pago', 'Payment methods'),
        qrFin: () => I18n.te('Eso es todo, gracias', 'That\'s all, thanks'),
        qrNueva: () => I18n.te('Nueva consulta', 'New question'),
        holaDeNuevo: () => I18n.te('¡Hola de nuevo! ¿Quieres ver el catálogo, consultar tu carrito o tienes otra pregunta?',
            'Hi again! Would you like to see the catalog, check your cart, or do you have another question?'),
        finConv: () => I18n.te('¡Me alegra haberte ayudado! Antes de terminar, ¿podrías calificar nuestra atención?',
            'Glad I could help! Before we finish, could you rate our service?'),
        catalogoIntro: () => I18n.te(
            `Claro, este es nuestro catálogo (${Data.productos.length} arreglos). Desliza para verlos y toca <strong>Agregar</strong> para llevarlos al carrito. Usa <strong>Ver más arreglos</strong> para ver otros:`,
            `Sure, here is our catalog (${Data.productos.length} arrangements). Swipe to see them and tap <strong>Add</strong> to put them in your cart. Use <strong>See more arrangements</strong> to see others:`),
        masArreglosIntro: () => I18n.te('Con gusto, aquí tienes más de nuestros arreglos:', 'Sure, here are more of our arrangements:'),
        masArreglosFin: () => I18n.te('…y con esto terminamos el catálogo. Vuelve a pulsar "Ver más arreglos" si quieres verlos desde el principio:',
            '…and that completes the catalog. Tap "See more arrangements" again to view from the start:'),
        qrOcasion: () => I18n.te('¿Para qué ocasión?', 'What\'s the occasion?'),
        agregado: p => I18n.te(
            `Listo: <strong>${Data.nombre(p)}</strong> (${Data.formatPrecio(p.precio)}) quedó en tu carrito. ¿Algo más?`,
            `Done: <strong>${Data.nombre(p)}</strong> (${Data.formatPrecio(p.precio)}) is now in your cart. Anything else?`),
        yaEnCarrito: () => I18n.te('Ese arreglo ya lo tienes en el carrito. Puedes subir la cantidad desde el panel.', 'That arrangement is already in your cart. You can increase the quantity from the drawer.'),
        agregar: () => I18n.te('Agregar', 'Add'),
        agregarCarrito: () => I18n.te('Agregar al carrito', 'Add to cart'),
        verMas: () => I18n.te('Ver más arreglos', 'See more arrangements'),
        carritoVacio: () => I18n.te('Tu carrito está vacío por ahora. ¿Quieres que te muestre nuestros arreglos?',
            'Your cart is empty for now. Would you like me to show you our arrangements?'),
        verCarrito: () => I18n.te('Ver mi carrito', 'View my cart'),
        graciasAlta: () => I18n.te('¡Gracias por tu excelente calificación!', 'Thank you for your excellent rating!'),
        graciasBaja: () => I18n.te('Gracias por tu honestidad. Trabajaremos para mejorar.', 'Thank you for your honesty. We\'ll work to improve.'),
        pedirSugerencia: () => I18n.te('¿Tienes alguna sugerencia para mejorar nuestro servicio? Puedes escribirla abajo o dejarla vacía si no tienes ninguna.',
            'Do you have any suggestions to improve our service? You can write it below or leave it empty if you don\'t have any.'),
        selecciona: () => I18n.te('Selecciona tu calificación:', 'Select your rating:'),
        estrella: n => I18n.te(`${n} estrella${n > 1 ? 's' : ''}`, `${n} star${n > 1 ? 's' : ''}`),
        sugerenciaPh: () => I18n.te('Escribe tu sugerencia aquí...', 'Write your suggestion here...'),
        enviarSugerencia: () => I18n.te('Enviar sugerencia', 'Send suggestion'),
        graciasSugerencia: () => I18n.te('¡Gracias por tu sugerencia! La hemos registrado para nuestro equipo de mejora continua.',
            'Thanks for your suggestion! We\'ve logged it for our continuous improvement team.'),
        despedida: () => I18n.te('¡Perfecto! Que tengas un excelente día. Vuelve cuando quieras.', 'Perfect! Have a wonderful day. Come back anytime.'),
        hastaPronto: () => I18n.te('Si necesitas algo más, no dudes en escribirnos. ¡Hasta pronto!', 'If you need anything else, don\'t hesitate to write to us. See you soon!'),
        toastRegistro: () => I18n.te('Calificación y sugerencia registradas', 'Rating and suggestion saved'),
    };

    function init() {
        const toggle = document.getElementById('chatToggle');
        if (!toggle) return;
        const widget = document.getElementById('chatWidget');
        const closeBtn = document.getElementById('chatClose');
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSend');

        toggle.addEventListener('click', openChat);
        closeBtn.addEventListener('click', closeChat);
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

        function openChat() {
            chatState.isOpen = true;
            widget.classList.remove('closed');
            widget.classList.add('open');
            toggle.classList.add('hidden');
            input.focus();

            if (chatState.phase === 'greeting') {
                setTimeout(() => {
                    addBotMessage(T.saludo1());
                    setTimeout(() => {
                        addBotMessage(T.saludo2());
                        showQuickReplies([T.qrArreglos(), T.qrCarrito(), T.qrPrecios(), T.qrEntregas()]);
                        chatState.phase = 'conversation';
                    }, 800);
                }, 400);
            }
        }

        function closeChat() {
            chatState.isOpen = false;
            widget.classList.remove('open');
            widget.classList.add('closed');
            toggle.classList.remove('hidden');
        }

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            removeQuickReplies();
            addUserMessage(text);
            chatState.messageCount++;

            if (chatState.phase === 'conversation') {
                processConversation(text);
            } else if (chatState.phase === 'suggestion') {
                // Texto libre durante la fase de sugerencia no rompe el flujo
                const inp = document.getElementById('suggestionInput');
                if (inp) { inp.value = text; }
            }
        }

        // ---------- Intenciones ----------

        function processConversation(text) {
            const t = norm(text);

            // 1. Carrito
            if (/carrito|canasta|mi compra|\bcart\b|\bbasket\b|my items/.test(t)) {
                respondCarrito();
                return;
            }

            // 2. Producto específico por nombre
            const prod = findProducto(text);
            if (prod) {
                chatState.lastProduct = prod.id;
                respondProducto(prod);
                return;
            }

            // 2b. Seguimiento: "sí / dale / agrégalo" sobre el último arreglo mostrado
            if (chatState.lastProduct && t.length <= 14 &&
                /^(si|sip|claro|dale|vale|va|ok|ese|ese mismo|agr[e]?galo|agregar|add it|yes|yeah|sure)\b/.test(t)) {
                const p = Data.productos.find(x => x.id === chatState.lastProduct);
                if (p) {
                    Cart.add(p.id);
                    botReply(T.agregado(p), [T.qrCarrito(), T.qrArreglos()]);
                }
                return;
            }

            // 2c. Ocasiones especiales → recomendación de arreglos con botón
            for (const oc of OCASIONES) {
                if (oc.re.test(t)) {
                    const prods = oc.ids.map(id => Data.productos.find(p => p.id === id)).filter(Boolean);
                    if (prods.length) {
                        chatState.lastProduct = prods[0].id;
                        showTyping(() => {
                            addBotMessage(oc.intro());
                            addProductCards(prods);
                        }, 800);
                    }
                    return;
                }
            }

            // 3. "Ver más arreglos" → muestra una página distinta (arreglos diferentes)
            if (/m[áa]s arregl|more arrangement|otros arregl|seguir viendo/.test(t)) {
                showMoreArrangements();
                return;
            }

            // 3b. Catálogo general (carrusel)
            if (/arregl|catalog|coleccion/.test(t) || /\b(productos|flores)\b/.test(t) || /^(ver|mostrar|muestrame|ensename)$/.test(t)
                || /\b(flowers|arrangements|products|bouquets?)\b/.test(t) || /^(show me|see|view)$/.test(t)) {
                respondCatalogo();
                return;
            }

            // 4. Fin de conversación (solo si no preguntó nada concreto)
            const endKeywords = ['gracias', 'genial', 'perfecto', 'excelente', 'ok', 'listo', 'nada mas', 'adios', 'eso es todo',
                'thanks', 'thank you', 'great', 'perfect', 'awesome', 'that\'s all', 'bye'];
            if (endKeywords.some(k => t.includes(k)) && chatState.messageCount >= 2 && t.length <= 30) {
                showTyping(() => {
                    addBotMessage(T.finConv());
                    setTimeout(showRatingUI, 600);
                    chatState.phase = 'rating';
                });
                return;
            }

            // Saludo repetido
            if (['hola', 'buenos', 'buenas', 'saludos', 'hello', 'hi ', 'hey'].some(k => t.includes(k)) && chatState.messageCount > 1) {
                botReply(T.holaDeNuevo(), [T.qrArreglos(), T.qrCarrito()]);
                return;
            }

            // 5. Respuestas generales por palabras clave (ES + EN, sin tildes también)
            let resp = null;
            for (const r of Data.botResponses) {
                if (r.keywords.some(k => t.includes(norm(k)))) { resp = r.resp; break; }
            }
            if (!resp) resp = Data.defaultResp;

            botReply(resp(), chatState.messageCount <= 2
                ? [T.qrArreglos(), T.qrCarrito(), T.qrPrecios(), T.qrEntregas()]
                : [T.qrFin(), T.qrArreglos()]);
        }

        function botReply(html, quickReplies = null) {
            const delay = Math.min(1600, 500 + html.length * 6);
            showTyping(() => {
                addBotMessage(html);
                if (quickReplies) showQuickReplies(quickReplies);
            }, delay);
        }

        function respondCatalogo() {
            chatState.carouselPage = 0;
            chatState.carouselVisited = true;
            showTyping(() => {
                addBotMessage(T.catalogoIntro());
                addProductCarousel(paginaActual());
            }, 900);
        }

        // "Ver más arreglos" → muestra una página distinta (siguientes arreglos)
        function showMoreArrangements() {
            const primeraVez = !chatState.carouselVisited;
            chatState.carouselVisited = true;
            showTyping(() => {
                if (primeraVez) {
                    chatState.carouselPage = 0;
                    addBotMessage(T.catalogoIntro());
                } else {
                    const ultima = chatState.carouselPage >= totalPaginas() - 1;
                    addBotMessage(ultima ? T.masArreglosFin() : T.masArreglosIntro());
                    chatState.carouselPage = (chatState.carouselPage + 1) % totalPaginas();
                }
                addProductCarousel(paginaActual());
            }, 700);
        }
        window.ShowMoreArrangements = showMoreArrangements;

        function respondProducto(p) {
            showTyping(() => {
                addBotMessage(
                    `<strong>${Data.nombre(p)}</strong><br>${Data.desc(p)}` +
                    `<span class="block mt-1 font-bold text-terra">${Data.formatPrecio(p.precio)}</span>` +
                    `<button onclick="Cart.add(${p.id})" class="mt-2 w-full bg-leaf hover:bg-leaf-light text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer">` +
                    `<i class="fa-solid fa-cart-plus mr-1"></i> ${T.agregarCarrito()}</button>` +
                    `<button onclick="ShowMoreArrangements()" class="mt-1.5 w-full border border-bord hover:bg-cream text-charcoal font-bold text-xs py-2 rounded-lg transition cursor-pointer">${T.verMas()}</button>`
                );
            }, 700);
        }

        function respondCarrito() {
            const n = Cart.count();
            showTyping(() => {
                if (n === 0) {
                    addBotMessage(T.carritoVacio());
                    showQuickReplies([T.qrArreglos()]);
                } else {
                    addBotMessage(
                        I18n.te(`Llevas <strong>${n}</strong> artículo${n > 1 ? 's' : ''} por un total de `,
                            `You have <strong>${n}</strong> item${n > 1 ? 's' : ''} totaling `) +
                        `<strong class="text-terra">${Data.formatPrecio(Cart.totalCOP())}</strong>.` +
                        `<button onclick="Cart.open()" class="mt-2 w-full bg-gold hover:bg-gold-light text-forest font-bold text-xs py-2 rounded-lg transition cursor-pointer">` +
                        `<i class="fa-solid fa-cart-shopping mr-1"></i> ${T.verCarrito()}</button>`
                    );
                }
            }, 700);
        }

        // Fila de producto reutilizable (catálogo completo y ocasiones)
        function productRow(p) {
            return `
                <div class="flex items-center gap-2 bg-white rounded-lg p-1.5">
                    <img src="${p.img}" alt="${Data.nombre(p)}" class="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy">
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-bold text-charcoal leading-tight truncate">${Data.nombre(p)}</p>
                        <p class="text-[11px] font-bold text-terra">${Data.formatPrecio(p.precio)}</p>
                    </div>
                    <button onclick="Cart.add(${p.id})" class="bg-leaf hover:bg-leaf-light text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md transition flex-shrink-0 cursor-pointer">${T.agregar()}</button>
                </div>`;
        }

        // Carrusel horizontal de arreglos dentro del chat (con "Ver más" si hay más)
        function addProductCarousel(prods) {
            const container = document.getElementById('chatMessages');
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-end gap-2 max-w-[95%]';
            wrapper.innerHTML = `
                ${botAvatar()}
                <div class="chat-bubble-bot p-2 w-full">
                    <div class="chat-carousel">${prods.map(carouselCard).join('')}</div>
                    ${totalPaginas() > 1
                        ? `<div class="flex gap-2 mt-2">
                             <button class="chat-more-btn" onclick="ShowMoreArrangements()">${T.verMas()}</button>
                             <button class="chat-more-btn" onclick="ChatAsk('${T.qrArreglos()}')">${T.qrArreglos()}</button>
                           </div>`
                        : ''}
                </div>`;
            container.appendChild(wrapper);
            container.scrollTop = container.scrollHeight;
        }

        // Tarjeta individual del carrusel (imagen, nombre, precio, agregar)
        function carouselCard(p) {
            return `
                <div class="chat-carousel-card bg-white rounded-xl overflow-hidden shadow-sm border border-bord flex flex-col">
                    <img src="${p.img}" alt="${Data.nombre(p)}" class="w-full h-24 object-cover flex-shrink-0" loading="lazy">
                    <div class="p-2 flex flex-col gap-1 flex-1">
                        <p class="text-[11px] font-bold text-charcoal leading-tight truncate">${Data.nombre(p)}</p>
                        <p class="text-[11px] font-bold text-terra">${Data.formatPrecio(p.precio)}</p>
                        <button onclick="Cart.add(${p.id})" class="mt-auto w-full bg-leaf hover:bg-leaf-light text-white text-[10px] font-bold py-1.5 rounded-md transition cursor-pointer">
                            <i class="fa-solid fa-cart-plus mr-1"></i>${T.agregar()}</button>
                    </div>
                </div>`;
        }

        // Recomendación por ocasión: tarjetas de los arreglos sugeridos
        function addProductCards(prods) {
            const container = document.getElementById('chatMessages');
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-end gap-2 max-w-[95%]';
            wrapper.innerHTML = `
                ${botAvatar()}
                <div class="chat-bubble-bot p-2 w-full space-y-1.5">
                    ${prods.map(productRow).join('')}
                </div>`;
            container.appendChild(wrapper);
            container.scrollTop = container.scrollHeight;
        }

        // ---------- Calificación con estrellas ----------
        window.handleRating = function (rating) {
            chatState.currentRating = rating;
            // Sombrea las estrellas hasta la seleccionada y las deja visibles un momento
            document.querySelectorAll('#ratingUI .star-btn').forEach((s, i) => {
                s.classList.toggle('active', i < rating);
                s.classList.remove('hovered');
            });

            setTimeout(() => {
                removeRatingUI();
                addBotMessage(rating >= 4 ? T.graciasAlta() : T.graciasBaja());
                setTimeout(() => {
                    addBotMessage(T.pedirSugerencia());
                    showSuggestionUI();
                    chatState.phase = 'suggestion';
                }, 600);
            }, 900);
        };

        // Sugerencia final → se registra la interacción para el reporte mensual
        window.handleSuggestion = function () {
            const inp = document.getElementById('suggestionInput');
            const text = inp?.value?.trim() || '';
            removeSuggestionUI();

            API.saveInteraccion({
                fecha: new Date().toISOString().split('T')[0],
                rating: chatState.currentRating,
                sugerencia: text,
                canal: 'chatbot',
            });

            showTyping(() => {
                addBotMessage(text ? T.graciasSugerencia() : T.despedida());
                setTimeout(() => {
                    addBotMessage(T.hastaPronto());
                    showQuickReplies([T.qrNueva(), T.qrArreglos()]);
                    chatState.phase = 'conversation';
                    chatState.messageCount = 0;
                }, 800);
            });

            showToast(T.toastRegistro(), 'info');
        };

        // Re-render de UI abierta si cambia el idioma
        document.addEventListener('fe:idioma', () => {
            const lbl = document.querySelector('#ratingUI p');
            if (lbl) lbl.textContent = T.selecciona();
            const ph = document.getElementById('suggestionInput');
            if (ph) ph.placeholder = T.sugerenciaPh();
        });
    }

    // ---------- Utilidades de render ----------
    function botAvatar() {
        return `<div class="w-7 h-7 rounded-full bg-white border border-bord flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src="img/logo.svg" alt="" class="w-5 h-5">
                </div>`;
    }

    function addBotMessage(text) {
        const container = document.getElementById('chatMessages');
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-end gap-2 max-w-[85%]';
        wrapper.innerHTML = `
            ${botAvatar()}
            <div class="chat-bubble-bot px-4 py-3 text-sm text-charcoal leading-relaxed">${text}</div>
        `;
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
    }

    function addUserMessage(text) {
        const container = document.getElementById('chatMessages');
        const wrapper = document.createElement('div');
        wrapper.className = 'flex justify-end';
        wrapper.innerHTML = `<div class="chat-bubble-user px-4 py-3 text-sm leading-relaxed max-w-[80%]">${text}</div>`;
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping(callback, delay = 1000) {
        const container = document.getElementById('chatMessages');
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-end gap-2 typing-indicator';
        wrapper.innerHTML = `
            ${botAvatar()}
            <div class="chat-bubble-bot px-4 py-3 flex gap-1.5">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
        setTimeout(() => {
            wrapper.remove();
            callback();
        }, delay);
    }

    function showQuickReplies(options) {
        removeQuickReplies();
        const area = document.getElementById('chatInputArea');
        const div = document.createElement('div');
        div.id = 'quickReplies';
        div.className = 'flex flex-wrap gap-2 mt-3';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'text-xs border border-leaf/30 text-leaf bg-leaf/5 px-3 py-1.5 rounded-full hover:bg-leaf hover:text-white transition cursor-pointer';
            btn.textContent = opt;
            btn.addEventListener('click', () => ask(opt));
            div.appendChild(btn);
        });
        area.appendChild(div);
    }

    function removeQuickReplies() {
        document.getElementById('quickReplies')?.remove();
    }

    function showRatingUI() {
        const area = document.getElementById('chatInputArea');
        const div = document.createElement('div');
        div.id = 'ratingUI';
        div.className = 'mt-3 text-center';
        div.innerHTML = `
            <p class="text-xs text-muted mb-2">${I18n.te('Selecciona tu calificación:', 'Select your rating:')}</p>
            <div class="flex justify-center gap-2">
                ${[1, 2, 3, 4, 5].map(i => `<button class="star-btn" data-star="${i}" aria-label="${I18n.te(`${i} estrella${i > 1 ? 's' : ''}`, `${i} star${i > 1 ? 's' : ''}`)}"><i class="fa-solid fa-star"></i></button>`).join('')}
            </div>
        `;
        area.appendChild(div);

        // Resaltado acumulativo: al pasar sobre la estrella N se sombrean 1..N
        const btns = div.querySelectorAll('.star-btn');
        const preview = n => btns.forEach((b, i) => b.classList.toggle('hovered', i < n));
        btns.forEach((b, idx) => {
            b.addEventListener('mouseenter', () => preview(idx + 1));
            b.addEventListener('click', () => {
                preview(idx + 1);
                if (typeof window.handleRating === 'function') window.handleRating(idx + 1);
            });
        });
        div.querySelector('.flex').addEventListener('mouseleave', () => {
            if (!chatState.currentRating) preview(0);
        });
    }

    function removeRatingUI() {
        document.getElementById('ratingUI')?.remove();
    }

    function showSuggestionUI() {
        const area = document.getElementById('chatInputArea');
        const div = document.createElement('div');
        div.id = 'suggestionUI';
        div.className = 'mt-3';
        div.innerHTML = `
            <input id="suggestionInput" type="text" placeholder="${I18n.te('Escribe tu sugerencia aquí...', 'Write your suggestion here...')}" class="w-full border border-bord rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 transition">
            <button onclick="handleSuggestion()" class="w-full mt-2 bg-forest text-white font-bold text-sm py-2.5 rounded-lg hover:bg-forest-light transition cursor-pointer">
                <i class="fa-solid fa-check mr-2"></i>${I18n.te('Enviar sugerencia', 'Send suggestion')}
            </button>
        `;
        area.appendChild(div);
        setTimeout(() => document.getElementById('suggestionInput')?.focus(), 100);
    }

    function removeSuggestionUI() {
        document.getElementById('suggestionUI')?.remove();
    }

    return { init };
})();
