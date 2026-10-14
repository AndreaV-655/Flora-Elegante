// ===================================================================
// CARRITO DE COMPRAS
// Persistencia en localStorage + panel lateral (drawer) con cantidades,
// eliminación de productos, total en COP y finalización del pedido.
// ===================================================================
const Cart = (() => {
    const KEY = 'fe_carrito';

    function read() {
        try {
            const v = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    }
    function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

    function count() { return read().reduce((s, i) => s + i.qty, 0); }

    function totalCOP() {
        return read().reduce((s, i) => {
            const p = Data.productos.find(p => p.id === i.id);
            return s + (p ? p.precio * i.qty : 0);
        }, 0);
    }

    // Verifica que la cantidad pedida no supere el inventario disponible
    function stockDisponible(id) {
        const p = Data.productos.find(p => p.id === id);
        return p ? Number(p.stock) : 0;
    }

    // Agrega un producto al carrito. `cant` permite agregar varias
// unidades de una vez (lo usa el chatbot cuando el cliente pide
// "agrégame dos"). Nunca supera el inventario disponible.
function add(id, cant = 1) {
        if (!Auth.session()) {
            showToast(I18n.te('Inicia sesión para agregar productos al carrito.', 'Log in to add products to your cart.'), 'info');
            return 0;
        }
        const p = Data.productos.find(p => p.id === id);
        if (!p) return 0;
        const items = read();
        const it = items.find(i => i.id === id);
        const actual = it ? it.qty : 0;
        const stock = stockDisponible(id);

        // Number(0) es 0: no debe convertirse en 1 por el "|| 1".
        const pedidas = Number.isFinite(Number(cant)) ? Math.floor(Number(cant)) : 1;
        const caben = Math.max(0, Math.min(pedidas, stock - actual));
        if (caben <= 0) {
            showToast(I18n.te(
                `Solo hay ${stock} unidad(es) disponible(s) de este producto.`,
                `Only ${stock} unit(s) of this product are available.`), 'info');
            return 0;
        }

        if (it) it.qty += caben;
        else items.push({ id, qty: caben });
        write(items);
        render();
        showToast(I18n.te(
            caben > 1 ? `${p.nombre} × ${caben} agregado al carrito` : `${p.nombre} agregado al carrito`,
            caben > 1 ? `${p.nombre} × ${caben} added to cart` : `${p.nombre} added to cart`), 'success');
        bounceBadge();
        return caben;
    }

    function setQty(id, delta) {
        let items = read();
        const it = items.find(i => i.id === id);
        if (!it) return;
        const nuevo = it.qty + delta;
        if (delta > 0 && nuevo > stockDisponible(id)) {
            showToast(I18n.te('Cantidad supera el inventario disponible.', 'Quantity exceeds available stock.'), 'info');
            return;
        }
        it.qty += delta;
        if (it.qty <= 0) items = items.filter(i => i.id !== id);
        write(items);
        render();
    }

    function remove(id) {
        write(read().filter(i => i.id !== id));
        render();
    }

    function clear() { write([]); render(); }

    // ---- UI ----
    function bounceBadge() {
        document.querySelectorAll('.cart-badge').forEach(b => {
            b.classList.remove('cart-bounce');
            void b.offsetWidth; // reinicia la animación
            b.classList.add('cart-bounce');
        });
    }

    function render() {
        // Badges (escritorio y móvil)
        const n = count();
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = n > 99 ? '99+' : n;
            badge.classList.toggle('hidden', n === 0);
        });

        // Lista del drawer
        const list = document.getElementById('cartItems');
        if (!list) return;
        const items = read();
        const empty = document.getElementById('cartEmpty');
        if (empty) {
            empty.classList.toggle('hidden', items.length > 0);
            empty.classList.toggle('flex', items.length === 0);
        }
        document.getElementById('cartFooter')?.classList.toggle('hidden', items.length === 0);

        list.innerHTML = items.map(i => {
            const p = Data.productos.find(p => p.id === i.id);
            if (!p) return '';
            return `
                <div class="flex gap-3 py-4 border-b border-bord">
                    <img src="${p.img}" alt="${Data.nombre(p)}" class="w-20 h-20 rounded-lg object-cover flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <h4 class="font-bold text-sm text-charcoal leading-snug">${Data.nombre(p)}</h4>
                            <button onclick="Cart.remove(${p.id})" class="text-muted hover:text-terra transition text-sm flex-shrink-0" aria-label="${I18n.te('Quitar', 'Remove')} ${Data.nombre(p)}">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                        <p class="text-gold font-bold text-sm mt-1">${Data.formatPrecio(p.precio)}</p>
                        <div class="flex items-center gap-3 mt-2">
                            <div class="inline-flex items-center border border-bord rounded-lg overflow-hidden">
                                <button onclick="Cart.setQty(${p.id}, -1)" class="w-8 h-8 hover:bg-cream transition text-charcoal" aria-label="Disminuir cantidad">−</button>
                                <span class="w-8 text-center text-sm font-bold">${i.qty}</span>
                                <button onclick="Cart.setQty(${p.id}, 1)" class="w-8 h-8 hover:bg-cream transition text-charcoal" aria-label="Aumentar cantidad">+</button>
                            </div>
                            <span class="text-muted text-xs">Subtotal: ${Data.formatPrecio(p.precio * i.qty)}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');

        const totalEl = document.getElementById('cartTotal');
        if (totalEl) totalEl.textContent = Data.formatPrecio(totalCOP());
    }

    // ¿El carrito está disponible en esta vista? (en la página de inicio está oculto)
    function disponible() {
        const d = document.getElementById('cartDrawer');
        return !!d && getComputedStyle(d).display !== 'none';
    }

    function openDrawer() {
        const drawer = document.getElementById('cartDrawer');
        // El carrito solo está disponible en la vista de cliente:
        // en la página de inicio está oculto, así que no se abre ni bloquea el scroll.
        if (!drawer || getComputedStyle(drawer).display === 'none') return;
        drawer.classList.remove('translate-x-full');
        const ov = document.getElementById('cartOverlay');
        ov?.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        document.getElementById('cartDrawer')?.classList.add('translate-x-full');
        document.getElementById('cartOverlay')?.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }

    // ---------------------------------------------------------------
    // ENTREGA · horario del negocio y validación de fecha/hora
    // Lun-Sáb 8:00-20:00 · Dom 9:00-14:00
    // ---------------------------------------------------------------
    const HORARIO = {
        0: [9, 14],                                              // domingo
        1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], // lunes a viernes
        6: [8, 20],                                              // sábado
    };

    function hoyISO() {
        const d = new Date();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    }

    // Valida fecha (YYYY-MM-DD) y hora (HH:MM) contra el horario del negocio.
    function validarEntrega(fecha, hora) {
        if (!fecha || !hora) {
            return { ok: false, msg: I18n.te('Elige una fecha y una hora de entrega.', 'Choose a delivery date and time.') };
        }
        const [y, m, d] = String(fecha).split('-').map(Number);
        const [hh, mi] = String(hora).split(':').map(Number);
        const dt = new Date(y, (m || 1) - 1, d, hh, mi || 0, 0, 0);
        if (isNaN(dt.getTime())) {
            return { ok: false, msg: I18n.te('La fecha u hora no es válida.', 'The date or time is not valid.') };
        }
        const [abre, cierra] = HORARIO[dt.getDay()];
        if (hh < abre || hh >= cierra) {
            return { ok: false, msg: I18n.te(
                `Ese día atendemos de ${abre}:00 a ${cierra}:00.`,
                `That day we deliver from ${abre}:00 to ${cierra}:00.`) };
        }
        if (dt <= new Date()) {
            return { ok: false, msg: I18n.te('La entrega debe ser en una fecha y hora futuras.', 'Delivery must be at a future date and time.') };
        }
        return { ok: true };
    }

    // Texto legible de la entrega: "lun 12 oct, 10:00"
    function formatoEntrega(fecha, hora) {
        const [y, m, d] = String(fecha).split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, d);
        const dias = I18n.te('dom,lun,mar,mié,jue,vie,sáb', 'Sun,Mon,Tue,Wed,Thu,Fri,Sat').split(',');
        const meses = I18n.te('ene,feb,mar,abr,may,jun,jul,ago,sep,oct,nov,dic', 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec').split(',');
        return `${dias[dt.getDay()]} ${dt.getDate()} ${meses[dt.getMonth()]}, ${hora}`;
    }

    // Teléfono guardado en el perfil. El checkout lo pide si aún no existe
    // (por ejemplo, en cuentas creadas desde el chatbot).
    let _telefonoPerfil = null;
    async function telefonoPerfil() {
        if (_telefonoPerfil !== null) return _telefonoPerfil;
        try {
            const r = await API.getPerfil();
            _telefonoPerfil = (r && r.perfil && r.perfil.telefono) ? String(r.perfil.telefono) : '';
        } catch (e) { _telefonoPerfil = ''; }
        return _telefonoPerfil;
    }

    // Nombre legible del tipo de ocasión especial.
    function etiquetaOcasion(tipo) {
        return ({
            cumpleanos: I18n.te('Cumpleaños', 'Birthday'),
            aniversario: I18n.te('Aniversario', 'Anniversary'),
            otro: I18n.te('Otra ocasión', 'Other occasion'),
        })[String(tipo || '').toLowerCase()] || '';
    }

    // Pide la fecha/hora de entrega y los datos extra del pedido
    // (teléfono, dedicatoria y ocasión especial) en una ventana modal.
    // Devuelve un objeto con todo, o null si el cliente cancela.
    async function pedirEntrega() {
        const telefonoGuardado = await telefonoPerfil();
        return new Promise(resolve => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 bg-forest/60 backdrop-blur-sm overflow-y-auto';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
                    <div class="px-6 py-5 border-b border-bord">
                        <h3 class="font-display font-bold text-xl text-charcoal">
                            <i class="fa-solid fa-truck-fast text-leaf mr-2"></i>${I18n.te('Programa tu entrega', 'Schedule your delivery')}
                        </h3>
                        <p class="text-xs text-muted mt-1">${I18n.te('Lunes a sábado 8:00-20:00 · Domingo 9:00-14:00', 'Monday to Saturday 8:00-20:00 · Sunday 9:00-14:00')}</p>
                    </div>
                    <div class="p-6 space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-bold text-charcoal mb-1">${I18n.te('Fecha de entrega', 'Delivery date')}</label>
                                <input id="entregaFecha" type="date" min="${hoyISO()}" class="w-full border border-bord rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-charcoal mb-1">${I18n.te('Hora de entrega', 'Delivery time')}</label>
                                <input id="entregaHora" type="time" class="w-full border border-bord rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-charcoal mb-1">${I18n.te('Teléfono de contacto', 'Contact phone')}</label>
                            <input id="entregaTelefono" type="tel" value="${telefonoGuardado}" placeholder="+57 300 123 4567" class="w-full border border-bord rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-charcoal mb-1">${I18n.te('Dedicatoria (opcional)', 'Dedication (optional)')}</label>
                            <textarea id="entregaDedicatoria" rows="2" maxlength="500" placeholder="${I18n.te('Mensaje para la tarjeta', 'Message for the card')}" class="w-full border border-bord rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"></textarea>
                        </div>
                        <div class="rounded-lg border border-bord p-3 space-y-3">
                            <div class="flex items-start gap-2">
                                <input id="entregaEvento" type="checkbox" class="mt-0.5 w-4 h-4 accent-leaf cursor-pointer">
                                <label for="entregaEvento" class="text-xs text-charcoal cursor-pointer">${I18n.te('¿Es para una ocasión especial?', 'Is it for a special occasion?')}</label>
                            </div>
                            <div id="entregaOcasionBox" class="hidden space-y-3 pl-6">
                                <div>
                                    <label class="block text-xs font-bold text-charcoal mb-1">${I18n.te('Tipo de ocasión', 'Occasion type')}</label>
                                    <select id="entregaOcasion" class="w-full border border-bord rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-leaf">
                                        <option value="cumpleanos">${I18n.te('Cumpleaños', 'Birthday')}</option>
                                        <option value="aniversario">${I18n.te('Aniversario', 'Anniversary')}</option>
                                        <option value="otro">${I18n.te('Otra ocasión', 'Other occasion')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-charcoal mb-1">${I18n.te('Fecha de la ocasión', 'Occasion date')}</label>
                                    <input id="entregaFechaOcasion" type="date" min="${hoyISO()}" class="w-full border border-bord rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-leaf">
                                </div>
                            </div>
                        </div>
                        <p id="entregaError" class="hidden text-terra text-xs"></p>
                    </div>
                    <div class="px-6 pb-6 flex gap-2">
                        <button id="entregaCancelar" class="flex-1 border border-bord rounded-lg py-2.5 text-sm font-bold text-muted hover:bg-cream transition cursor-pointer">${I18n.te('Cancelar', 'Cancel')}</button>
                        <button id="entregaConfirmar" class="flex-1 bg-leaf hover:bg-leaf-light text-white rounded-lg py-2.5 text-sm font-bold transition cursor-pointer">${I18n.te('Confirmar', 'Confirm')}</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            const $ = sel => modal.querySelector(sel);
            const errEl = $('#entregaError');
            const cerrar = val => { modal.remove(); document.body.style.overflow = ''; resolve(val); };
            const mostrarError = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

            const eventoChk = $('#entregaEvento');
            const ocasionBox = $('#entregaOcasionBox');
            eventoChk.addEventListener('change', () => {
                ocasionBox.classList.toggle('hidden', !eventoChk.checked);
                const fechaOc = $('#entregaFechaOcasion');
                if (eventoChk.checked && !fechaOc.value) fechaOc.value = $('#entregaFecha').value || hoyISO();
            });

            $('#entregaCancelar').addEventListener('click', () => cerrar(null));
            modal.addEventListener('click', e => { if (e.target === modal) cerrar(null); });
            $('#entregaConfirmar').addEventListener('click', () => {
                const fecha = $('#entregaFecha').value;
                const hora = $('#entregaHora').value;
                const v = validarEntrega(fecha, hora);
                if (!v.ok) { mostrarError(v.msg); return; }

                const telefono = ($('#entregaTelefono').value || '').trim();
                const digitos = telefono.replace(/\D/g, '');
                if (!telefono) { mostrarError(I18n.te('Escribe un teléfono de contacto.', 'Enter a contact phone number.')); return; }
                if (digitos.length < 7 || digitos.length > 15) {
                    mostrarError(I18n.te('El teléfono debe tener entre 7 y 15 dígitos.', 'The phone must have between 7 and 15 digits.')); return;
                }

                const evento = eventoChk.checked;
                const fechaOcasion = evento ? ($('#entregaFechaOcasion').value || fecha) : '';
                cerrar({
                    fecha, hora, telefono,
                    dedicatoria: ($('#entregaDedicatoria').value || '').trim(),
                    evento,
                    ocasion: evento ? $('#entregaOcasion').value : '',
                    fechaOcasion,
                });
            });
            $('#entregaFecha').focus();
        });
    }

    // La factura llega a la cuenta de Gmail del cliente (la enviará n8n).
    function msgFacturaGmail(email) {
        return I18n.te(
            `Tu factura está en tu cuenta de Gmail (${email}).`,
            `Your invoice is in your Gmail account (${email}).`);
    }

    async function checkout(opts = {}) {
        if (count() === 0) return false;
        if (!Auth.session()) {
            showToast(I18n.te('Inicia sesión para finalizar tu pedido', 'Log in to place your order'), 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 900);
            return false;
        }

        // La entrega es obligatoria. Desde el chat ya viene resuelta por el bot;
        // desde el carrito se pide aquí con una ventana modal.
        let entrega = opts.entrega || null;
        if (!entrega && !opts.fromChat) {
            entrega = await pedirEntrega();
            if (!entrega) return false;
        }
        if (!entrega) return false;

        const items = read().map(i => {
            const p = Data.productos.find(p => p.id === i.id);
            return { id: p.id, nombre: p.nombre, qty: i.qty, precio: p.precio };
        });
        const email = Auth.session().email;

        const btn = document.getElementById('checkoutBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${I18n.te('Procesando...', 'Processing...')}`; }

        try {
            const creado = await API.savePedido({
                items,
                entrega: `${entrega.fecha} ${entrega.hora}`,
                evento: !!entrega.evento,
                ocasion: entrega.ocasion || '',
                fechaOcasion: entrega.fechaOcasion || '',
                dedicatoria: entrega.dedicatoria || '',
                telefono: entrega.telefono || '',
            });
            clear();
            closeDrawer();
            const etiqueta = etiquetaOcasion(entrega.ocasion);
            const eventoNota = entrega.evento
                ? ' · ' + (etiqueta || I18n.te('Ocasión especial', 'Special occasion'))
                : '';
            showToast(I18n.te(
                `¡Pedido #${creado.id} realizado! Total: ${Data.formatPrecio(creado.total)} · Entrega: ${formatoEntrega(entrega.fecha, entrega.hora)}${eventoNota}.`,
                `Order #${creado.id} placed! Total: ${Data.formatPrecio(creado.total)} · Delivery: ${formatoEntrega(entrega.fecha, entrega.hora)}${eventoNota}.`), 'success');
            // Desde el chat lo anuncia el propio bot; desde el carrito, un mensaje en pantalla.
            if (!opts.fromChat) showToast(msgFacturaGmail(email), 'info');
            // Recargar el catálogo para reflejar el inventario actualizado
            API.cargarCatalogo().then(() => {
                document.dispatchEvent(new Event('fe:catalogo'));
            });
            return true;
        } catch (e) {
            showToast(e.message || I18n.te('No se pudo realizar el pedido.', 'Could not place the order.'), 'error');
            return false;
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-bag-shopping mr-2"></i>${I18n.te('Finalizar compra', 'Checkout')}`; }
        }
    }

    function init() {
        document.getElementById('cartBtn')?.addEventListener('click', () => { render(); openDrawer(); });
        document.getElementById('cartBtnMv')?.addEventListener('click', () => {
            document.getElementById('mobileMenu')?.classList.add('hidden');
            render(); openDrawer();
        });
        document.getElementById('cartClose')?.addEventListener('click', closeDrawer);
        document.getElementById('cartOverlay')?.addEventListener('click', closeDrawer);
        document.getElementById('checkoutBtn')?.addEventListener('click', () => checkout());
        document.addEventListener('fe:idioma', render);
        document.addEventListener('fe:moneda', render);
        render();
    }

    return { add, setQty, remove, clear, count, totalCOP, items: read, render, init, open: openDrawer, close: closeDrawer, checkout, disponible, facturaGmail: msgFacturaGmail, validarEntrega, formatoEntrega, pedirEntrega, telefonoPerfil, etiquetaOcasion };
})();
window.Cart = Cart;
