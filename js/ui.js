// ===================================================================
// UI: toasts, efectos de scroll, pétalos y menú móvil
// ===================================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-leaf text-white',
        error: 'bg-terra text-white',
        info: 'bg-forest text-white',
    };
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
    };
    toast.className = `toast pointer-events-auto ${colors[type]} px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium max-w-sm`;
    toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
window.showToast = showToast;

const Effects = (() => {

    function initScrollEffects() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    function initNavScroll() {
        const nav = document.getElementById('mainNav');
        if (!nav) return;
        window.addEventListener('scroll', () => {
            nav.classList.toggle('nav-scrolled', window.scrollY > 80);
        }, { passive: true });
    }

    function createPetals() {
        const container = document.getElementById('petalsContainer');
        if (!container) return;
        // Respetar preferencia de movimiento reducido
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        function spawnPetal() {
            const petal = document.createElement('div');
            petal.className = 'petal';
            const size = Math.random() * 10 + 8;
            petal.style.width = size + 'px';
            petal.style.height = (size * 1.5) + 'px';
            petal.style.left = Math.random() * 100 + '%';
            petal.style.animationDuration = (Math.random() * 4 + 5) + 's';
            petal.style.opacity = Math.random() * 0.5 + 0.2;
            const colors = ['#e8a0bf', '#c9584d88', '#f0c4d4', '#d4726a99', '#c9a96e66'];
            petal.style.background = `radial-gradient(ellipse at 30% 30%, ${colors[Math.floor(Math.random() * colors.length)]}, transparent)`;
            container.appendChild(petal);
            setTimeout(() => petal.remove(), 10000);
        }

        for (let i = 0; i < 8; i++) setTimeout(spawnPetal, i * 400);
        setInterval(spawnPetal, 1200);
    }

    function initMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const menu = document.getElementById('mobileMenu');
        if (!btn || !menu) return;
        btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));
    }

    return {
        init() {
            initScrollEffects();
            initNavScroll();
            createPetals();
            initMobileMenu();
        }
    };
})();
