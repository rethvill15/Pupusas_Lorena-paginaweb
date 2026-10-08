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

        console.log("Estado de sesión:", resultado);

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