
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================

    const API_BASE = "/Pupusas_paginaweb/api/";

    let tokenCsrf = null;

    const estadoReservaciones = document.getElementById("estadoReservaciones");
    const contenedorReservaciones = document.getElementById("contenedorReservaciones");
    const listaReservaciones = document.getElementById("listaReservaciones");
    const totalReservaciones = document.getElementById("totalReservaciones");
    const sinReservaciones = document.getElementById("sinReservaciones");
    const avisoLogin = document.getElementById("avisoLogin");

    // Evitar errores si falta algún elemento del HTML.
    if (
        !estadoReservaciones ||
        !contenedorReservaciones ||
        !listaReservaciones ||
        !totalReservaciones ||
        !sinReservaciones ||
        !avisoLogin
    ) {
        console.error("No se encontraron todos los elementos de Mis reservaciones.");
        return;
    }


    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    function mostrarEstado(mensaje, esError = false) {
        estadoReservaciones.textContent = mensaje;
        estadoReservaciones.style.color = esError ? "#B3332B" : "#665548";
    }


    function crearElemento(etiqueta, clase, contenido) {
        const elemento = document.createElement(etiqueta);

        if (clase) {
            elemento.className = clase;
        }

        elemento.textContent = contenido;

        return elemento;
    }


    function formatearFecha(fecha) {
        const partes = fecha.split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const fechaLocal = new Date(
            Number(partes[0]),
            Number(partes[1]) - 1,
            Number(partes[2])
        );

        return fechaLocal.toLocaleDateString("es-NI", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    function formatearHora(hora) {
        const partes = hora.split(":");

        if (partes.length < 2) {
            return hora;
        }

        let horas = Number(partes[0]);
        const minutos = partes[1];

        const periodo = horas >= 12 ? "p. m." : "a. m.";

        horas = horas % 12 || 12;

        return `${horas}:${minutos} ${periodo}`;
    }


    function obtenerClaseEstado(estado) {
        const clases = {
            "Pendiente": "estado-pendiente",
            "Confirmada": "estado-confirmada",
            "Cancelada": "estado-cancelada",
            "Finalizada": "estado-finalizada"
        };

        return clases[estado] || "";
    }


    // ==========================================
    // CONSULTAR SESIÓN
    // ==========================================

    async function verificarSesion() {

        try {

            const respuesta = await fetch(
                API_BASE + "sesion.php",
                {
                    method: "GET",
                    cache: "no-store",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const sesion = await respuesta.json();

            if (!respuesta.ok || !sesion.exito) {
                throw new Error("No fue posible comprobar la sesión.");
            }


            if (!sesion.sesion_activa) {

                tokenCsrf = null;

                contenedorReservaciones.hidden = true;
                avisoLogin.hidden = false;

                mostrarEstado(
                    "Debes iniciar sesión para consultar tus reservaciones.",
                    true
                );

                return false;
            }


            if (sesion.requiere_cambio_password) {

                tokenCsrf = null;

                window.location.href = "cambiar_password.html";

                return false;
            }


            // Esta página es exclusivamente para clientes.
            if (
                !sesion.usuario ||
                sesion.usuario.rol !== "Cliente"
            ) {

                tokenCsrf = null;

                contenedorReservaciones.hidden = true;
                avisoLogin.hidden = false;

                mostrarEstado(
                    "Esta sección está destinada a clientes. El administrador gestionará las reservaciones desde su panel."
                );

                return false;
            }


            // Validar el token CSRF recibido desde sesion.php.
            if (
                typeof sesion.token_csrf !== "string" ||
                !/^[a-f0-9]{64}$/i.test(sesion.token_csrf)
            ) {

                throw new Error(
                    "No se pudo obtener un token de seguridad válido. Recarga la página."
                );
            }

            tokenCsrf = sesion.token_csrf;


            avisoLogin.hidden = true;
            contenedorReservaciones.hidden = false;

            return true;

        } catch (error) {

            console.error("Error al comprobar sesión:", error);

            tokenCsrf = null;

            contenedorReservaciones.hidden = true;
            avisoLogin.hidden = false;

            mostrarEstado(
                error.message || "No fue posible comprobar tu sesión. Intenta nuevamente.",
                true
            );

            return false;
        }
    }


    // ==========================================
    // CONSULTAR RESERVACIONES
    // ==========================================

    async function cargarReservaciones() {

        listaReservaciones.replaceChildren();
        sinReservaciones.hidden = true;

        mostrarEstado("Cargando tus reservaciones...");

        try {

            const respuesta = await fetch(
                API_BASE + "reservaciones.php",
                {
                    method: "GET",
                    cache: "no-store",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.exito) {

                throw new Error(
                    datos.mensaje || "No fue posible consultar las reservaciones."
                );
            }

            const reservaciones = Array.isArray(datos.reservaciones)
                ? datos.reservaciones
                : [];

            totalReservaciones.textContent = reservaciones.length;


            if (reservaciones.length === 0) {

                sinReservaciones.hidden = false;

                mostrarEstado("No tienes reservaciones registradas.");

                return;
            }


            mostrarEstado(
                "Estas son las reservaciones asociadas a tu cuenta."
            );


            reservaciones.forEach(function (reservacion) {

                listaReservaciones.appendChild(
                    crearTarjetaReservacion(reservacion)
                );

            });

        } catch (error) {

            console.error("Error al cargar reservaciones:", error);

            mostrarEstado(
                error.message || "Ocurrió un error al cargar tus reservaciones.",
                true
            );
        }
    }


    // ==========================================
    // CREAR TARJETA DE RESERVACIÓN
    // ==========================================

    function crearTarjetaReservacion(reservacion) {

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-reservacion";

        const encabezado = document.createElement("div");
        encabezado.className = "reservacion-encabezado";

        encabezado.appendChild(
            crearElemento(
                "span",
                "reservacion-id",
                `Reservación #${reservacion.id_reservacion}`
            )
        );


        const estado = crearElemento(
            "span",
            "estado-badge " + obtenerClaseEstado(reservacion.estado),
            reservacion.estado
        );

        encabezado.appendChild(estado);

        tarjeta.appendChild(encabezado);


        const datos = document.createElement("div");
        datos.className = "datos-reservacion";


        const campos = [
            {
                titulo: "Nombre",
                valor: reservacion.nombre_reserva
            },
            {
                titulo: "Fecha",
                valor: formatearFecha(reservacion.fecha)
            },
            {
                titulo: "Hora",
                valor: formatearHora(reservacion.hora)
            },
            {
                titulo: "Personas",
                valor: String(reservacion.cantidad_personas)
            },
            {
                titulo: "¿Asisten niños?",
                valor: reservacion.ninos === "si" ? "Sí" : "No"
            }
        ];


        if (reservacion.observaciones) {

            campos.push({
                titulo: "Observaciones",
                valor: reservacion.observaciones,
                clase: "dato-completo"
            });

        }


        campos.forEach(function (campo) {

            const dato = document.createElement("div");

            dato.className = "dato-reservacion";

            if (campo.clase) {
                dato.classList.add(campo.clase);
            }

            dato.appendChild(
                crearElemento("strong", "", campo.titulo)
            );

            dato.appendChild(
                crearElemento("span", "", campo.valor ?? "")
            );

            datos.appendChild(dato);

        });


        tarjeta.appendChild(datos);


        // Solo se permite solicitar la cancelación
        // cuando la reservación está pendiente.
        if (reservacion.estado === "Pendiente") {

            const acciones = document.createElement("div");
            acciones.className = "acciones-reservacion";

            const botonCancelar = crearElemento(
                "button",
                "boton-cancelar",
                "Cancelar reservación"
            );

            botonCancelar.type = "button";

            botonCancelar.addEventListener("click", function () {

                cancelarReservacion(
                    reservacion.id_reservacion,
                    botonCancelar
                );

            });

            acciones.appendChild(botonCancelar);

            tarjeta.appendChild(acciones);
        }

        return tarjeta;
    }


    // ==========================================
    // CANCELAR RESERVACIÓN
    // ==========================================

    async function cancelarReservacion(idReservacion, boton) {

        const confirmar = window.confirm(
            `¿Estás seguro de que deseas cancelar la reservación #${idReservacion}?\n\nEsta acción cambiará su estado a Cancelada.`
        );

        if (!confirmar) {
            return;
        }


        // Comprobar que exista un token CSRF antes de modificar.
        if (
            typeof tokenCsrf !== "string" ||
            !/^[a-f0-9]{64}$/i.test(tokenCsrf)
        ) {

            alert(
                "Tu sesión de seguridad no está disponible. Recarga la página e inténtalo nuevamente."
            );

            return;
        }


        boton.disabled = true;
        boton.textContent = "Cancelando...";


        try {

            const respuesta = await fetch(
                API_BASE + "reservaciones.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": tokenCsrf
                    },
                    credentials: "same-origin",
                    cache: "no-store",
                    body: JSON.stringify({
                        accion: "cambiar_estado",
                        id_reservacion: Number(idReservacion),
                        nuevo_estado: "Cancelada"
                    })
                }
            );


            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito) {

                throw new Error(
                    resultado.mensaje || "No fue posible cancelar la reservación."
                );
            }


            alert("La reservación fue cancelada correctamente.");

            await cargarReservaciones();

        } catch (error) {

            console.error("Error al cancelar reservación:", error);

            alert(
                error.message || "Ocurrió un error al cancelar la reservación."
            );

            boton.disabled = false;
            boton.textContent = "Cancelar reservación";
        }
    }


    // ==========================================
    // INICIO
    // ==========================================

    async function iniciarPagina() {

        const sesionValida = await verificarSesion();

        if (!sesionValida) {
            return;
        }

        await cargarReservaciones();
    }

    iniciarPagina();

});
