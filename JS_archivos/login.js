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
        // VALIDACIONES BÁSICAS
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
            // ENVIAR DATOS AL API
            // ==========================================

            const respuesta = await fetch(
                "/Pupusas_paginaweb/api/login.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

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

                alert(
                    resultado.mensaje +
                    "\nBienvenido/a " +
                    resultado.usuario.nombres
                );

            } else {

                alert(resultado.mensaje);

            }


        } catch (error) {

            console.error(
                "Error al iniciar sesión:",
                error
            );

            alert(
                "No fue posible comunicarse con el servidor."
            );

        }

    });

});