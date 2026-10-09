
/* =========================================================
   MI CUENTA - PUPUSAS LORENA
   ========================================================= */

document.addEventListener("DOMContentLoaded", cargarMiCuenta);

async function cargarMiCuenta() {

    const estado = document.getElementById("estadoCuenta");
    const datosUsuario = document.getElementById("datosUsuario");
    const enlaceLogin = document.getElementById("enlaceLogin");
    const botonCerrarSesion = document.getElementById("cerrarSesion");

    try {

        const respuesta = await fetch("../../api/sesion.php", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin"
        });

        const resultado = await respuesta.json();

        // Si no hay sesión, ocultar los datos personales.
        if (!resultado.sesion_activa || !resultado.usuario) {

            datosUsuario.hidden = true;
            botonCerrarSesion.hidden = true;
            enlaceLogin.hidden = false;

            estado.textContent =
                "No has iniciado sesión. Inicia sesión para consultar tu cuenta.";

            return;
        }

        const usuario = resultado.usuario;

        // Mostrar los datos de la cuenta.
        document.getElementById("nombres").textContent =
            usuario.nombres || "No registrado";

        document.getElementById("apellidos").textContent =
            usuario.apellidos || "No registrado";

        document.getElementById("correo").textContent =
            usuario.correo || "No registrado";

        document.getElementById("telefono").textContent =
            usuario.telefono || "No registrado";

        document.getElementById("direccion").textContent =
            usuario.direccion || "No registrada";

        estado.textContent = "¡Bienvenido/a a tu cuenta!";

        datosUsuario.hidden = false;
        enlaceLogin.hidden = true;
        botonCerrarSesion.hidden = false;

    } catch (error) {

        console.error("Error al cargar Mi cuenta:", error);

        datosUsuario.hidden = true;
        enlaceLogin.hidden = true;
        botonCerrarSesion.hidden = true;

        estado.textContent =
            "No fue posible cargar tu cuenta. Comprueba que Apache y MySQL estén funcionando y vuelve a intentarlo.";
    }
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

document.getElementById("cerrarSesion").addEventListener(
    "click",
    async function () {

        try {

            const respuesta = await fetch("../../api/logout.php", {
                method: "GET",
                cache: "no-store",
                credentials: "same-origin"
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                alert("Sesión cerrada correctamente.");
                window.location.reload();
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
);

