
/* =========================================================
   MI CUENTA
   PUPUSAS LORENA
   Los datos se obtienen exclusivamente de la sesión activa.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. ELEMENTOS HTML
       ===================================================== */

    const estado = document.getElementById("estadoCuenta");
    const tarjeta = document.getElementById("datosUsuario");
    const aviso = document.getElementById("enlaceLogin");
    const botonSalir = document.getElementById("cerrarSesion");

    const apiBase = "../../api/";

    let tokenCsrf = null;
    let cerrandoSesion = false;


    /* =====================================================
       2. CARGAR INFORMACIÓN DE LA CUENTA
       ===================================================== */

    async function cargarMiCuenta() {

        estado.hidden = false;

        estado.innerHTML =
            '<span class="spinner" aria-hidden="true"></span> Comprobando tu sesión...';

        tarjeta.hidden = true;
        aviso.hidden = true;
        botonSalir.hidden = true;

        tokenCsrf = null;

        try {

            const response = await fetch(
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

            if (!response.ok) {

                throw new Error(
                    "El servidor respondió con un error (" +
                    response.status +
                    ")."
                );
            }

            const data = await response.json();


            // ==========================================
            // COMPROBAR SESIÓN ACTIVA
            // ==========================================

            if (
                !data.exito ||
                !data.sesion_activa ||
                !data.usuario
            ) {

                estado.textContent =
                    "No has iniciado sesión. Inicia sesión para consultar tu cuenta.";

                aviso.hidden = false;

                return;
            }


            // ==========================================
            // CAMBIO OBLIGATORIO DE CONTRASEÑA
            // ==========================================

            if (data.requiere_cambio_password) {

                window.location.replace(
                    "cambiar_password.html"
                );

                return;
            }


            // ==========================================
            // VALIDAR ROL
            // ==========================================

            const rol = data.usuario.rol;

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
                typeof data.token_csrf !== "string" ||
                !/^[a-f0-9]{64}$/.test(data.token_csrf)
            ) {

                throw new Error(
                    "No se recibió un token de seguridad válido."
                );
            }

            tokenCsrf = data.token_csrf;


            // ==========================================
            // MOSTRAR DATOS DEL USUARIO
            // ==========================================

            const user = data.usuario;

            document.getElementById("nombreCompleto").textContent =
                [user.nombres, user.apellidos]
                    .filter(Boolean)
                    .join(" ") || "No registrado";

            document.getElementById("correo").textContent =
                user.correo || "No registrado";

            document.getElementById("telefono").textContent =
                user.telefono || "No registrado";

            document.getElementById("direccion").textContent =
                user.direccion || "No registrada";


            // ==========================================
            // MOSTRAR CUENTA
            // ==========================================

            estado.textContent =
                "¡Bienvenido/a a tu cuenta!";

            tarjeta.hidden = false;

            botonSalir.hidden = false;


        } catch (error) {

            console.error(
                "Error al cargar Mi cuenta:",
                error
            );

            tokenCsrf = null;

            estado.textContent =
                "No fue posible cargar tu cuenta. Comprueba que Apache y MySQL estén funcionando y vuelve a intentarlo.";
        }
    }


    /* =====================================================
       3. CERRAR SESIÓN CON PROTECCIÓN CSRF
       ===================================================== */

    botonSalir.addEventListener("click", async () => {

        if (cerrandoSesion) return;


        // ==========================================
        // COMPROBAR TOKEN CSRF
        // ==========================================

        if (
            typeof tokenCsrf !== "string" ||
            !/^[a-f0-9]{64}$/.test(tokenCsrf)
        ) {

            alert(
                "No se pudo validar la seguridad de la sesión. Recarga la página e inténtalo nuevamente."
            );

            return;
        }


        cerrandoSesion = true;

        botonSalir.disabled = true;

        const textoOriginal = botonSalir.textContent;

        botonSalir.textContent = "Cerrando sesión...";


        try {

            const response = await fetch(
                apiBase + "logout.php",
                {
                    method: "POST",

                    cache: "no-store",

                    credentials: "same-origin",

                    headers: {
                        "Accept": "application/json",
                        "X-CSRF-Token": tokenCsrf
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.exito) {

                throw new Error(
                    data.mensaje ||
                    "No fue posible cerrar la sesión."
                );
            }


            // ==========================================
            // REGRESAR A LA PÁGINA PRINCIPAL
            // ==========================================

            window.location.replace(
                "../pup_lorena.html"
            );


        } catch (error) {

            console.error(
                "Error al cerrar sesión:",
                error
            );

            alert(
                error.message ||
                "No fue posible comunicarse con el servidor."
            );

            cerrandoSesion = false;

            botonSalir.disabled = false;

            botonSalir.textContent = textoOriginal;
        }
    });


    /* =====================================================
       4. INICIAR
       ===================================================== */

    cargarMiCuenta();

});
