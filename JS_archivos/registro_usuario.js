document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("registroForm");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", async function (event) {

        event.preventDefault();

        const nombres = document.getElementById("nombres").value.trim();
        const apellidos = document.getElementById("apellidos").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const direccion = document.getElementById("direccion").value.trim();
        const password = document.getElementById("password").value;
        const confirmarPassword = document.getElementById("confirmarPassword").value;


        // ==========================================
        // VALIDACIONES BÁSICAS DEL FORMULARIO
        // ==========================================

        if (
            nombres === "" ||
            apellidos === "" ||
            correo === "" ||
            telefono === "" ||
            direccion === "" ||
            password === "" ||
            confirmarPassword === ""
        ) {
            alert("Completa todos los campos.");
            return;
        }


        if (password.length < 8) {
            alert("La contraseña debe tener al menos 8 caracteres.");
            return;
        }


        if (password !== confirmarPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }


        // ==========================================
        // PREPARAR DATOS PARA EL API
        // ==========================================

        const datos = {
            nombres: nombres,
            apellidos: apellidos,
            correo: correo,
            telefono: telefono,
            direccion: direccion,
            password: password,
            confirmar_password: confirmarPassword
        };


        try {

            const respuesta = await fetch(
                "../api/usuarios.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datos)
                }
            );


            const resultado = await respuesta.json();


            // ==========================================
            // RESPUESTA DEL API
            // ==========================================

            if (resultado.exito) {

                alert(
                    resultado.mensaje +
                    "\nID de usuario: " +
                    resultado.id_usuario
                );

                formulario.reset();

            } else {

                alert(resultado.mensaje);

            }


        } catch (error) {

            console.error("Error al registrar usuario:", error);

            alert(
                "No fue posible comunicarse con el servidor."
            );

        }

    });

});