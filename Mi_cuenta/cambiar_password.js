
document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. ELEMENTOS DEL FORMULARIO
       ===================================================== */

    const formulario = document.getElementById("cambiarPasswordForm");
    const passwordNueva = document.getElementById("passwordNueva");
    const confirmarPassword = document.getElementById("confirmarPassword");
    const estadoCambio = document.getElementById("estadoCambio");
    const boton = document.getElementById("btnCambiarPassword");

    const apiBase = "/Pupusas_paginaweb/api/";

    let tokenCsrf = null;
    let sesionVerificada = false;
    let enviandoFormulario = false;


    /* =====================================================
       2. VERIFICAR ELEMENTOS
       ===================================================== */

    if (
        !formulario ||
        !passwordNueva ||
        !confirmarPassword ||
        !estadoCambio ||
        !boton
    ) {
        return;
    }


    /* =====================================================
       3. MOSTRAR MENSAJES
       ===================================================== */

    function mostrarMensaje(mensaje, tipo) {

        estadoCambio.textContent = mensaje;

        estadoCambio.className =
            "estado-password " + tipo;
    }


    /* =====================================================
       4. VERIFICAR SESIÓN Y OBTENER TOKEN CSRF
       ===================================================== */

    async function verificarSesion() {

        boton.disabled = true;

        try {

            const respuesta = await fetch(
                apiBase + "sesion.php?_=" + Date.now(),
                {
                    method: "GET",

                    cache: "no-store",

                    credentials: "same-origin",

                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!respuesta.ok) {

                throw new Error(
                    "No se pudo verificar la sesión."
                );
            }

            const resultado = await respuesta.json();


            // ==========================================
            // COMPROBAR SESIÓN ACTIVA
            // ==========================================

            if (
                !resultado.exito ||
                !resultado.sesion_activa ||
                !resultado.usuario
            ) {

                tokenCsrf = null;

                alert(
                    "Debes iniciar sesión para continuar."
                );

                window.location.replace(
                    "../Inicio_sesion/login.html"
                );

                return false;
            }


            // ==========================================
            // COMPROBAR CAMBIO OBLIGATORIO
            // ==========================================

            if (!resultado.requiere_cambio_password) {

                window.location.replace(
                    "mi_cuenta.html"
                );

                return false;
            }


            // ==========================================
            // VALIDAR ROL
            // ==========================================

            const rol = resultado.usuario.rol;

            if (
                rol !== "Cliente" &&
                rol !== "Administrador"
            ) {

                throw new Error(
                    "La cuenta tiene un rol no válido."
                );
            }


            // ==========================================
            // VALIDAR TOKEN CSRF
            // ==========================================

            if (
                typeof resultado.token_csrf !== "string" ||
                !/^[a-f0-9]{64}$/.test(resultado.token_csrf)
            ) {

                throw new Error(
                    "No se recibió un token de seguridad válido."
                );
            }

            tokenCsrf = resultado.token_csrf;

            sesionVerificada = true;

            boton.disabled = false;

            mostrarMensaje(
                "Tu sesión está verificada. Puedes establecer tu nueva contraseña.",
                "exito"
            );

            return true;


        } catch (error) {

            console.error(
                "Error al verificar la sesión:",
                error
            );

            tokenCsrf = null;

            sesionVerificada = false;

            mostrarMensaje(
                "No fue posible verificar tu sesión. Recarga la página e inténtalo nuevamente.",
                "error"
            );

            boton.disabled = true;

            return false;
        }
    }


    /* =====================================================
       5. PROCESAR CAMBIO DE CONTRASEÑA
       ===================================================== */

    formulario.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (enviandoFormulario) return;


        // ==========================================
        // COMPROBAR SESIÓN Y TOKEN
        // ==========================================

        if (
            !sesionVerificada ||
            typeof tokenCsrf !== "string" ||
            !/^[a-f0-9]{64}$/.test(tokenCsrf)
        ) {

            mostrarMensaje(
                "No se pudo validar la seguridad de tu sesión. Recarga la página.",
                "error"
            );

            boton.disabled = true;

            return;
        }


        const nueva = passwordNueva.value;
        const confirmar = confirmarPassword.value;


        // ==========================================
        // VALIDAR LONGITUD
        // ==========================================

        if (nueva.length < 8) {

            mostrarMensaje(
                "La contraseña debe tener al menos 8 caracteres.",
                "error"
            );

            passwordNueva.focus();

            return;
        }


        // ==========================================
        // VALIDAR CONFIRMACIÓN
        // ==========================================

        if (nueva !== confirmar) {

            mostrarMensaje(
                "Las contraseñas no coinciden.",
                "error"
            );

            confirmarPassword.focus();

            return;
        }


        // ==========================================
        // DESACTIVAR FORMULARIO
        // ==========================================

        enviandoFormulario = true;

        boton.disabled = true;

        boton.textContent =
            "Actualizando contraseña...";

        mostrarMensaje(
            "Estamos actualizando tu contraseña.",
            "exito"
        );


        try {

            // ======================================
            // ENVIAR DATOS AL API CON TOKEN CSRF
            // ======================================

            const respuesta = await fetch(
                apiBase + "cambiar_password.php",
                {
                    method: "POST",

                    cache: "no-store",

                    credentials: "same-origin",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": tokenCsrf
                    },

                    body: JSON.stringify({

                        password_nueva: nueva,

                        confirmar_password: confirmar

                    })
                }
            );


            // ======================================
            // LEER RESPUESTA
            // ======================================

            const resultado = await respuesta.json();


            // ======================================
            // COMPROBAR RESULTADO
            // ======================================

            if (!respuesta.ok || !resultado.exito) {

                mostrarMensaje(
                    resultado.mensaje ||
                    "No fue posible actualizar la contraseña.",
                    "error"
                );

                return;
            }


            // ======================================
            // CAMBIO EXITOSO
            // ======================================

            tokenCsrf = null;

            sesionVerificada = false;

            mostrarMensaje(
                resultado.mensaje ||
                "La contraseña se actualizó correctamente.",
                "exito"
            );

            alert(
                "¡Contraseña actualizada correctamente!\nAhora puedes continuar utilizando tu cuenta."
            );


            // ======================================
            // REGRESAR A MI CUENTA
            // ======================================

            window.location.replace(
                "mi_cuenta.html"
            );


        } catch (error) {

            console.error(
                "Error al cambiar la contraseña:",
                error
            );

            mostrarMensaje(
                "No fue posible comunicarse con el servidor.",
                "error"
            );

        } finally {

            enviandoFormulario = false;

            if (sesionVerificada) {

                boton.disabled = false;

                boton.innerHTML =
                    '<i class="bi bi-shield-check" aria-hidden="true"></i> Guardar nueva contraseña';
            }
        }

    });


    /* =====================================================
       6. INICIAR VERIFICACIÓN
       ===================================================== */

    verificarSesion();

});
