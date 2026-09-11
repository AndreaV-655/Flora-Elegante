// ===================================================================
// CAPA DE ACCESO A DATOS (backend PHP + MySQL)
// -------------------------------------------------------------------
// La app se ejecuta bajo XAMPP (Apache). Todos los datos viven en la
// base de datos MySQL "flora_elegante" y se consultan a través de los
// endpoints PHP de /api/.
//
// BASE_URL apunta al front controller:  api/index.php
// ===================================================================
const API = (() => {
    // URL absoluta de la API (front controller). Se resuelve contra la
    // página actual para que funcione desde cualquier carpeta de XAMPP.
    const BASE_URL = (() => {
        try {
            return new URL('api/index.php', document.baseURI).href;
        } catch (e) {
            return 'api/index.php';
        }
    })();
    // El carrito persiste en localStorage, pero los productos, pedidos,
    // usuarios e interacciones viven en la base de datos.

    // Si se abrió el HTML directamente (doble clic, file://), el fetch no puede
    // alcanzar PHP. Se avisa con claridad para que el usuario use el servidor.
    function avisoLocal() {
        try {
            if (window.location.protocol === 'file:') {
                return 'La app debe abrirse desde el servidor (http://localhost). Abre index.html usando XAMPP/Apache, no con doble clic.';
            }
        } catch (e) { /* sin window (entorno no navegador) */ }
        return '';
    }

    async function networkError(ex) {
        const local = avisoLocal();
        if (local) throw new Error(local);
        throw new Error('No se pudo conectar con el servidor (Failed to fetch). Verifica que XAMPP/Apache esté activo y que la app se abra por http://localhost.');
    }

    async function request(resource, action, data = null, method = 'GET') {
        let url = `${BASE_URL}?resource=${resource}&action=${action}`;
        const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
        if (data) opts.body = JSON.stringify(data);

        let res;
        try {
            res = await fetch(url, opts);
        } catch (e) {
            return networkError(e);
        }
        let json = null;
        try { json = await res.json(); } catch (e) { /* respuesta no JSON */ }

        if (!res.ok) {
            throw new Error((json && json.msg) || 'Error de servidor (' + res.status + ')');
        }
        return json;
    }

    // ---- Catálogo: sincroniza Data.productos con la base de datos ----
    async function cargarCatalogo() {
        const r = await request('products', 'list');
        const prods = (r.productos || []).map(p => ({
            id: p.id,
            nombre: p.nombre,
            nombreEn: p.nombre_en || p.nombre,
            desc: p.descripcion || '',
            descEn: p.descripcion_en || p.descripcion || '',
            precio: Number(p.precio),
            img: p.imagen_url || 'img/rosas-rojas.jpg',
            stock: Number(p.stock),
            categoria: p.categoria,
            categoriaEn: p.categoria_en,
            categoriaId: p.categoria_id,
            estado: p.estado,
        }));
        // Mutar el array expuesto para no romper las referencias existentes
        Data.productos.length = 0;
        Data.productos.push(...prods);
        return Data.productos;
    }

    async function getCategorias() {
        const r = await request('categories', 'list');
        return r.categorias || [];
    }

    // ---- Autenticación ----
    async function login(email, password) {
        const r = await request('auth', 'login', { email, password }, 'POST');
        return { ok: r.ok, user: r.usuario, msg: '' };
    }

    async function register(data) {
        const r = await request('auth', 'register', data, 'POST');
        return { ok: r.ok, user: r.usuario, msg: '' };
    }

    async function logout() {
        try { await request('auth', 'logout', null, 'POST'); } catch (e) { /* ignorar */ }
    }

    async function getSesion() {
        try {
            const r = await request('auth', 'me');
            return r.usuario || null;
        } catch (e) { return null; }
    }

    async function getPerfil() {
        const r = await request('auth', 'profile');
        return r;
    }

    async function updatePerfil(data) {
        const r = await request('auth', 'update_perfil', data, 'POST');
        return r.ok;
    }

    async function updatePassword(newPassword) {
        const r = await request('auth', 'update_password', { newPassword }, 'POST');
        return { ok: r.ok, msg: '' };
    }

    // ---- Productos: CRUD (admin) ----
    async function getProductosAdmin() {
        const r = await request('products', 'adminList');
        return r.productos || [];
    }

    async function createProducto(data) {
        return request('products', 'create', data, 'POST');
    }

    async function updateProducto(data) {
        return request('products', 'update', data, 'POST');
    }

    async function updateStock(data) {
        return request('products', 'update_stock', data, 'POST');
    }

    async function deleteProducto(id) {
        return request('products', 'delete', { id }, 'POST');
    }

    // ---- Pedidos ----
    async function getPedidos() {
        const r = await request('orders', 'list');
        return r.pedidos || [];
    }

    async function getPedidosAdmin() {
        const r = await request('orders', 'adminList');
        return r.pedidos || [];
    }

    // Crea el pedido en la BD (el servidor valida inventario y lo actualiza)
    async function savePedido(pedido) {
        const r = await request('orders', 'create', { items: pedido.items }, 'POST');
        return { id: r.pedido.id, total: r.pedido.total, estado: r.pedido.estado };
    }

    async function updateEstadoPedido(id, estado) {
        const r = await request('orders', 'updateEstado', { id, estado }, 'POST');
        return r.ok;
    }

    // ---- Panel administrativo ----
    async function getDashboard() {
        const r = await request('dashboard', '');
        return r;
    }

    // ---- CRM clientes (admin) ----
    async function getClientes() {
        const r = await request('clientes', 'list');
        return r.clientes || [];
    }

    async function getClientesAdmin() {
        return this.getClientes();
    }

    // ---- Interacciones (chatbot) ----
    async function getInteracciones() {
        const r = await request('interactions', 'list');
        return (r.interacciones || []).map(i => ({
            fecha: String(i.fecha).slice(0, 10),
            rating: i.calificacion,
            sugerencia: i.sugerencia || '',
        }));
    }

    async function saveInteraccion(ix) {
        return request('interactions', 'save', {
            calificacion: ix.rating,
            sugerencia: ix.sugerencia,
        }, 'POST');
    }

    return {
        BASE_URL,
        cargarCatalogo,
        getCategorias,
        login,
        register,
        logout,
        getSesion,
        getPerfil,
        updatePerfil,
        updatePassword,
        getProductosAdmin,
        createProducto,
        updateProducto,
        updateStock,
        deleteProducto,
        getPedidos,
        getPedidosAdmin,
        savePedido,
        updateEstadoPedido,
        getDashboard,
        getClientes,
        getClientesAdmin,
        getInteracciones,
        saveInteraccion,
    };
})();
