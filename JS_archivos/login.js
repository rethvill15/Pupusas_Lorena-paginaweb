
document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("loginForm");

    if (!formulario) {
        return;
    }


    formulario.addEventListener("submit", async function (event) {

        event.preventDefault();


        // ==========================================
        // OBTENER DATOS DEL FORMULARIO
        // ==========================================

        const correo = document.getElementById("correo").value.trim();
        const password = document.getElementById("password").value;


        // ==========================================
        // VALIDACIONES BASICAS
        // ==========================================

        if (correo === "" || password === "") {

            alert("Completa todos los campos.");

            return;
        }


        // ==========================================
        // PREPARAR DATOS
        // ==========================================

        const datos = {
            correo: correo,
            password: password
        };


        try {

            // ==========================================
            // OBTENER TOKEN CSRF DE LA SESIÓN
            // ==========================================

            const respuestaSesion = await fetch(
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


            const sesion = await respuestaSesion.json();


            if (
                !respuestaSesion.ok ||
                !sesion.exito
            ) {

                throw new Error(
                    "No fue posible obtener la sesión de seguridad."
                );

            }


            // ==========================================
            // VALIDAR TOKEN CSRF
            // ==========================================

            if (
                typeof sesion.token_csrf !== "string" ||
                !/^[a-f0-9]{64}$/i.test(sesion.token_csrf)
            ) {

                throw new Error(
                    "El token de seguridad no es válido."
                );

            }


            const tokenCsrf = sesion.token_csrf;


            // ==========================================
            // ENVIAR DATOS AL API
            // ==========================================

            const respuesta = await fetch(
                "/Pupusas_paginaweb/api/login.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": tokenCsrf
                    },

                    credentials: "same-origin",

                    cache: "no-store",

                    body: JSON.stringify(datos)
                }
            );


            // ==========================================
            // LEER RESPUESTA
            // ==========================================

            const resultado = await respuesta.json();


            // ==========================================
            // PROCESAR RESPUESTA
            // ==========================================

            if (resultado.exito) {


                // ======================================
                // VERIFICAR TOKEN DE LA NUEVA SESIÓN
                // ======================================

                if (
                    typeof resultado.token_csrf !== "string" ||
                    !/^[a-f0-9]{64}$/i.test(resultado.token_csrf)
                ) {

                    throw new Error(
                        "No se recibió el nuevo token de seguridad."
                    );

                }


                // ======================================
                // VERIFICAR CAMBIO OBLIGATORIO
                // ======================================

                if (resultado.requiere_cambio_password) {

                    alert(
                        "Bienvenido/a " +
                        resultado.usuario.nombres +
                        ". Por seguridad, debes cambiar tu contraseña temporal antes de continuar."
                    );

                    window.location.href =
                        "/Pupusas_paginaweb/Pupusa_paginaweb/Mi_cuenta/cambiar_password.html";

                    return;
                }


                // ======================================
                // INICIO DE SESIÓN NORMAL
                // ======================================

                alert(
                    resultado.mensaje +
                    "\nBienvenido/a " +
                    resultado.usuario.nombres
                );

                window.location.href =
                    "/Pupusas_paginaweb/Pupusa_paginaweb/Mi_cuenta/mi_cuenta.html";


            } else {

                alert(
                    resultado.mensaje ||
                    "No fue posible iniciar sesión."
                );

            }


        } catch (error) {

            console.error(
                "Error al iniciar sesión:",
                error
            );

            alert(
                error.message === "Failed to fetch"
                    ? "No fue posible comunicarse con el servidor."
                    : error.message
            );

        }

    });

});
