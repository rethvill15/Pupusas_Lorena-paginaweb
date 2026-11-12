
/* =========================================================
   SISTEMA DE SESIÓN - PUPUSAS LORENA
   ========================================================= */

async function obtenerSesion() {

    try {

        const respuesta = await fetch(
            "/Pupusas_paginaweb/api/sesion.php",
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                resultado.mensaje ||
                "No fue posible consultar la sesión."
            );
        }

        return resultado;

    } catch (error) {

        console.error("Error al consultar la sesión:", error);

        return {
            exito: false,
            sesion_activa: false
        };
    }
}


/* =========================================================
   ACTUALIZAR ZONA DEL USUARIO EN LA NAVEGACIÓN
   ========================================================= */

async function actualizarUsuarioNav() {

    const usuarioNav = document.getElementById("usuarioNav");

    if (!usuarioNav) {
        return;
    }

    const resultado = await obtenerSesion();

    usuarioNav.replaceChildren();

    /* =====================================================
       USUARIO CON SESIÓN ACTIVA
       ===================================================== */

    if (
        resultado.exito &&
        resultado.sesion_activa &&
        resultado.usuario
    ) {

        const saludo = document.createElement("span");
        saludo.className = "nav-item usuario-nombre";
        saludo.textContent = "Hola, " + resultado.usuario.nombres;

        usuarioNav.appendChild(saludo);

        const enlaceCuenta = document.createElement("a");
        enlaceCuenta.href = "Mi_cuenta/mi_cuenta.html";
        enlaceCuenta.className = "nav-item";
        enlaceCuenta.textContent = "Mi cuenta";

        usuarioNav.appendChild(enlaceCuenta);

        const enlaceLogout = document.createElement("a");
        enlaceLogout.href = "#";
        enlaceLogout.className = "nav-item";
        enlaceLogout.textContent = "Cerrar sesión";

        enlaceLogout.addEventListener("click", cerrarSesion);

        usuarioNav.appendChild(enlaceLogout);

    } else {

        /* =================================================
           USUARIO SIN SESIÓN
           ================================================= */

        const enlaceLogin = document.createElement("a");
        enlaceLogin.href = "Inicio_sesion/login.html";
        enlaceLogin.className = "nav-item";
        enlaceLogin.textContent = "Iniciar sesión";

        usuarioNav.appendChild(enlaceLogin);

        const enlaceRegistro = document.createElement("a");
        enlaceRegistro.href = "Registro_usuario/Registro_user.html";
        enlaceRegistro.className = "nav-item";
        enlaceRegistro.textContent = "Crear cuenta";

        usuarioNav.appendChild(enlaceRegistro);
    }
}


/* =========================================================
   CERRAR SESIÓN CON PROTECCIÓN CSRF
   ========================================================= */

async function cerrarSesion(event) {

    event.preventDefault();

    try {

        // Consultar la sesión y obtener un token CSRF vigente.
        const sesion = await obtenerSesion();

        if (
            !sesion.exito ||
            !sesion.sesion_activa
        ) {
            alert("No hay una sesión activa.");
            window.location.reload();
            return;
        }

        const tokenCsrf = sesion.token_csrf;

        if (
            typeof tokenCsrf !== "string" ||
            !/^[a-f0-9]{64}$/i.test(tokenCsrf)
        ) {
            throw new Error(
                "No se pudo obtener un token de seguridad válido."
            );
        }

        // Cerrar sesión mediante POST y enviar el token CSRF.
        const respuesta = await fetch(
            "/Pupusas_paginaweb/api/logout.php",
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "X-CSRF-Token": tokenCsrf
                },
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.exito) {

            alert("Sesión cerrada correctamente.");

            window.location.href =
                "/Pupusas_paginaweb/Pupusa_paginaweb/pup_lorena.html";

        } else {

            alert(
                resultado.mensaje ||
                "No fue posible cerrar la sesión."
            );
        }

    } catch (error) {

        console.error("Error al cerrar sesión:", error);

        alert(
            error.message ||
            "No fue posible comunicarse con el servidor."
        );
    }
}


/* =========================================================
   INICIALIZAR SISTEMA DE SESIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    actualizarUsuarioNav
);
