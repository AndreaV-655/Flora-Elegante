// ===================================================================
// PANEL ADMINISTRATIVO · Dashboard + Productos (CRUD) + Pedidos
// -------------------------------------------------------------------
// a. Información del negocio: usuarios, productos, inventario bajo,
//    pedidos, últimos pedidos y estado de los pedidos.
// b. Gestión de productos (CRUD) exclusivo del administrador.
// c. Pedidos: consultar todos y cambiar su estado.
// ===================================================================
const AdminPanel = (() => {

    let categorias = [];

    const ESTADOS = ['Confirmado', 'En camino', 'Entregado', 'Cancelado'];

    function statusColor(e) {
        return {
            'Confirmado': 'bg-gold/15 text-gold',
            'En camino': 'bg-blue-100 text-blue-700',
            'Entregado': 'bg-leaf/15 text-leaf',
            'Cancelado': 'bg-terra/15 text-terra',
        }[e] || 'bg-gray-100 text-gray-600';
    }

    // ============================================================
    // DASHBOARD
    // ============================================================
    async function cargarDashboard() {
        const d = await API.getDashboard();
        setNum('statUsuarios', d.usuarios);
        setNum('statProductos', `${d.productos_activos}<span class="text-sm font-normal text-muted">/${d.productos_total}</span>`);
        setNum('statPedidos', d.pedidos_total);
        setNum('statInventarioBajo', d.inventario_bajo.length);

        // Productos con inventario bajo (alerta)
        const bajoEl = document.getElementById('inventarioBajoList');
        if (bajoEl) {
            if (!d.inventario_bajo.length) {
                bajoEl.innerHTML = `<p class="text-sm text-muted">${I18n.te('No hay productos con inventario bajo.', 'No products with low inventory.')}</p>`;
            } else {
                bajoEl.innerHTML = d.inventario_bajo.map(p => `
                    <div class="flex items-center justify-between gap-3 p-3 bg-terra/5 border border-terra/20 rounded-lg">
                        <div class="flex items-center gap-3 min-w-0">
                            <img src="${p.imagen_url}" alt="" class="w-10 h-10 rounded object-cover flex-shrink-0">
                            <div class="min-w-0">
                                <p class="text-sm font-bold text-charcoal truncate">${I18n.lang() === 'en' ? (p.nombre_en || p.nombre) : p.nombre}</p>
                                <p class="text-xs text-terra font-bold">${I18n.te('Quedan', 'Left')}: ${p.stock}</p>
                            </div>
                        </div>
                        <span class="text-xs px-2 py-1 rounded-full bg-terra text-white font-bold flex-shrink-0">${I18n.te('Bajo', 'Low')}</span>
                    </div>`).join('');
            }
        }

        // Estado de los pedidos
        const estadoEl = document.getElementById('estadosPedidos');
        if (estadoEl) {
            const total = d.pedidos_total || 1;
            estadoEl.innerHTML = ESTADOS.map(es => {
                const n = d.estados[es] || 0;
                const pct = total ? Math.round((n / total) * 100) : 0;
                return `
                <div class="flex items-center gap-4">
                    <span class="text-sm font-bold text-charcoal w-28">${I18n.te(es, es)}</span>
                    <div class="flex-1 h-3 bg-cream-dark rounded-full overflow-hidden">
                        <div class="h-full rounded-full ${statusColor(es).split(' ')[0]}" style="width:${Math.max(pct, 2)}%"></div>
                    </div>
                    <span class="text-sm font-bold text-charcoal w-8 text-right">${n}</span>
                </div>`;
            }).join('');
        }

        // Últimos pedidos registrados
        renderUltimosPedidos(d.ultimos_pedidos || []);
    }

    function setNum(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function renderUltimosPedidos(pedidos) {
        const el = document.getElementById('ultimosPedidos');
        if (!el) return;
        if (!pedidos.length) {
            el.innerHTML = `<p class="text-sm text-muted py-6 text-center">${I18n.te('Aún no hay pedidos.', 'No orders yet.')}</p>`;
            return;
        }
        el.innerHTML = pedidos.map(p => `
            <div class="flex items-center justify-between gap-3 py-3 border-b border-bord last:border-0">
                <div class="min-w-0">
                    <p class="text-sm font-bold text-charcoal">${I18n.te('Pedido', 'Order')} #${p.id}</p>
                    <p class="text-xs text-muted truncate">${p.nombre} · ${String(p.fecha).slice(0, 10)}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="text-sm font-bold text-terra">${Data.formatPrecio(p.total)}</span>
                    <span class="text-[10px] px-2 py-1 rounded-full font-bold ${statusColor(p.estado)}">${I18n.te(p.estado, p.estado)}</span>
                </div>
            </div>`).join('');
    }

    // ============================================================
    // PRODUCTOS · CRUD
    // ============================================================
    async function cargarProductos() {
        const productos = await API.getProductosAdmin();
        if (!categorias.length) {
            const cat = await API.getCategorias();
            categorias = cat;
        }
        const el = document.getElementById('productosTable');
        if (!el) return;
        if (!productos.length) {
            el.innerHTML = `<p class="text-sm text-muted text-center py-10">${I18n.te('Aún no hay productos.', 'No products yet.')}</p>`;
            return;
        }
        el.innerHTML = `
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="bg-cream-dark/60 text-left">
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('ID', 'ID')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Imagen', 'Image')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Nombre', 'Name')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Categoría', 'Category')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Precio', 'Price')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Stock', 'Stock')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Estado', 'Status')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase text-right">${I18n.te('Acciones', 'Actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => `
                    <tr class="border-t border-bord hover:bg-cream/50">
                        <td class="px-4 py-3 text-muted">${p.id}</td>
                        <td class="px-4 py-3"><img src="${p.imagen_url}" alt="" class="w-10 h-10 rounded object-cover"></td>
                        <td class="px-4 py-3 font-bold text-charcoal">${I18n.lang() === 'en' ? (p.nombre_en || p.nombre) : p.nombre}</td>
                        <td class="px-4 py-3 text-muted">${I18n.lang() === 'en' ? (p.categoria_en || p.categoria) : p.categoria}</td>
                        <td class="px-4 py-3 font-bold text-terra">${Data.formatPrecio(p.precio)}</td>
                        <td class="px-4 py-3 ${p.stock <= 5 ? 'text-terra font-bold' : 'text-muted'}">${p.stock}</td>
                        <td class="px-4 py-3">
                            <span class="text-[10px] px-2 py-1 rounded-full ${p.estado === 'activo' ? 'bg-leaf/15 text-leaf' : 'bg-gray-200 text-gray-500'}">
                                ${I18n.te(p.estado === 'activo' ? 'Activo' : 'Inactivo', p.estado === 'activo' ? 'Active' : 'Inactive')}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex justify-end gap-2">
                                <button onclick="AdminPanel.editarProducto(${p.id})" class="text-leaf hover:opacity-70" title="${I18n.te('Editar', 'Edit')}"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="AdminPanel.eliminarProducto(${p.id})" class="text-terra hover:opacity-70" title="${I18n.te('Eliminar', 'Delete')}"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    // Abre el modal para crear/editar un producto
    function abrirFormulario(producto = null) {
        const modal = document.getElementById('productoModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        const form = document.getElementById('productoForm');
        form.reset();
        document.getElementById('prodId').value = producto ? producto.id : '';
        document.getElementById('prodNombre').value = producto ? producto.nombre : '';
        document.getElementById('prodNombreEn').value = producto ? (producto.nombre_en || '') : '';
        document.getElementById('prodDesc').value = producto ? (producto.descripcion || '') : '';
        document.getElementById('prodDescEn').value = producto ? (producto.descripcion_en || '') : '';
        document.getElementById('propPrecio').value = producto ? producto.precio : '';
        document.getElementById('prodImagen').value = producto ? producto.imagen_url : '';
        document.getElementById('prodStock').value = producto ? producto.stock : '';
        document.getElementById('prodEstado').value = producto ? producto.estado : 'activo';
        // Cargar categorías
        const sel = document.getElementById('prodCategoria');
        sel.innerHTML = categorias.map(c => `<option value="${c.id}">${I18n.lang() === 'en' ? c.nombre_en : c.nombre}</option>`).join('');
        if (producto) sel.value = producto.categoria_id;
    }

    function cerrarFormulario() {
        document.getElementById('productoModal')?.classList.add('hidden');
    }

    async function guardarProducto() {
        const form = document.getElementById('productoForm');
        if (!form.reportValidity()) return;
        const data = {
            id: document.getElementById('prodId').value || 0,
            categoria_id: document.getElementById('prodCategoria').value,
            nombre: document.getElementById('prodNombre').value,
            nombre_en: document.getElementById('prodNombreEn').value,
            descripcion: document.getElementById('prodDesc').value,
            descripcion_en: document.getElementById('prodDescEn').value,
            precio: document.getElementById('propPrecio').value,
            imagen_url: document.getElementById('prodImagen').value,
            stock: document.getElementById('prodStock').value,
            estado: document.getElementById('prodEstado').value,
        };
        const btn = document.getElementById('prodGuardar');
        if (btn) btn.disabled = true;

        try {
            if (data.id) await API.updateProducto(data);
            else await API.createProducto(data);
            cerrarFormulario();
            showToast(I18n.te('Producto guardado correctamente.', 'Product saved successfully.'), 'success');
            await cargarProductos();
            await API.cargarCatalogo();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function editarProducto(id) {
        const productos = await API.getProductosAdmin();
        const p = productos.find(x => Number(x.id) === Number(id));
        if (p) abrirFormulario(p);
    }

    async function eliminarProducto(id) {
        const ok = confirm(I18n.te('¿Eliminar este producto? Esta acción no se puede deshacer.', 'Delete this product? This cannot be undone.'));
        if (!ok) return;
        try {
            await API.deleteProducto(id);
            showToast(I18n.te('Producto eliminado.', 'Product deleted.'), 'success');
            await cargarProductos();
            await API.cargarCatalogo();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    // ============================================================
    // PEDIDOS · consultar y cambiar estado
    // ============================================================
    async function cargarPedidos() {
        const pedidos = await API.getPedidosAdmin();
        const el = document.getElementById('pedidosTable');
        if (!el) return;
        if (!pedidos.length) {
            el.innerHTML = `<p class="text-sm text-muted text-center py-10">${I18n.te('Aún no hay pedidos.', 'No orders yet.')}</p>`;
            return;
        }
        el.innerHTML = `
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="bg-cream-dark/60 text-left">
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Pedido', 'Order')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Cliente', 'Customer')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Fecha', 'Date')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Total', 'Total')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase">${I18n.te('Estado', 'Status')}</th>
                        <th class="px-4 py-3 font-bold text-charcoal text-xs uppercase text-right">${I18n.te('Acciones', 'Actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(p => `
                    <tr class="border-t border-bord hover:bg-cream/50">
                        <td class="px-4 py-3 font-bold text-charcoal">#${p.id}</td>
                        <td class="px-4 py-3">
                            <p class="font-bold text-charcoal">${p.nombre}</p>
                            <p class="text-xs text-muted">${p.email}</p>
                        </td>
                        <td class="px-4 py-3 text-muted">${String(p.fecha).slice(0, 16).replace('T', ' ')}</td>
                        <td class="px-4 py-3 font-bold text-terra">${Data.formatPrecio(p.total)}</td>
                        <td class="px-4 py-3">
                            <span class="text-[10px] px-2 py-1 rounded-full font-bold ${statusColor(p.estado)}">${I18n.te(p.estado, p.estado)}</span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex justify-end gap-2">
                                <button onclick="AdminPanel.verDetalle(${p.id})" class="text-leaf hover:opacity-70" title="${I18n.te('Ver detalle', 'View details')}"><i class="fa-solid fa-eye"></i></button>
                                <select onchange="AdminPanel.cambiarEstado(${p.id}, this.value)" class="text-xs border border-bord rounded px-2 py-1">
                                    ${ESTADOS.map(es => `<option value="${es}" ${es === p.estado ? 'selected' : ''}>${I18n.te(es, es)}</option>`).join('')}
                                </select>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    async function verDetalle(id) {
        const pedidos = await API.getPedidosAdmin();
        const p = pedidos.find(x => Number(x.id) === Number(id));
        if (!p) return;
        const body = document.getElementById('detalleBody');
        if (!body) return;
        body.innerHTML = `
            <div class="mb-4 text-sm text-muted">
                ${I18n.te('Cliente', 'Customer')}: <strong class="text-charcoal">${p.nombre} (${p.email})</strong><br>
                ${I18n.te('Fecha', 'Date')}: <strong class="text-charcoal">${String(p.fecha).slice(0, 16).replace('T', ' ')}</strong><br>
                ${I18n.te('Estado', 'Status')}: <span class="font-bold ${statusColor(p.estado).split(' ')[1]}">${I18n.te(p.estado, p.estado)}</span>
            </div>
            <div class="border-t border-bord pt-3">
                ${(p.items || []).map(it => `
                    <div class="flex justify-between py-1 text-sm">
                        <span class="text-charcoal">${it.cantidad} × ${I18n.lang() === 'en' ? (it.nombre_en || it.nombre) : it.nombre}</span>
                        <span class="text-muted">${Data.formatPrecio(it.precio_unitario * it.cantidad)}</span>
                    </div>`).join('')}
                <div class="flex justify-between pt-3 mt-2 border-t border-bord font-bold text-charcoal">
                    <span>${I18n.te('Total', 'Total')}</span>
                    <span class="text-terra">${Data.formatPrecio(p.total)}</span>
                </div>
            </div>`;
        document.getElementById('detalleModal')?.classList.remove('hidden');
    }

    function cerrarDetalle() {
        document.getElementById('detalleModal')?.classList.add('hidden');
    }

    async function cambiarEstado(id, estado) {
        try {
            await API.updateEstadoPedido(id, estado);
            showToast(I18n.te('Estado del pedido actualizado.', 'Order status updated.'), 'success');
            await cargarPedidos();
            await cargarDashboard();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    // ============================================================
    // INIT
    // ============================================================
    async function init() {
        document.getElementById('nuevoProductoBtn')?.addEventListener('click', () => abrirFormulario(null));
        document.getElementById('prodCancelar')?.addEventListener('click', cerrarFormulario);
        document.getElementById('prodGuardar')?.addEventListener('click', guardarProducto);
        document.getElementById('detalleCerrar')?.addEventListener('click', cerrarDetalle);
        document.getElementById('adminLogout')?.addEventListener('click', () => Auth.cerrarSesionYRedirigir());

        try {
            await Promise.all([cargarDashboard(), cargarProductos(), cargarPedidos()]);
        } catch (e) {
            showToast(e.message, 'error');
        }

        const reRender = () => {
            cargarDashboard();
            cargarProductos();
            cargarPedidos();
        };
        document.addEventListener('fe:idioma', reRender);
        document.addEventListener('fe:moneda', reRender);
        document.addEventListener('fe:catalogo', () => { cargarProductos(); cargarDashboard(); });
    }

    return { init, editarProducto, eliminarProducto, cambiarEstado, verDetalle };
})();
window.AdminPanel = AdminPanel;
