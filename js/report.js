// ===================================================================
// REPORTE MENSUAL (Panel de administración)
// a. Cantidad de personas atendidas
// b. Calificación promedio dada por los clientes
// c. Sugerencias de clientes → recomendaciones para la administración
// ===================================================================
const Report = (() => {

    const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let interacciones = [];
    let mostrarSemiprivados = false;

    // Nombre de mes según idioma activo
    function nombreMes(m) {
        const d = new Date(2025, m, 1);
        return d.toLocaleDateString(I18n.lang() === 'en' ? 'en-US' : 'es-CO', { month: 'long' })
            .replace(/^./, c => c.toUpperCase());
    }

    // Selector con los últimos 12 meses (valor YYYY-MM)
    function buildMonthOptions() {
        const sel = document.getElementById('reportMonth');
        if (!sel) return;
        const now = new Date();
        let html = '';
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            html += `<option value="${val}" ${i === 0 ? 'selected' : ''}>${nombreMes(d.getMonth())} ${d.getFullYear()}</option>`;
        }
        sel.innerHTML = html;
    }

    async function refreshData() {
        interacciones = await API.getInteracciones();
    }

    function init() {
        buildMonthOptions();
        document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
        // Si el reporte ya está visible, cambiar el mes lo regenera al instante
        document.getElementById('reportMonth')?.addEventListener('change', () => {
            if (!document.getElementById('reportContent')?.classList.contains('hidden')) {
                generateReport();
            }
        });
        // Solo los SEMIPRIVADOS (teléfono, dirección) pueden revelarse;
        // PRIVADOS y SENSIBLES están protegidos de forma permanente.
        document.getElementById('toggleSensitive')?.addEventListener('click', () => {
            mostrarSemiprivados = !mostrarSemiprivados;
            renderClientes();
        });
        document.getElementById('adminLogout')?.addEventListener('click', () => {
            Auth.cerrarSesionYRedirigir();
        });
        // Al cambiar idioma/moneda: reconstruye meses, tabla CRM y
        // regenera el reporte si ya está visible.
        const reRender = () => {
            buildMonthOptions();
            renderClientes();
            if (!document.getElementById('reportContent')?.classList.contains('hidden')) {
                generateReport();
            }
        };
        document.addEventListener('fe:idioma', reRender);
        document.addEventListener('fe:moneda', reRender);
        renderClientes();
    }

    async function generateReport() {
        const content = document.getElementById('reportContent');
        const btn = document.getElementById('generateReportBtn');
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${I18n.te('Generando...', 'Generating...')}`;

        await refreshData();

        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-chart-bar mr-2"></i>${I18n.te('Generar Reporte', 'Generate Report')}`;

        const sel = document.getElementById('reportMonth');
        const mes = sel.value;
        const delMes = interacciones.filter(i => (i.fecha || '').startsWith(mes));

        content.classList.remove('hidden');

        const emptyEl = document.getElementById('reportEmpty');
        const dataEl = document.getElementById('reportData');

        if (delMes.length === 0) {
            // Sin interacciones en el mes → mensaje claro en lugar de métricas en cero
            const opt = sel.options[sel.selectedIndex];
            const label = document.getElementById('emptyMonthLabel');
            if (label) label.textContent = opt ? opt.textContent : mes;
            emptyEl?.classList.remove('hidden');
            dataEl?.classList.add('hidden');
        } else {
            emptyEl?.classList.add('hidden');
            dataEl?.classList.remove('hidden');
            render(delMes);
        }
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function render(list) {
        const total = list.length;
        const ratings = list.map(i => i.rating || 0);

        // a. Personas atendidas
        animateCounter('metricAttended', total);

        // b. Calificación promedio
        const avgRating = total ? ratings.reduce((a, b) => a + b, 0) / total : 0;
        animateCounter('metricRating', avgRating, true);

        const starsContainer = document.getElementById('metricStars');
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="fa-solid fa-star ${i <= Math.round(avgRating) ? '' : 'opacity-30'}"></i> `;
        }
        starsContainer.innerHTML = starsHTML;

        // Porcentaje de satisfacción (4+ estrellas)
        const satisfied = ratings.filter(r => r >= 4).length;
        const satisfactionPct = total ? Math.round((satisfied / total) * 100) : 0;
        animateCounter('metricSatisfaction', satisfactionPct, false, '%');

        renderRatingBars(ratings);
        renderSuggestions(list);
        renderRecommendations(avgRating, satisfactionPct, list);
    }

    function animateCounter(elementId, target, isDecimal = false, suffix = '') {
        const el = document.getElementById(elementId);
        if (!el) return;
        const fmt = v => (isDecimal ? v.toFixed(1) : Math.round(v)) + suffix;

        // Valor final garantizado de inmediato (por si rAF está limitado o
        // el usuario prefiere movimiento reducido); luego se anima visualmente.
        el.textContent = fmt(target);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const duration = 500;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = fmt(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function renderRatingBars(ratings) {
        const container = document.getElementById('ratingBars');
        const total = ratings.length;
        const distribution = [0, 0, 0, 0, 0];
        ratings.forEach(r => { if (r >= 1 && r <= 5) distribution[r - 1]++; });

        const barColors = ['#c9584d', '#d4726a', '#c9a96e', '#5a9e72', '#3d7a54'];
        const labels = [1, 2, 3, 4, 5].map(n =>
            I18n.te(`${n} estrella${n > 1 ? 's' : ''}`, `${n} star${n > 1 ? 's' : ''}`));

        container.innerHTML = distribution.map((count, i) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return `
                <div class="flex items-center gap-4">
                    <span class="text-sm text-muted w-24 text-right flex-shrink-0">${labels[i]}</span>
                    <div class="flex-1 bg-cream-dark rounded-lg overflow-hidden h-8">
                        <div class="rating-bar flex items-center justify-end px-3" style="width: 0%; background: ${barColors[i]};">
                            <span class="text-xs font-bold text-white">${count}</span>
                        </div>
                    </div>
                    <span class="text-sm font-bold text-charcoal w-12 text-right">${Math.round(pct)}%</span>
                </div>
            `;
        }).join('');

        setTimeout(() => {
            container.querySelectorAll('.rating-bar').forEach((bar, i) => {
                const pct = total > 0 ? (distribution[i] / total) * 100 : 0;
                bar.style.width = Math.max(pct, 8) + '%';
            });
        }, 100);
    }

    function renderSuggestions(list) {
        const container = document.getElementById('suggestionsList');
        const suggestions = list.filter(i => i.sugerencia && i.sugerencia.trim() !== '');

        if (suggestions.length === 0) {
            container.innerHTML = `<p class="text-muted text-sm text-center py-8">${I18n.te('No hay sugerencias registradas este mes.', 'No suggestions were recorded this month.')}</p>`;
            return;
        }

        container.innerHTML = suggestions.map(s => {
            const stars = '★'.repeat(s.rating) + '☆'.repeat(5 - s.rating);
            return `
                <div class="p-4 bg-cream rounded-xl border border-bord">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gold text-sm">${stars}</span>
                        <span class="text-xs text-muted">${s.fecha}</span>
                    </div>
                    <p class="text-sm text-charcoal leading-relaxed">"${s.sugerencia}"</p>
                </div>
            `;
        }).join('');
    }

    // c. De las sugerencias de los clientes se derivan recomendaciones para la administración
    function renderRecommendations(avgRating, satisfactionPct, list) {
        const container = document.getElementById('adminRecommendations');
        const suggestions = list.filter(i => i.sugerencia && i.sugerencia.trim() !== '');
        const suggestionsText = suggestions.map(s => s.sugerencia.toLowerCase());
        const recs = [];

        // Análisis de calificación general
        if (avgRating >= 4.5) {
            recs.push({ icon: 'fa-trophy', color: 'text-gold',
                title: I18n.te('Mantener la excelencia', 'Maintain excellence'),
                text: I18n.te('La calificación promedio es sobresaliente. Se recomienda mantener las prácticas actuales y reconocer al equipo de atención.', 'The average rating is outstanding. We recommend keeping current practices and recognizing the service team.') });
        } else if (avgRating >= 3.5) {
            recs.push({ icon: 'fa-chart-line', color: 'text-gold-light',
                title: I18n.te('Optimizar la experiencia', 'Optimize the experience'),
                text: I18n.te('La calificación es buena pero tiene margen de mejora. Revisar las interacciones con calificación baja para identificar patrones.', 'The rating is good but has room for improvement. Review low-rated interactions to identify patterns.') });
        } else {
            recs.push({ icon: 'fa-triangle-exclamation', color: 'text-terra',
                title: I18n.te('Atención urgente', 'Urgent attention'),
                text: I18n.te('La calificación promedio está por debajo del aceptable. Se requiere un plan de mejora inmediato con capacitación del personal.', 'The average rating is below acceptable. An immediate improvement plan with staff training is required.') });
        }

        // Análisis de satisfacción
        if (satisfactionPct < 80) {
            recs.push({ icon: 'fa-bullseye', color: 'text-terra',
                title: I18n.te('Mejorar tasa de satisfacción', 'Improve satisfaction rate'),
                text: I18n.te(`El ${100 - satisfactionPct}% de clientes no está satisfecho. Implementar encuestas de seguimiento post-servicio.`, `${100 - satisfactionPct}% of customers are not satisfied. Implement post-service follow-up surveys.`) });
        }

        // Análisis de palabras clave en sugerencias
        const allText = suggestionsText.join(' ');

        if (allText.includes('entrega') || allText.includes('tardó') || allText.includes('llega') || allText.includes('tiempo')) {
            recs.push({ icon: 'fa-truck-fast', color: 'text-gold-light',
                title: I18n.te('Mejorar logística de entregas', 'Improve delivery logistics'),
                text: I18n.te('Varios clientes mencionan tiempos de entrega. Considerar ampliar el equipo de reparto, implementar rutas optimizadas y ofrecer seguimiento en tiempo real.', 'Several customers mention delivery times. Consider expanding the delivery team, implementing optimized routes and offering real-time tracking.') });
        }
        if (allText.includes('precio') || allText.includes('caro') || allText.includes('elevado') || allText.includes('costo')) {
            recs.push({ icon: 'fa-tags', color: 'text-gold',
                title: I18n.te('Revisar estructura de precios', 'Review pricing structure'),
                text: I18n.te('Hay percepción de precios altos. Evaluar la posibilidad de arreglos en rangos más accesibles o promociones de fidelización.', 'There is a perception of high prices. Evaluate arrangements in more affordable ranges or loyalty promotions.') });
        }
        if (allText.includes('variedad') || allText.includes('rosas') || allText.includes('catálogo') || allText.includes('opciones')) {
            recs.push({ icon: 'fa-palette', color: 'text-gold-light',
                title: I18n.te('Ampliar catálogo floral', 'Expand floral catalog'),
                text: I18n.te('Los clientes solicitan más opciones. Incorporar nuevas variedades estacionales y arreglos temáticos para ocasiones específicas.', 'Customers are asking for more options. Add new seasonal varieties and themed arrangements for specific occasions.') });
        }
        if (allText.includes('rastrear') || allText.includes('seguimiento') || allText.includes('foto')) {
            recs.push({ icon: 'fa-mobile-screen', color: 'text-gold',
                title: I18n.te('Mejorar experiencia digital', 'Improve digital experience'),
                text: I18n.te('Los clientes desean mayor visibilidad digital. Desarrollar funcionalidad de rastreo de pedidos y vista previa de arreglos.', 'Customers want more digital visibility. Develop order tracking functionality and arrangement previews.') });
        }
        if (allText.includes('suscripciones') || allText.includes('suscripción') || allText.includes('mensual')) {
            recs.push({ icon: 'fa-repeat', color: 'text-gold-light',
                title: I18n.te('Crear programa de suscripción', 'Create a subscription program'),
                text: I18n.te('Hay interés en entregas recurrentes. Diseñar un programa de suscripción mensual con descuentos y selección personalizada.', 'There is interest in recurring deliveries. Design a monthly subscription program with discounts and personalized selection.') });
        }
        if (allText.includes('pago') || allText.includes('paypal') || allText.includes('digital')) {
            recs.push({ icon: 'fa-credit-card', color: 'text-gold',
                title: I18n.te('Diversificar métodos de pago', 'Diversify payment methods'),
                text: I18n.te('Ampliar las opciones de pago digital incluyendo billeteras electrónicas y plataformas adicionales.', 'Expand digital payment options including e-wallets and additional platforms.') });
        }
        if (allText.includes('instrucciones') || allText.includes('siguió') || allText.includes('pedido')) {
            recs.push({ icon: 'fa-clipboard-check', color: 'text-terra',
                title: I18n.te('Mejorar cumplimiento de pedidos', 'Improve order fulfillment'),
                text: I18n.te('Se detectaron desviaciones en las instrucciones del pedido. Implementar checklist de verificación antes del despacho.', 'Deviations from order instructions were detected. Implement a verification checklist before dispatch.') });
        }
        if (allText.includes('cumpleaños') || allText.includes('infantil') || allText.includes('aniversario') || allText.includes('recordatorios')) {
            recs.push({ icon: 'fa-cake-candles', color: 'text-gold-light',
                title: I18n.te('Occasionales y recordatorios', 'Occasions and reminders'),
                text: I18n.te('Existe demanda de arreglos para ocasiones específicas. Crear paquetes temáticos y recordatorios automáticos de fechas importantes.', 'There is demand for occasion-specific arrangements. Create themed packages and automatic reminders for important dates.') });
        }
        if (allText.includes('puntos') || allText.includes('frecuentes') || allText.includes('fidelización')) {
            recs.push({ icon: 'fa-gift', color: 'text-gold',
                title: I18n.te('Programa de fidelización', 'Loyalty program'),
                text: I18n.te('Los clientes piden beneficios por recompra. Implementar un sistema de puntos canjeables y descuentos por aniversario.', 'Customers ask for repurchase benefits. Implement a redeemable points system and anniversary discounts.') });
        }

        // Fomentar retroalimentación si hay pocas sugerencias
        if (suggestionsText.length < 5) {
            recs.push({ icon: 'fa-comment-dots', color: 'text-gold-light',
                title: I18n.te('Fomentar la retroalimentación', 'Encourage feedback'),
                text: I18n.te('Pocos clientes dejan sugerencias. Implementar incentivos (descuentos, puntos) para aumentar la tasa de respuesta en las encuestas.', 'Few customers leave suggestions. Implement incentives (discounts, points) to increase survey response rates.') });
        }

        // Resultados sobresalientes
        if (avgRating >= 4.5 && satisfactionPct >= 85 && recs.length <= 1) {
            recs.push({ icon: 'fa-champagne-glasses', color: 'text-gold',
                title: I18n.te('Celebrar los resultados', 'Celebrate the results'),
                text: I18n.te('Los indicadores son excelentes. Compartir los resultados con el equipo y planear estrategias para mantener el momentum.', 'Indicators are excellent. Share the results with the team and plan strategies to keep the momentum.') });
        }

        container.innerHTML = recs.map(r => `
            <div class="flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/10">
                <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fa-solid ${r.icon} ${r.color}"></i>
                </div>
                <div>
                    <p class="font-bold text-white text-sm mb-1">${r.title}</p>
                    <p class="text-white/60 text-xs leading-relaxed">${r.text}</p>
                </div>
            </div>
        `).join('');
    }

    // Tabla CRM de clientes:
    //  - PÚBLICOS: siempre visibles (nombre, email).
    //  - SEMIPRIVADOS: teléfono/dirección, ocultos hasta pulsar el botón.
    //  - PRIVADOS: de la fecha de nacimiento SOLO se muestra la edad;
    //    preferencias quedan protegidas de forma permanente.
    //  - SENSIBLES: ID y método de pago, nunca visibles.
    function calcularEdad(fecha) {
        if (!fecha) return null;
        const [y, m, d] = String(fecha).split('-').map(Number);
        if (!y || !m || !d) return null;
        const hoy = new Date();
        let edad = hoy.getFullYear() - y;
        const mes = hoy.getMonth() + 1 - m;
        if (mes < 0 || (mes === 0 && hoy.getDate() < d)) edad--;
        return edad >= 0 && edad < 130 ? edad : null;
    }

    function renderClientes() {
        const wrap = document.getElementById('clientesTable');
        if (!wrap) return;

        const protegido = `<span class="inline-flex items-center gap-1.5 text-muted/70" title="${I18n.te('Dato privado/sensible protegido', 'Private/sensitive data protected')}"><i class="fa-solid fa-lock text-xs text-terra"></i>${I18n.te('Protegido', 'Protected')}</span>`;
        const sem = v => v ? (mostrarSemiprivados ? v : `<span class="inline-flex items-center gap-1.5 text-muted/60"><i class="fa-solid fa-eye-slash text-xs"></i>••••••</span>`) : '—';
        const toggleBtn = document.getElementById('toggleSensitive');
        if (toggleBtn) {
            toggleBtn.innerHTML = mostrarSemiprivados
                ? `<i class="fa-solid fa-eye-slash mr-2"></i>${I18n.te('Ocultar datos semiprivados', 'Hide semi-private data')}`
                : `<i class="fa-solid fa-eye mr-2"></i>${I18n.te('Mostrar datos semiprivados', 'Show semi-private data')}`;
        }

        API.getClientesAdmin().then(clientes => {
            if (!clientes.length) {
                wrap.innerHTML = `<p class="text-muted text-sm text-center py-10">${I18n.te('Aún no hay clientes registrados.', 'No customers registered yet.')}</p>`;
                return;
            }

            const th = (es, en, tag, tagTxt) => `<th class="px-5 py-4 font-bold text-charcoal text-xs uppercase tracking-wider">${I18n.te(es, en)} <span class="${tag} text-[9px] px-1.5 py-0.5 rounded-full ml-1">${tagTxt}</span></th>`;
            const thSen = (es, en) => `<th class="px-5 py-4 font-bold text-charcoal text-xs uppercase tracking-wider">${I18n.te(es, en)} <span class="tag-sensible text-[9px] px-1.5 py-0.5 rounded-full ml-1">SEN 🔒</span></th>`;

            wrap.innerHTML = `
                <table class="min-w-full text-sm">
                    <thead>
                        <tr class="bg-cream-dark/60 text-left">
                            ${th('Cliente', 'Customer', 'tag-publico', 'PÚB')}
                            ${th('Email', 'Email', 'tag-publico', 'PÚB')}
                            ${th('Teléfono', 'Phone', 'tag-semiprivado', 'SEM')}
                            ${th('Dirección', 'Address', 'tag-semiprivado', 'SEM')}
                            ${th('Edad', 'Age', 'tag-publico', 'PÚB')}
                            ${thSen('Preferencias', 'Preferences')}
                            ${thSen('ID', 'ID')}
                            ${thSen('Pago', 'Payment')}
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.map(c => {
                            const e = calcularEdad(c.nacimiento);
                            return `
                            <tr class="border-t border-bord hover:bg-cream/50 transition">
                                <td class="px-5 py-4 font-bold text-charcoal whitespace-nowrap">${c.nombre}</td>
                                <td class="px-5 py-4 text-muted">${c.email}</td>
                                <td class="px-5 py-4 text-muted whitespace-nowrap">${sem(c.telefono)}</td>
                                <td class="px-5 py-4 text-muted max-w-[220px]">${sem(c.direccion)}</td>
                                <td class="px-5 py-4 text-muted whitespace-nowrap">${e !== null ? `${e} ${I18n.te('años', 'yrs')}` : '—'}</td>
                                <td class="px-5 py-4">${protegido}</td>
                                <td class="px-5 py-4">${protegido}</td>
                                <td class="px-5 py-4">${protegido}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            `;
        });
    }

    return { init };
})();
