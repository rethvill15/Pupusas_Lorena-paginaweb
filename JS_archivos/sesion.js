/* =========================================================
   SISTEMA DE SESIÓN - PUPUSAS LORENA
   ========================================================= */


async function obtenerSesion() {

    try {

        const respuesta = await fetch(
            "/Pupusas_paginaweb/api/sesion.php",
            {
                method: "GET",
                cache: "no-store"
            }
        );


        const resultado = await respuesta.json();


        console.log(
            "Estado de sesión:",
            resultado
        );


        return resultado;

    } catch (error) {

        console.error(
            "No fue posible consultar la sesión:",
            error
        );


        return {
            exito: false,
            sesion_activa: false
        };

    }

}


/* =========================================================
   ACTUALIZAR ZONA DEL USUARIO
   ========================================================= */

async function actualizarUsuarioNav() {

    const usuarioNav =
        document.getElementById("usuarioNav");


    if (!usuarioNav) {
        return;
    }


    const resultado =
        await obtenerSesion();


    /* =====================================================
       USUARIO CON SESIÓN ACTIVA
       ===================================================== */

    if (
        resultado.exito &&
        resultado.sesion_activa &&
        resultado.usuario
    ) {

        const nombre =
            resultado.usuario.nombres;


        usuarioNav.innerHTML = `

            <span class="nav-item usuario-nombre">
                Hola, ${nombre}
            </span>

            <a
                href="#"
                class="nav-item"
                id="enlaceLogout">

                Cerrar sesión

            </a>

        `;


        /* =================================================
           BOTÓN CERRAR SESIÓN
           ================================================= */

        const enlaceLogout =
            document.getElementById("enlaceLogout");


        enlaceLogout.addEventListener(
            "click",
            cerrarSesion
        );


    }


    /* =====================================================
       USUARIO SIN SESIÓN
       ===================================================== */

    else {

        usuarioNav.innerHTML = `

            <a
                href="Inicio_sesion/login.html"
                class="nav-item">

                Iniciar sesión

            </a>

            <a
                href="Registro_usuario/Registro_user.html"
                class="nav-item">

                Crear cuenta

            </a>

        `;

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
                cache: "no-store"
            }
        );


        const resultado =
            await respuesta.json();


        if (resultado.exito) {

            alert(
                resultado.mensaje
            );


            window.location.href =
                "/Pupusas_paginaweb/Pupusa_paginaweb/pup_lorena.html";


        } else {

            alert(
                resultado.mensaje ||
                "No fue posible cerrar la sesión."
            );

        }


    } catch (error) {

        console.error(
            "Error al cerrar sesión:",
            error
        );


        alert(
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