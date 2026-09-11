// ===================================================================
// AUTENTICACIÓN Y ROLES (backend PHP + MySQL)
// -------------------------------------------------------------------
// El login/registro se resuelve en el servidor (password_hash bcrypt).
// La sesión del navegador viaja por cookie (credenciales same-origin).
// En localStorage solo guardamos una caché ligera para pintar la barra
// de navegación y proteger las vistas; la fuente de verdad es el backend.
// ===================================================================
const Auth = (() => {
    const SESSION_KEY = 'fe_session';
    const ROLES = { CLIENTE: 'cliente', ADMIN: 'administrador' };

    function read(key, fallback) {
        try {
            const v = JSON.parse(localStorage.getItem(key));
            return v === null || v === undefined ? fallback : v;
        } catch (e) { return fallback; }
    }
    function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    function session() { return read(SESSION_KEY, null); }
    function isAdmin() { const s = session(); return !!s && s.rol === ROLES.ADMIN; }

    function setSession(u) {
        if (!u) { localStorage.removeItem(SESSION_KEY); return; }
        write(SESSION_KEY, { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, loginAt: new Date().toISOString() });
    }

    async function login(email, password) {
        try {
            const r = await API.login(email, password);
            if (!r.ok) return { ok: false, msg: r.msg };
            setSession(r.user);
            return { ok: true, user: r.user };
        } catch (e) {
            return { ok: false, msg: e.message };
        }
    }

    async function register({ nombre, email, password, ...perfil }) {
        try {
            const r = await API.register({ nombre, email, password, ...perfil });
            setSession(r.user);
            return { ok: true, user: r.user };
        } catch (e) {
            return { ok: false, msg: e.message };
        }
    }

    async function logout() {
        try { await API.logout(); } catch (e) { /* noop */ }
        localStorage.removeItem(SESSION_KEY);
    }

    // Sincroniza la sesión local con el backend (al cargar una página)
    async function syncSession() {
        const server = await API.getSesion();
        if (server) setSession(server);
        else localStorage.removeItem(SESSION_KEY);
    }

    async function updatePassword(email, newPassword) {
        try {
            const r = await API.updatePassword(newPassword);
            return { ok: r.ok, msg: '' };
        } catch (e) {
            return { ok: false, msg: e.message };
        }
    }

    function requireAdmin(loginUrl = 'login.html') {
        if (!isAdmin()) {
            window.location.replace(loginUrl + '?denegado=1');
            return false;
        }
        return true;
    }

    // Cierra sesión y saca al usuario de las vistas protegidas
    async function cerrarSesionYRedirigir() {
        const page = document.body.dataset.page;
        await logout();
        renderNavAuth();
        showToast(I18n.te('Sesión cerrada correctamente', 'Signed out successfully'), 'info');
        if (page === 'admin' || page === 'cliente' || page === 'login') {
            setTimeout(() => { window.location.href = 'index.html'; }, 600);
        }
    }

    // Pinta los controles de sesión en la navegación
    function renderNavAuth() {
        const s = session();
        const box = document.getElementById('navAuth');
        if (box) {
            box.innerHTML = s
                ? `<span class="text-white/80 text-sm"><i class="fa-solid fa-user mr-1 text-gold"></i>${s.nombre.split(' ')[0]}</span>
                   ${s.rol === ROLES.ADMIN ? '<a href="admin.html" class="text-gold hover:text-gold-light text-sm font-bold transition">Panel</a>' : '<a href="cliente.html" class="text-gold hover:text-gold-light text-sm font-bold transition">Mi cuenta</a>'}
                   <button id="logoutBtn" class="text-white/60 hover:text-white text-sm transition">Salir</button>`
                : `<a href="login.html" class="text-white/80 hover:text-white text-sm transition">Iniciar sesión</a>
                   <a href="index.html#registro" class="bg-gold text-forest font-bold text-sm px-5 py-2 rounded-lg hover:bg-gold-light transition">Crear cuenta</a>`;
            document.getElementById('logoutBtn')?.addEventListener('click', () => cerrarSesionYRedirigir());
        }
        const mm = document.getElementById('mobileAuth');
        if (mm) {
            mm.innerHTML = s
                ? `<span class="block py-2 text-gold text-sm"><i class="fa-solid fa-user mr-1"></i>${s.nombre.split(' ')[0]}${s.rol === ROLES.ADMIN ? ' · <a href="admin.html" class="underline">Panel</a>' : ' · <a href="cliente.html" class="underline">Mi cuenta</a>'}</span>
                   <button id="logoutBtnMv" class="block py-2 text-white/60 hover:text-white text-sm text-left w-full">Cerrar sesión</button>`
                : `<a href="login.html" class="block py-3 text-white/80 hover:text-white border-b border-white/10">Iniciar sesión</a>
                   <a href="index.html#registro" class="block py-3 text-gold font-bold">Crear cuenta</a>`;
            document.getElementById('logoutBtnMv')?.addEventListener('click', () => cerrarSesionYRedirigir());
        }
        const adminName = document.getElementById('adminUserName');
        if (adminName && s) adminName.innerHTML = `<i class="fa-solid fa-user-shield text-gold"></i>${s.nombre}`;
    }

    // Lógica de la página de login
    function initLoginPage() {
        const form = document.getElementById('loginForm');
        if (!form) return;
        const errEl = document.getElementById('loginError');
        const notice = document.getElementById('loginNotice');

        const params = new URLSearchParams(window.location.search);
        if (params.get('denegado')) {
            notice.className = 'mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200';
            notice.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Administrators only. Please log in with an authorized account.';
        } else if (params.get('registrado')) {
            notice.className = 'mb-4 p-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200';
            notice.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Account created! You can now log in.';
        }

        const fill = (email, pass) => {
            form.email.value = email;
            form.password.value = pass;
        };
        document.getElementById('fillAdmin')?.addEventListener('click', () => fill('admin@floraelegante.mx', 'Admin2025*'));
        document.getElementById('fillCliente')?.addEventListener('click', () => fill('cliente@demo.mx', 'Cliente123*'));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errEl.classList.add('hidden');
            const email = form.email.value.trim();
            const password = form.password.value;
            if (!email || !password) {
                errEl.textContent = I18n.te('Completa correo y contraseña.', 'Please fill in email and password.');
                errEl.classList.remove('hidden');
                return;
            }
            const btn = form.querySelector('button[type="submit"]');
            const orig = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Verificando...';

            const r = await login(email, password);
            if (!r.ok) {
                errEl.textContent = r.msg;
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = orig;
                return;
            }
            showToast(I18n.te(`Bienvenido/a, ${r.user.nombre}`, `Welcome, ${r.user.nombre}`), 'success');
            setTimeout(() => {
                window.location.href = r.user.rol === ROLES.ADMIN ? 'admin.html' : 'cliente.html';
            }, 600);
        });
    }

    return { login, register, logout, syncSession, updatePassword, session, isAdmin, requireAdmin, renderNavAuth, initLoginPage, ROLES };
})();
