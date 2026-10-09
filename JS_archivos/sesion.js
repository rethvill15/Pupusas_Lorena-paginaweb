
/* =========================================================
   SISTEMA DE SESIÓN - PUPUSAS LORENA
   ========================================================= */

async function obtenerSesion() {

    try {

        const respuesta = await fetch(
            "/Pupusas_paginaweb/api/sesion.php",
            {
                method: "GET",
                cache: "no-store",
                credentials: "same-origin"
            }
        );

        if (!respuesta.ok) {
            throw new Error("No fue posible consultar la sesión.");
        }

        return await respuesta.json();

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

    // Limpiar las opciones anteriores.
    usuarioNav.replaceChildren();

    /* =====================================================
       USUARIO CON SESIÓN ACTIVA
       ===================================================== */

    if (
        resultado.exito &&
        resultado.sesion_activa &&
        resultado.usuario
    ) {

        // Saludo personalizado.
        const saludo = document.createElement("span");
        saludo.className = "nav-item usuario-nombre";
        saludo.textContent = "Hola, " + resultado.usuario.nombres;

        usuarioNav.appendChild(saludo);

        // Enlace a Mi cuenta.
        const enlaceCuenta = document.createElement("a");
        enlaceCuenta.href = "Mi_cuenta/mi_cuenta.html";
        enlaceCuenta.className = "nav-item";
        enlaceCuenta.textContent = "Mi cuenta";

        usuarioNav.appendChild(enlaceCuenta);

        // Enlace para cerrar sesión.
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
   CERRAR SESIÓN
   ========================================================= */

async function cerrarSesion(event) {

    event.preventDefault();

    try {

        const respuesta = await fetch(
            "/Pupusas_paginaweb/api/logout.php",
            {
                method: "GET",
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

        alert("No fue posible comunicarse con el servidor.");
    }
}


/* =========================================================
   INICIALIZAR SISTEMA DE SESIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    actualizarUsuarioNav
);

