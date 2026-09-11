// ===================================================================
// CATÁLOGO DE PRODUCTOS · Carrusel horizontal
// ===================================================================
const Catalog = (() => {

    function render() {
        const track = document.getElementById('carouselTrack');
        if (!track) return;
        track.innerHTML = Data.productos.map(p => `
            <article class="product-card carousel-card bg-white rounded-2xl overflow-hidden shadow-sm border border-bord snap-start">
                <div class="relative h-56 overflow-hidden">
                    <img src="${p.img}" alt="${Data.nombre(p)}" class="w-full h-full object-cover" loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent"></div>
                    <div class="overlay-btn absolute bottom-4 left-4 right-4">
                        <button onclick="Cart.add(${p.id})" class="w-full bg-white/95 text-forest font-bold text-sm py-2.5 rounded-lg hover:bg-white transition cursor-pointer">
                            <i class="fa-solid fa-cart-plus mr-2"></i>${I18n.te('Agregar al carrito', 'Add to cart')}
                        </button>
                    </div>
                    <span class="absolute top-4 right-4 bg-gold text-forest text-xs font-bold px-3 py-1 rounded-full">${Data.formatPrecio(p.precio)}</span>
                </div>
                <div class="p-6">
                    <h3 class="font-display font-bold text-lg text-charcoal mb-2">${Data.nombre(p)}</h3>
                    <p class="text-muted text-sm leading-relaxed mb-4">${Data.desc(p)}</p>
                    <button onclick="Cart.add(${p.id})" class="sm:hidden w-full bg-forest text-white font-bold text-sm py-2.5 rounded-lg hover:bg-forest-light transition cursor-pointer">
                        <i class="fa-solid fa-cart-plus mr-2"></i>${I18n.te('Agregar al carrito', 'Add to cart')}
                    </button>
                </div>
            </article>
        `).join('');
    }

    // Flechas de navegación + estado de deshabilitado en los extremos
    function initArrows() {
        const track = document.getElementById('carouselTrack');
        const prev = document.getElementById('carPrev');
        const next = document.getElementById('carNext');
        if (!track || !prev || !next) return;

        const step = () => Math.max(track.clientWidth * 0.8, 280);

        prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
        next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

        function update() {
            const max = track.scrollWidth - track.clientWidth - 4;
            prev.disabled = track.scrollLeft <= 4;
            next.disabled = track.scrollLeft >= max;
        }
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    return {
        init() {
            render();
            initArrows();
            document.addEventListener('fe:idioma', render);
            document.addEventListener('fe:moneda', render);
        }
    };
})();
