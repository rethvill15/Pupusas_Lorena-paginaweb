
/* =========================================================
   PANEL DE ADMINISTRADOR - PUPUSAS LORENA
   Control de sesión y acceso administrativo
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const estadoAdmin = document.getElementById("estadoAdmin");
    const avisoAcceso = document.getElementById("avisoAcceso");
    const modulosAdmin = document.getElementById("modulosAdmin");

    const tituloAviso = document.getElementById("tituloAviso");
    const mensajeAviso = document.getElementById("mensajeAviso");

    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    const API_SESION = "../../api/sesion.php";
    const API_LOGOUT = "../../api/logout.php";

    let cerrandoSesion = false;
    let tokenCsrf = null;


    /* =====================================================
       MOSTRAR ESTADO DEL PANEL
       ===================================================== */

    function mostrarEstado(mensaje) {

        if (!estadoAdmin) return;

        estadoAdmin.hidden = false;
        estadoAdmin.textContent = mensaje;
    }


    /* =====================================================
       MOSTRAR AVISO DE ACCESO
       ===================================================== */

    function mostrarAviso(titulo, mensaje, tipo = "error") {

        if (modulosAdmin) {
            modulosAdmin.hidden = true;
        }

        if (estadoAdmin) {
            estadoAdmin.hidden = true;
        }

        if (avisoAcceso) {
            avisoAcceso.hidden = false;
        }

        if (tituloAviso) {
            tituloAviso.textContent = titulo;
        }

        if (mensajeAviso) {
            mensajeAviso.textContent = mensaje;
        }

        // Ajustar el enlace del aviso según el tipo de acceso.
        const enlaceAviso = avisoAcceso?.querySelector("a");

        if (enlaceAviso) {

            if (tipo === "sin-sesion") {
                enlaceAviso.href = "../Inicio_sesion/login.html";
                enlaceAviso.textContent = "Iniciar sesión";
            } else {
                enlaceAviso.href = "../pup_lorena.html";
                enlaceAviso.textContent = "Volver al inicio";
            }
        }
    }


    /* =====================================================
       COMPROBAR SESIÓN Y ROL
       ===================================================== */

    async function verificarAccesoAdmin() {

        try {

            mostrarEstado("Verificando permisos de administrador...");

            const respuesta = await fetch(
                `${API_SESION}?_=${Date.now()}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo consultar la sesión.");
            }

            const datos = await respuesta.json();


            // ---------------------------------------------
            // 1. Comprobar si existe una sesión
            // ---------------------------------------------

            if (!datos.sesion_activa || !datos.usuario) {

                mostrarAviso(
                    "Inicia sesión para continuar",
                    "Debes iniciar sesión con una cuenta administradora para acceder a este panel.",
                    "sin-sesion"
                );

                return;
            }


            // ---------------------------------------------
            // 2. Comprobar cambio obligatorio de contraseña
            // ---------------------------------------------

            if (datos.requiere_cambio_password) {

                window.location.replace(
                    "../Mi_cuenta/cambiar_password.html"
                );

                return;
            }


            // ---------------------------------------------
            // 3. Comprobar rol
            // ---------------------------------------------

            const rol = datos.usuario.rol;

            if (rol !== "Administrador") {

                mostrarAviso(
                    "Acceso restringido",
                    "Tu cuenta no tiene permisos para acceder al panel de administración."
                );

                return;
            }


            // ---------------------------------------------
            // 3.1. Validar y guardar el token CSRF
            // ---------------------------------------------

            if (
                typeof datos.token_csrf !== "string" ||
                !/^[a-f0-9]{64}$/.test(datos.token_csrf)
            ) {
                throw new Error("No se recibió un token CSRF válido.");
            }

            tokenCsrf = datos.token_csrf;


            // ---------------------------------------------
            // 4. Acceso autorizado
            // ---------------------------------------------

            if (avisoAcceso) {
                avisoAcceso.hidden = true;
            }

            if (estadoAdmin) {
                estadoAdmin.hidden = true;
            }

            if (modulosAdmin) {
                modulosAdmin.hidden = false;
            }

        } catch (error) {

            console.error("Error al verificar el acceso:", error);

            mostrarAviso(
                "No se pudo verificar el acceso",
                "Ocurrió un problema al consultar tu sesión. Comprueba tu conexión e intenta recargar la página."
            );
        }
    }


    /* =====================================================
       CERRAR SESIÓN
       ===================================================== */

    async function cerrarSesion() {

        if (cerrandoSesion) return;

        const confirmar = window.confirm(
            "¿Estás seguro de que deseas cerrar tu sesión?"
        );

        if (!confirmar) return;

        cerrandoSesion = true;

        if (btnCerrarSesion) {
            btnCerrarSesion.disabled = true;
            btnCerrarSesion.textContent = "Cerrando sesión...";
        }

        try {

            // Comprobar que exista un token CSRF antes de enviarlo.
            if (
                typeof tokenCsrf !== "string" ||
                !/^[a-f0-9]{64}$/.test(tokenCsrf)
            ) {
                throw new Error("El token CSRF no está disponible.");
            }

            const respuesta = await fetch(
                `${API_LOGOUT}?_=${Date.now()}`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json",
                        "X-CSRF-Token": tokenCsrf
                    }
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo cerrar la sesión.");
            }

            const datos = await respuesta.json();

            if (!datos.exito) {
                throw new Error(
                    datos.mensaje || "No se pudo cerrar la sesión."
                );
            }

            window.location.replace(
                "../Inicio_sesion/login.html"
            );

        } catch (error) {

            console.error("Error al cerrar sesión:", error);

            window.alert(
                "No fue posible cerrar la sesión. Inténtalo nuevamente."
            );

            cerrandoSesion = false;

            if (btnCerrarSesion) {
                btnCerrarSesion.disabled = false;
                btnCerrarSesion.innerHTML =
                    '<i class="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión';
            }
        }
    }


    /* =====================================================
       EVENTOS
       ===================================================== */

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", cerrarSesion);
    }


    /* =====================================================
       INICIAR PANEL
       ===================================================== */

    verificarAccesoAdmin();

});
