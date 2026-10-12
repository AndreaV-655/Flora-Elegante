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

    function openDrawer() {
        document.getElementById('cartDrawer')?.classList.remove('translate-x-full');
        const ov = document.getElementById('cartOverlay');
        ov?.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        document.getElementById('cartDrawer')?.classList.add('translate-x-full');
        document.getElementById('cartOverlay')?.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }

    async function checkout() {
        if (count() === 0) return;
        if (!Auth.session()) {
            showToast(I18n.te('Inicia sesión para finalizar tu pedido', 'Log in to place your order'), 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 900);
            return;
        }
        const items = read().map(i => {
            const p = Data.productos.find(p => p.id === i.id);
            return { id: p.id, nombre: p.nombre, qty: i.qty, precio: p.precio };
        });
        const email = Auth.session().email;

        const btn = document.getElementById('checkoutBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${I18n.te('Procesando...', 'Processing...')}`; }

        try {
            const creado = await API.savePedido({ items, email });
            clear();
            closeDrawer();
            mostrarRecibo(creado);
            showToast(I18n.te(
                `¡Pedido #${creado.id} realizado! Total: ${Data.formatPrecio(creado.total)}.`,
                `Order #${creado.id} placed! Total: ${Data.formatPrecio(creado.total)}.`), 'success');
            // Recargar el catálogo para reflejar el inventario actualizado
            API.cargarCatalogo().then(() => {
                document.dispatchEvent(new Event('fe:catalogo'));
            });
        } catch (e) {
            showToast(e.message || I18n.te('No se pudo realizar el pedido.', 'Could not place the order.'), 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-bag-shopping mr-2"></i>${I18n.te('Finalizar compra', 'Checkout')}`; }
        }
    }

    // ============================================================
    // RECIBO con el código único del pedido
    // ============================================================
    function mostrarRecibo(pedido) {
        const r = pedido.recibo || {};
        const lineas = r.lineas || [];
        const en = (window.I18n ? I18n.lang() : 'es') === 'en';

        const filas = lineas.map(it => `
            <div class="flex items-center justify-between gap-3 py-2 border-b border-bord">
                <span class="text-sm text-charcoal">${it.cantidad} × ${esc((window.I18n ? I18n.te(it.nombre, it.nombreEn || it.nombre) : it.nombre))}</span>
                <span class="text-sm font-bold text-charcoal">${esc(Data.formatPrecio(it.subtotal))}</span>
            </div>`).join('');

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[120] flex items-center justify-center p-4 bg-forest/60 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div class="px-6 py-5 text-center bg-cream/60 border-b border-bord">
                    <div class="w-14 h-14 rounded-full bg-leaf/10 flex items-center justify-center mx-auto mb-3">
                        <i class="fa-solid fa-check text-leaf text-2xl"></i>
                    </div>
                    <h3 class="font-display font-bold text-2xl text-charcoal">${en ? 'Purchase completed' : '¡Compra realizada!'}</h3>
                    <p class="text-sm text-muted mt-1">${en ? 'Order' : 'Pedido'} #${esc(String(pedido.id))}</p>
                </div>

                <div class="p-6">
                    <div class="text-center mb-5">
                        <p class="text-xs uppercase tracking-wider text-muted font-bold mb-1">${en ? 'Receipt code' : 'Código del recibo'}</p>
                        <p class="font-display font-bold text-3xl text-terra tracking-wider">${esc(pedido.codigo || '—')}</p>
                        <p class="text-[10px] text-muted mt-1">${en ? 'Flora Elegante receipt' : 'Recibo de Flora Elegante'}</p>
                    </div>

                    <div class="border-t border-bord pt-1">
                        ${filas || `<p class="text-sm text-muted py-2">${en ? 'No items' : 'Sin productos'}</p>`}
                        <div class="flex items-center justify-between pt-3 mt-1 border-t border-bord">
                            <span class="font-bold text-charcoal">${en ? 'Total' : 'Total'}</span>
                            <span class="font-display font-bold text-xl text-forest">${esc(Data.formatPrecio(pedido.total))}</span>
                        </div>
                    </div>

                    <button id="reciboCerrar" class="btn-primary w-full mt-6">
                        <i class="fa-solid fa-check mr-2"></i>${en ? 'Done' : 'Entendido'}
                    </button>
                    <p class="text-[11px] text-muted text-center mt-3">
                        ${en ? 'Keep this code to track your order.' : 'Guarda este código para dar seguimiento a tu pedido.'}
                    </p>
                </div>
            </div>`;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const cerrar = () => {
            modal.remove();
            document.body.style.overflow = '';
        };
        modal.querySelector('#reciboCerrar').addEventListener('click', cerrar);
        modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
    }

    // Escapa lo que llega del servidor antes de inyectarlo como HTML.
    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
    }

    function init() {
        document.getElementById('cartBtn')?.addEventListener('click', () => { render(); openDrawer(); });
        document.getElementById('cartBtnMv')?.addEventListener('click', () => {
            document.getElementById('mobileMenu')?.classList.add('hidden');
            render(); openDrawer();
        });
        document.getElementById('cartClose')?.addEventListener('click', closeDrawer);
        document.getElementById('cartOverlay')?.addEventListener('click', closeDrawer);
        document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
        document.addEventListener('fe:idioma', render);
        document.addEventListener('fe:moneda', render);
        render();
    }

    return { add, setQty, remove, clear, count, totalCOP, items: read, render, init, open: openDrawer, close: closeDrawer };
})();
window.Cart = Cart;
