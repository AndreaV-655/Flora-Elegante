// ===================================================================
// FORMULARIO DE REGISTRO / PERFIL DE CLIENTE
// - Sin sesión  → crea la cuenta y guarda el perfil (registro).
// - Con sesión  → MODO PERFIL: precarga sus datos y SOLO actualiza su
//   propio registro (correo bloqueado; jamás registra a otra persona).
// ===================================================================
const Form = (() => {

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    let modoPerfil = false;

    function init() {
        const form = document.getElementById('customerForm');
        if (!form) return;
        const errorEl = document.getElementById('formError');
        const sesion = Auth.session();
        modoPerfil = !!sesion;

        const submitBtn = form.querySelector('button[type="submit"]');
        const passWrap = document.getElementById('passWrap');
        const pass2Wrap = document.getElementById('pass2Wrap');
        const changeRow = document.getElementById('passChangeRow');
        const changeCheck = document.getElementById('changePassCheck');
        const emailInput = form.querySelector('[name="email"]');

        // ---------- Modo perfil ----------
        if (modoPerfil) {
            const title = document.getElementById('registroTitle');
            const subtitle = document.getElementById('registroSubtitle');
            if (title) title.textContent = I18n.te('Mi Perfil', 'My Profile');
            if (subtitle) subtitle.textContent = I18n.te(
                'Consulta y actualiza tu información de registro. Tu correo es tu identificador y no puede modificarse aquí.',
                'Review and update your registration information. Your email is your identifier and cannot be changed here.');
            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk mr-2"></i>${I18n.te('Guardar cambios', 'Save changes')}`;

            // Sin contraseñas a la vista: nadie puede crear otra cuenta desde aquí
            passWrap?.classList.add('hidden');
            pass2Wrap?.classList.add('hidden');
            changeRow?.classList.remove('hidden');

            emailInput.readOnly = true;
            emailInput.classList.add('bg-cream', 'cursor-not-allowed');
            emailInput.title = 'El correo no puede modificarse';

            changeCheck?.addEventListener('change', () => {
                const show = changeCheck.checked;
                passWrap?.classList.toggle('hidden', !show);
                pass2Wrap?.classList.toggle('hidden', !show);
                form.password.required = show;
                form.password2.required = show;
                if (!show) { form.password.value = ''; form.password2.value = ''; }
            });

            // Precargar los datos guardados del cliente
            API.getPerfil().then(r => {
                const c = r.perfil || {};
                form.nombre.value = r.nombre || sesion.nombre || '';
                form.email.value = sesion.email;
                form.telefono.value = c.telefono || '';
                form.direccion.value = c.direccion || '';
                form.nacimiento.value = c.fecha_nacimiento ? String(c.fecha_nacimiento).slice(0, 10) : '';
                form.preferencias.value = c.preferencias_florales ? String(c.preferencias_florales).toLowerCase() : '';
                form.pago.value = c.metodo_pago ? mapPago(c.metodo_pago) : '';
            }).catch(() => {});
        }

        function mapPago(v) {
            const s = String(v).toLowerCase();
            if (s.includes('crédito') || s.includes('credito')) return 'tarjeta_credito';
            if (s.includes('débito') || s.includes('debito')) return 'tarjeta_debito';
            if (s.includes('transfer')) return 'transferencia';
            if (s.includes('efectivo')) return 'efectivo';
            return '';
        }

        function showError(msg) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        function clearGlobalError() {
            errorEl.classList.add('hidden');
            errorEl.textContent = '';
        }

        // ---- Errores en línea por campo ----
        function fieldError(name, msg) {
            const input = form.querySelector(`[name="${name}"]`);
            if (!input || !msg) return;
            input.classList.add('field-invalid');
            input.setAttribute('aria-invalid', 'true');
            const p = document.createElement('p');
            p.className = 'field-error-msg';
            p.textContent = msg;
            input.insertAdjacentElement('afterend', p);
        }
        function clearFieldErrors() {
            form.querySelectorAll('.field-error-msg').forEach(p => p.remove());
            form.querySelectorAll('.field-invalid').forEach(el => {
                el.classList.remove('field-invalid');
                el.removeAttribute('aria-invalid');
            });
        }
        form.addEventListener('input', e => {
            const el = e.target;
            if (!el.classList?.contains('field-invalid')) return;
            el.classList.remove('field-invalid');
            el.removeAttribute('aria-invalid');
            el.nextElementSibling?.classList.contains('field-error-msg') && el.nextElementSibling.remove();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearGlobalError();
            clearFieldErrors();

            const fd = new FormData(form);
            const g = n => (fd.get(n) || '').toString().trim();
            const nombre = g('nombre'), email = g('email'), pass = g('password'), pass2 = g('password2');
            const telefono = g('telefono'), direccion = g('direccion'), nacimiento = g('nacimiento');
            const cambiarPass = modoPerfil && changeCheck?.checked;

            let firstBad = null;

            const privacy = document.getElementById('privacyCheck');
            if (!privacy.checked) {
                showError(I18n.te('Debes aceptar el aviso de privacidad para continuar.', 'You must accept the privacy notice to continue.'));
                firstBad = firstBad || privacy;
            }

            if (!nombre) { fieldError('nombre', I18n.te('El nombre completo es obligatorio.', 'Full name is required.')); firstBad = firstBad || form.nombre; }
            else if (nombre.length < 3 || !/\s/.test(nombre)) {
                fieldError('nombre', I18n.te('Ingresa tu nombre completo (nombre y apellido).', 'Enter your full name (first and last name).')); firstBad = firstBad || form.nombre;
            }

            if (!email) { fieldError('email', I18n.te('El correo electrónico es obligatorio.', 'Email address is required.')); firstBad = firstBad || form.email; }
            else if (!EMAIL_RE.test(email)) { fieldError('email', I18n.te('Ingresa un correo electrónico válido (ej. maria@correo.com).', 'Enter a valid email address (e.g. maria@mail.com).')); firstBad = firstBad || form.email; }

            // Contraseñas: solo en registro nuevo o si pidió cambiarla en perfil
            if (!modoPerfil || cambiarPass) {
                if (!pass) { fieldError('password', I18n.te('La contraseña es obligatoria.', 'Password is required.')); firstBad = firstBad || form.password; }
                else if (pass.length < 8) { fieldError('password', I18n.te('La contraseña debe tener al menos 8 caracteres.', 'Password must be at least 8 characters long.')); firstBad = firstBad || form.password; }
                else if (!/[A-Z]/.test(pass)) { fieldError('password', I18n.te('Debe incluir al menos una mayúscula.', 'It must include at least one uppercase letter.')); firstBad = firstBad || form.password; }
                else if (!/[a-z]/.test(pass)) { fieldError('password', I18n.te('Debe incluir al menos una minúscula.', 'It must include at least one lowercase letter.')); firstBad = firstBad || form.password; }
                else if (!/\d/.test(pass)) { fieldError('password', I18n.te('Debe incluir al menos un número.', 'It must include at least one number.')); firstBad = firstBad || form.password; }

                if (!pass2) { fieldError('password2', I18n.te('Confirma tu contraseña.', 'Confirm your password.')); firstBad = firstBad || form.password2; }
                else if (pass && pass !== pass2) { fieldError('password2', I18n.te('Las contraseñas no coinciden.', 'Passwords do not match.')); firstBad = firstBad || form.password2; }
            }

            const digitos = telefono.replace(/\D/g, '');
            if (!telefono) { fieldError('telefono', I18n.te('El teléfono es obligatorio.', 'Phone number is required.')); firstBad = firstBad || form.telefono; }
            else if (digitos.length < 7 || digitos.length > 15) { fieldError('telefono', I18n.te('Ingresa un teléfono válido (entre 7 y 15 dígitos, ej. +57 300 123 4567).', 'Enter a valid phone number (7 to 15 digits, e.g. +57 300 123 4567).')); firstBad = firstBad || form.telefono; }

            if (!direccion) { fieldError('direccion', I18n.te('La dirección de entrega es obligatoria.', 'Delivery address is required.')); firstBad = firstBad || form.direccion; }
            else if (direccion.length < 5) { fieldError('direccion', I18n.te('La dirección parece muy corta. Incluye calle, número y ciudad.', 'The address seems too short. Include street, number and city.')); firstBad = firstBad || form.direccion; }

            if (nacimiento) {
                const f = new Date(nacimiento + 'T00:00:00');
                if (isNaN(f.getTime()) || f > new Date()) { fieldError('nacimiento', I18n.te('La fecha de nacimiento no puede ser futura.', 'Date of birth cannot be in the future.')); firstBad = firstBad || form.nacimiento; }
            }

            if (firstBad) {
                if (privacy.checked) showError(I18n.te('Revisa los campos marcados en rojo.', 'Please review the fields marked in red.'));
                (firstBad.scrollIntoView ? firstBad : privacy).scrollIntoView({ behavior: 'smooth', block: 'center' });
                (firstBad.focus ? firstBad : privacy).focus?.({ preventScroll: true });
                return;
            }

            // En modo perfil el correo SIEMPRE es el de la sesión: no se puede
            // usar este formulario para registrar a una persona distinta.
            const emailFinal = modoPerfil ? sesion.email : email;

            const perfil = {
                nombre, email: emailFinal,
                telefono, direccion,
                nacimiento,
                preferencias: g('preferencias'),
                identificacion: g('identificacion'),
                pago: g('pago'),
            };

            const orig = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${I18n.te('Procesando...', 'Processing...')}`;

            try {
                if (modoPerfil) {
                    await API.updatePerfil(perfil);
                    Auth.setSessionPerfil?.(perfil);
                    if (cambiarPass) {
                        const r = await Auth.updatePassword(sesion.email, pass);
                        if (!r.ok) {
                            showError(r.msg);
                            fieldError('password', r.msg);
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = orig;
                            return;
                        }
                        showToast(I18n.te('Contraseña actualizada correctamente', 'Password updated successfully'), 'success');
                    }
                    showToast(I18n.te('Perfil actualizado correctamente', 'Profile updated successfully'), 'success');
                    // Restablecer solo lo sensible, conservando los datos del perfil
                    privacy.checked = false;
                    if (changeCheck) changeCheck.checked = false;
                    passWrap?.classList.add('hidden');
                    pass2Wrap?.classList.add('hidden');
                    form.password.value = '';
                    form.password2.value = '';
                    form.password.required = false;
                    form.password2.required = false;
                } else {
                    // Registro nuevo: crea cuenta + perfil en el backend
                    const r = await Auth.register(perfil);
                    if (!r.ok) {
                        showError(r.msg);
                        if (/correo/i.test(r.msg)) fieldError('email', r.msg);
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = orig;
                        return;
                    }
                    showToast(I18n.te(`¡Cuenta creada! Bienvenido/a, ${nombre}`, `Account created! Welcome, ${nombre}`), 'success');
                    Auth.renderNavAuth();
                    submitBtn.innerHTML = `<i class="fa-solid fa-user-pen mr-2"></i>${I18n.te('Actualizar mi perfil', 'Update my profile')}`;
                    form.reset();
                    document.getElementById('privacyCheck').checked = false;
                }
            } catch (err) {
                console.error(err);
                showError(I18n.te('Ocurrió un error inesperado. Intenta de nuevo.', 'An unexpected error occurred. Please try again.'));
            }
            submitBtn.disabled = false;
            if (submitBtn.innerHTML.includes('Procesando')) submitBtn.innerHTML = orig;
        });
    }

    return { init };
})();
