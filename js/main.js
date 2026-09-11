// ===================================================================
// ARRANQUE POR PÁGINA (data-page en <body>)
// ===================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page || '';

    // Idioma y moneda: SIEMPRE primero (aplica preferencias guardadas
    // y conecta los botones de cambio antes de cualquier render).
    I18n.init();

    // Sincroniza la sesión local con el backend (cookie de sesión PHP).
    try { await Auth.syncSession(); } catch (e) { /* sin backend → modo local */ }

    if (page === 'login') {
        Auth.renderNavAuth();
        Auth.initLoginPage();
        return;
    }

    Auth.renderNavAuth();

    // Seguridad: si el navegador restaura una vista protegida desde la
    // caché (botón atrás) sin sesión activa, se recarga.
    function protegerVista() {
        window.addEventListener('pageshow', (e) => {
            if (e.persisted && !Auth.session()) window.location.reload();
        });
    }

    // Carga el catálogo desde la base de datos antes de renderizar.
    // Si el backend no está disponible, se mantienen los datos semilla.
    async function precargarCatalogo() {
        try { await API.cargarCatalogo(); }
        catch (e) { console.warn('Catálogo: usando datos locales.', e); }
    }

    if (page === 'admin') {
        if (Auth.requireAdmin('login.html')) {
            protegerVista();
            await precargarCatalogo();
            AdminPanel.init();
            Report.init();
        }
        return;
    }

    // Vista de cliente: catálogo + mis datos + historial de compras
    if (page === 'cliente') {
        const sesion = Auth.session();
        if (!sesion) {
            window.location.href = 'login.html';
            return;
        }
        protegerVista();
        const saludo = document.getElementById('saludoCliente');
        if (saludo) saludo.textContent = `${I18n.te('Hola', 'Hi')}, ${sesion.nombre.split(' ')[0]}`;
        await precargarCatalogo();
        Effects.init();
        Cart.init();
        Catalog.init();
        Form.init();
        Historial.init();
        return;
    }

    // Página principal
    await precargarCatalogo();
    Effects.init();
    Cart.init();
    Catalog.init();
    Form.init();
    Chat.init();
});
