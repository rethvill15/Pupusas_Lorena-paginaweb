
document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("cambiarPasswordForm");
    const passwordNueva = document.getElementById("passwordNueva");
    const confirmarPassword = document.getElementById("confirmarPassword");
    const estadoCambio = document.getElementById("estadoCambio");
    const boton = document.getElementById("btnCambiarPassword");


    // ==========================================
    // VERIFICAR ELEMENTOS
    // ==========================================

    if (
        !formulario ||
        !passwordNueva ||
        !confirmarPassword ||
        !estadoCambio ||
        !boton
    ) {
        return;
    }


    // ==========================================
    // FUNCION PARA MOSTRAR MENSAJES
    // ==========================================

    function mostrarMensaje(mensaje, tipo) {

        estadoCambio.textContent = mensaje;
        estadoCambio.className = "estado-password " + tipo;

    }


    // ==========================================
    // VERIFICAR SESION Y CAMBIO OBLIGATORIO
    // ==========================================

    async function verificarSesion() {

        try {

            const respuesta = await fetch(
                "/Pupusas_paginaweb/api/sesion.php",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            const resultado = await respuesta.json();

            if (
                !resultado.exito ||
                !resultado.sesion_activa
            ) {

                alert("Debes iniciar sesión para continuar.");

                window.location.href =
                    "../Inicio_sesion/login.html";

                return false;
            }

            if (!resultado.requiere_cambio_password) {

                window.location.href = "mi_cuenta.html";

                return false;
            }

            return true;

        } catch (error) {

            console.error(
                "Error al verificar la sesión:",
                error
            );

            mostrarMensaje(
                "No fue posible verificar tu sesión. Recarga la página e inténtalo nuevamente.",
                "error"
            );

            formulario.querySelector("button[type='submit']").disabled = true;

            return false;

        }

    }


    // ==========================================
    // PROCESAR CAMBIO DE CONTRASEÑA
    // ==========================================

    formulario.addEventListener("submit", async function (event) {

        event.preventDefault();


        const nueva = passwordNueva.value;
        const confirmar = confirmarPassword.value;


        // ======================================
        // VALIDACIONES
        // ======================================

        if (nueva.length < 8) {

            mostrarMensaje(
                "La contraseña debe tener al menos 8 caracteres.",
                "error"
            );

            return;
        }


        if (nueva !== confirmar) {

            mostrarMensaje(
                "Las contraseñas no coinciden.",
                "error"
            );

            confirmarPassword.focus();

            return;
        }


        // ======================================
        // DESACTIVAR BOTON
        // ======================================

        boton.disabled = true;

        boton.textContent = "Actualizando contraseña...";


        mostrarMensaje(
            "Estamos actualizando tu contraseña.",
            "exito"
        );


        try {

            // ==================================
            // ENVIAR DATOS AL API
            // ==================================

            const respuesta = await fetch(
                "/Pupusas_paginaweb/api/cambiar_password.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        password_nueva: nueva,

                        confirmar_password: confirmar

                    })
                }
            );


            // ==================================
            // LEER RESPUESTA
            // ==================================

            const resultado = await respuesta.json();


            // ==================================
            // PROCESAR RESULTADO
            // ==================================

            if (!respuesta.ok || !resultado.exito) {

                mostrarMensaje(
                    resultado.mensaje ||
                    "No fue posible actualizar la contraseña.",
                    "error"
                );

                return;
            }


            mostrarMensaje(
                resultado.mensaje,
                "exito"
            );


            alert(
                "¡Contraseña actualizada correctamente!\nAhora puedes continuar utilizando tu cuenta."
            );


            // ==================================
            // REDIRIGIR A MI CUENTA
            // ==================================

            window.location.href = "mi_cuenta.html";


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

            boton.disabled = false;

            boton.innerHTML =
                '<i class="bi bi-shield-check" aria-hidden="true"></i> Guardar nueva contraseña';

        }

    });


    // ==========================================
    // INICIAR VERIFICACION
    // ==========================================

    verificarSesion();

});
