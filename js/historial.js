// ===================================================================
// HISTORIAL DE COMPRAS DEL CLIENTE
// Muestra únicamente los pedidos asociados al correo de la sesión.
// ===================================================================
const Historial = (() => {

    const fmtFecha = iso => {
        const [y, m, d] = String(iso).split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(I18n.lang() === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const estadoTxt = e => ({
        'Confirmado': I18n.te('Confirmado', 'Confirmed'),
        'Entregado': I18n.te('Entregado', 'Delivered'),
        'En camino': I18n.te('En camino', 'On its way'),
        'Cancelado': I18n.te('Cancelado', 'Cancelled'),
    }[e] || e);

    // Normaliza un pedido del backend al formato esperado por la vista
    function normalizar(p) {
        const items = (p.items || []).map(it => ({
            cantidad: Number(it.cantidad),
            nombre: it.nombre_en ? (I18n.lang() === 'en' ? it.nombre_en : it.nombre) : it.nombre,
            precio: Number(it.precio_unitario),
        }));
        return {
            id: p.id,
            fecha: String(p.fecha).slice(0, 10),
            estado: p.estado,
            total: Number(p.total),
            email: p.email,
            items,
        };
    }

    function card(p) {
        const itemsHtml = p.items.map(it => `
            <li class="flex justify-between gap-4 text-sm">
                <span class="text-charcoal"><i class="fa-solid fa-seedling text-leaf text-xs mr-2"></i>${it.cantidad} × ${it.nombre}</span>
                <span class="text-muted whitespace-nowrap">${Data.formatPrecio(it.precio * it.cantidad)}</span>
            </li>`).join('');
        return `
        <article class="bg-white rounded-xl border border-bord p-6 shadow-sm">
            <header class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-bord">
                <div>
                    <p class="font-display font-bold text-charcoal">${I18n.te('Pedido', 'Order')} #${p.id}</p>
                    <p class="text-xs text-muted mt-1"><i class="fa-regular fa-calendar mr-1"></i>${fmtFecha(p.fecha)}</p>
                </div>
                <span class="text-xs px-3 py-1 rounded-full bg-leaf/10 text-leaf font-bold">${estadoTxt(p.estado)}</span>
            </header>
            <ul class="space-y-2">${itemsHtml}</ul>
            <footer class="flex justify-between items-center pt-4 mt-4 border-t border-bord">
                <span class="text-sm font-bold text-charcoal uppercase tracking-wide">${I18n.te('Total', 'Total')}</span>
                <span class="font-display font-bold text-lg text-terra">${Data.formatPrecio(p.total)}</span>
            </footer>
        </article>`;
    }

    async function cargar() {
        const listEl = document.getElementById('historialList');
        const emptyEl = document.getElementById('historialEmpty');
        const countEl = document.getElementById('historialCount');
        if (!listEl || !Auth.session()) return;

        try {
            const pedidos = await API.getPedidos();
            const mios = pedidos
                .map(normalizar)
                .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.id || 0) - (a.id || 0));

            if (countEl) {
                countEl.textContent = mios.length;
                countEl.dataset.noI18n = '1';
            }
            listEl.innerHTML = mios.map(card).join('');
            if (!mios.length && emptyEl) {
                emptyEl.classList.remove('hidden');
                listEl.classList.add('hidden');
            }
        } catch (e) {
            console.error(e);
        }
    }

    function init() {
        cargar();
        document.addEventListener('fe:idioma', cargar);
        document.addEventListener('fe:moneda', cargar);
    }

    return { init };
})();
